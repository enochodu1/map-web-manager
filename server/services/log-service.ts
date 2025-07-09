import { Logger } from 'winston';
import Database from '../database';
import { MCPLog, LogConfig } from '../types';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream, WriteStream } from 'fs';
import { WebSocketService } from './websocket-service';

export class LogService {
  private logStreams: Map<string, WriteStream> = new Map();
  private config: LogConfig = {
    level: 'info',
    retention: 7,
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    directory: 'logs'
  };

  constructor(
    private database: Database,
    private logger: Logger,
    private wsService?: WebSocketService
  ) {}

  public async initialize(): Promise<void> {
    try {
      // Ensure log directory exists
      await fs.mkdir(this.config.directory, { recursive: true });

      // Clean up old logs
      await this.cleanupOldLogs();

      this.logger.info('Log service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize log service:', error);
      throw error;
    }
  }

  public async log(serverId: string, level: MCPLog['level'], message: string, metadata?: any): Promise<void> {
    try {
      const log: MCPLog = {
        id: this.generateLogId(),
        serverId,
        level,
        message,
        timestamp: new Date().toISOString(),
        metadata
      };

      // Save to database
      await this.database.saveLog(log);

      // Write to file
      await this.writeLogToFile(log);

      // Notify clients via WebSocket
      if (this.wsService) {
        this.wsService.emitToServer(serverId, 'server_log', log);
      }
    } catch (error) {
      this.logger.error(`Failed to save log for server ${serverId}:`, error);
      throw error;
    }
  }

  public async getLogs(serverId: string, options: {
    level?: MCPLog['level'];
    startTime?: string;
    endTime?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<MCPLog[]> {
    try {
      return await this.database.getLogs(serverId, options);
    } catch (error) {
      this.logger.error(`Failed to get logs for server ${serverId}:`, error);
      throw error;
    }
  }

  public async clearLogs(serverId: string): Promise<void> {
    try {
      // Delete from database
      await this.database.clearLogs(serverId);

      // Delete log file
      const logFile = path.join(this.config.directory, `${serverId}.log`);
      await fs.unlink(logFile).catch(() => {});

      this.logger.info(`Cleared logs for server ${serverId}`);
    } catch (error) {
      this.logger.error(`Failed to clear logs for server ${serverId}:`, error);
      throw error;
    }
  }

  public startLogging(serverId: string): void {
    if (!this.logStreams.has(serverId)) {
      const logFile = path.join(this.config.directory, `${serverId}.log`);
      const stream = createWriteStream(logFile, { flags: 'a' });
      this.logStreams.set(serverId, stream);
    }
  }

  public stopLogging(serverId: string): void {
    const stream = this.logStreams.get(serverId);
    if (stream) {
      stream.end();
      this.logStreams.delete(serverId);
    }
  }

  public updateConfig(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info('Updated log configuration:', this.config);
  }

  private async writeLogToFile(log: MCPLog): Promise<void> {
    const stream = this.logStreams.get(log.serverId);
    if (stream) {
      const logEntry = JSON.stringify({
        timestamp: log.timestamp,
        level: log.level,
        message: log.message,
        metadata: log.metadata
      }) + '\n';

      stream.write(logEntry);
    }
  }

  private async cleanupOldLogs(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.directory);
      const now = Date.now();
      const retentionMs = this.config.retention * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.config.directory, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > retentionMs) {
          await fs.unlink(filePath);
          this.logger.debug(`Deleted old log file: ${file}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old logs:', error);
    }
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async exportLogs(serverId: string, format: 'json' | 'text' = 'json'): Promise<string> {
    try {
      const logs = await this.getLogs(serverId);

      if (format === 'json') {
        return JSON.stringify(logs, null, 2);
      } else {
        return logs.map(log => 
          `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}${
            log.metadata ? ` | ${JSON.stringify(log.metadata)}` : ''
          }`
        ).join('\n');
      }
    } catch (error) {
      this.logger.error(`Failed to export logs for server ${serverId}:`, error);
      throw error;
    }
  }
} 