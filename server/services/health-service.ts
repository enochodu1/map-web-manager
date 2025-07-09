import { Logger } from 'winston';
import Database from '../database';
import { MCPHealthCheck, HealthCheckConfig } from '../types';
import { WebSocketService } from './websocket-service';

export class HealthService {
  private healthChecks: Map<string, NodeJS.Timeout> = new Map();
  private config: HealthCheckConfig = {
    interval: 60000, // 1 minute
    timeout: 5000,   // 5 seconds
    retries: 3
  };

  constructor(
    private database: Database,
    private logger: Logger,
    private wsService?: WebSocketService
  ) {}

  public async startHealthChecks(): Promise<void> {
    try {
      // Get all active servers
      const servers = await this.database.getAllServers();
      
      // Start health checks for each server
      servers.forEach(server => {
        if (server.status === 'active') {
          this.startServerHealthCheck(server.id);
        }
      });

      this.logger.info(`Started health checks for ${servers.length} servers`);
    } catch (error) {
      this.logger.error('Failed to start health checks:', error);
      throw error;
    }
  }

  public async startPeriodicHealthChecks(): Promise<void> {
    return this.startHealthChecks();
  }

  public async stopHealthChecks(): Promise<void> {
    this.healthChecks.forEach(timeout => clearTimeout(timeout));
    this.healthChecks.clear();
    this.logger.info('Stopped all health checks');
  }

  public startServerHealthCheck(serverId: string): void {
    // Clear existing health check if any
    this.stopServerHealthCheck(serverId);

    // Start new health check
    const timeout = setInterval(
      () => this.checkServerHealth(serverId),
      this.config.interval
    );

    this.healthChecks.set(serverId, timeout);
    this.logger.debug(`Started health check for server ${serverId}`);
  }

  public stopServerHealthCheck(serverId: string): void {
    const timeout = this.healthChecks.get(serverId);
    if (timeout) {
      clearTimeout(timeout);
      this.healthChecks.delete(serverId);
      this.logger.debug(`Stopped health check for server ${serverId}`);
    }
  }

  private async checkServerHealth(serverId: string): Promise<void> {
    try {
      const server = await this.database.getServer(serverId);
      if (!server) {
        this.stopServerHealthCheck(serverId);
        return;
      }

      let healthCheck: MCPHealthCheck = {
        serverId,
        status: 'healthy',
        lastCheck: new Date().toISOString(),
        details: {}
      };

      // Perform health check based on server type
      try {
        const startTime = Date.now();
        
        // TODO: Implement actual health check logic based on server type
        // For now, just check if the server process is running
        if (server.status !== 'active') {
          throw new Error('Server is not active');
        }

        healthCheck.details = {
          responseTime: Date.now() - startTime
        };
      } catch (error) {
        healthCheck = {
          serverId,
          status: 'unhealthy',
          lastCheck: new Date().toISOString(),
          details: {
            error: (error as Error).message
          }
        };
      }

      // Save health check result
      await this.database.saveHealthCheck(healthCheck);

      // Notify clients via WebSocket
      if (this.wsService) {
        this.wsService.emitToServer(serverId, 'health_check', healthCheck);
      }

      // Log result
      this.logger.debug(`Health check for server ${serverId}: ${healthCheck.status}`);
    } catch (error) {
      this.logger.error(`Health check failed for server ${serverId}:`, error);
    }
  }

  public async getServerHealth(serverId: string): Promise<MCPHealthCheck> {
    try {
      return await this.database.getLatestHealthCheck(serverId);
    } catch (error) {
      this.logger.error(`Failed to get health check for server ${serverId}:`, error);
      throw error;
    }
  }

  public updateConfig(config: Partial<HealthCheckConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info('Updated health check configuration:', this.config);
  }
} 