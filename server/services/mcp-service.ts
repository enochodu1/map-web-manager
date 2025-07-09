import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';

import Database from '../database';
import { MCPServer, MCPServerConfig, MCPServerStatus, MCPTemplate, MCPServerTemplate } from '../types';

export class MCPService extends EventEmitter {
  private database: Database;
  private logger: Logger;
  private runningServers: Map<string, ChildProcess> = new Map();
  private serverStatuses: Map<string, MCPServerStatus> = new Map();

  constructor(database: Database, logger: Logger) {
    super();
    this.database = database;
    this.logger = logger;
  }

  // Server Management
  async createServer(serverData: Omit<MCPServer, 'id' | 'createdAt' | 'updatedAt'>): Promise<MCPServer> {
    const id = uuidv4();
    const server: Omit<MCPServer, 'createdAt' | 'updatedAt'> = {
      id,
      ...serverData,
      status: 'inactive'
    };

    const createdServer = await this.database.createServer(server);
    this.logger.info(`Created MCP server: ${createdServer.name} (${id})`);

    // Validate configuration
    await this.validateServerConfig(createdServer);

    this.emit('server_created', createdServer);
    return createdServer;
  }

  async updateServer(id: string, updates: Partial<MCPServer>): Promise<MCPServer | null> {
    const server = await this.database.updateServer(id, updates);
    if (!server) {
      this.logger.warn(`Attempted to update non-existent server: ${id}`);
      return null;
    }

    this.logger.info(`Updated MCP server: ${server.name} (${id})`);
    
    // If server is running and config changed, restart it
    if (this.runningServers.has(id) && updates.config) {
      await this.restartServer(id);
    }

    this.emit('server_updated', server);
    return server;
  }

  async deleteServer(id: string): Promise<boolean> {
    const server = await this.database.getServer(id);
    if (!server) {
      this.logger.warn(`Attempted to delete non-existent server: ${id}`);
      return false;
    }

    // Stop server if running
    if (this.runningServers.has(id)) {
      await this.stopServer(id);
    }

    const deleted = await this.database.deleteServer(id);
    if (deleted) {
      this.logger.info(`Deleted MCP server: ${server.name} (${id})`);
      this.emit('server_deleted', { id, name: server.name });
    }

    return deleted;
  }

  async getServer(id: string): Promise<MCPServer | null> {
    return await this.database.getServer(id);
  }

  async getAllServers(): Promise<MCPServer[]> {
    return await this.database.getAllServers();
  }

  // Server Control
  async startServer(id: string): Promise<boolean> {
    const server = await this.database.getServer(id);
    if (!server) {
      this.logger.error(`Cannot start non-existent server: ${id}`);
      return false;
    }

    if (this.runningServers.has(id)) {
      this.logger.warn(`Server already running: ${server.name} (${id})`);
      return true;
    }

    try {
      this.logger.info(`Starting MCP server: ${server.name} (${id})`);
      
      // Update status to starting
      await this.updateServerStatus(id, 'starting');
      
      // Start the server process
      const childProcess = await this.startServerProcess(server);

      this.runningServers.set(id, childProcess);
      await this.updateServerStatus(id, 'active');

      this.logger.info(`Successfully started MCP server: ${server.name} (${id})`);
      this.emit('server_started', server);
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to start server ${server.name} (${id}):`, error);
      await this.updateServerStatus(id, 'error');
      this.emit('server_error', { server, error });
      return false;
    }
  }

  async stopServer(id: string): Promise<boolean> {
    const server = await this.database.getServer(id);
    if (!server) {
      this.logger.error(`Cannot stop non-existent server: ${id}`);
      return false;
    }

    const childProcess = this.runningServers.get(id);
    if (!childProcess) {
      this.logger.warn(`Server not running: ${server.name} (${id})`);
      return true;
    }

    try {
      this.logger.info(`Stopping MCP server: ${server.name} (${id})`);
      
      // Graceful shutdown
      childProcess.kill('SIGTERM');
      
      // Force kill after 5 seconds
      setTimeout(() => {
        if (!childProcess.killed) {
          childProcess.kill('SIGKILL');
        }
      }, 5000);

      this.runningServers.delete(id);
      await this.updateServerStatus(id, 'inactive');

      this.logger.info(`Successfully stopped MCP server: ${server.name} (${id})`);
      this.emit('server_stopped', server);
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to stop server ${server.name} (${id}):`, error);
      return false;
    }
  }

  async restartServer(id: string): Promise<boolean> {
    const stopped = await this.stopServer(id);
    if (!stopped) {
      return false;
    }

    // Wait a moment before restarting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return await this.startServer(id);
  }

  async toggleServer(id: string): Promise<boolean> {
    const server = await this.database.getServer(id);
    if (!server) {
      return false;
    }

    if (this.runningServers.has(id)) {
      return await this.stopServer(id);
    } else {
      return await this.startServer(id);
    }
  }

  // Server Status
  async updateServerStatus(id: string, status: string): Promise<void> {
    await this.database.updateServer(id, { status });
    
    const serverStatus: MCPServerStatus = {
      serverId: id,
      status,
      pid: this.runningServers.get(id)?.pid,
      uptime: this.getServerUptime(id),
      restarts: this.getServerRestarts(id),
      lastRestart: this.getLastRestart(id)
    };

    this.serverStatuses.set(id, serverStatus);
    this.emit('server_status_updated', serverStatus);
  }

  getServerStatus(id: string): MCPServerStatus | null {
    return this.serverStatuses.get(id) || null;
  }

  getAllServerStatuses(): MCPServerStatus[] {
    return Array.from(this.serverStatuses.values());
  }

  // Process management
  private async startServerProcess(server: MCPServer): Promise<ChildProcess> {
    const args = server.command.split(' ');
    const command = args.shift();
    
    if (!command) {
      throw new Error('Invalid command');
    }

    const childProcess = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...server.env },
      cwd: process.cwd()
    });

    this.setupProcessHandlers(childProcess, server);
    return childProcess;
  }

  // Stop all servers
  stopAllServers(): void {
    this.runningServers.forEach((process, id) => {
      process.kill('SIGTERM');
    });
    this.runningServers.clear();
  }

  // Transport-specific server starters
  private async startStdioServer(server: MCPServer): Promise<ChildProcess> {
    const { command, args = [], env = {} } = server.config;
    
    if (!command) {
      throw new Error('Command is required for stdio transport');
    }

    const childProcess = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...env, ...server.environmentVariables },
      cwd: process.cwd()
    });

    this.setupProcessHandlers(childProcess, server);
    return childProcess;
  }

  private async startSSEServer(server: MCPServer): Promise<ChildProcess> {
    const { url, port } = server.config;
    
    if (!url) {
      throw new Error('URL is required for SSE transport');
    }

    // For SSE, we might need to start a proxy or connection manager
    // This is a placeholder implementation
    const childProcess = spawn('node', ['-e', `
      const http = require('http');
      const EventSource = require('eventsource');
      
      const es = new EventSource('${url}');
      es.onmessage = function(event) {
        console.log('Received:', event.data);
      };
      
      es.onerror = function(error) {
        console.error('SSE Error:', error);
      };
      
      process.on('SIGTERM', () => {
        es.close();
        process.exit(0);
      });
    `], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...server.environmentVariables }
    });

    this.setupProcessHandlers(childProcess, server);
    return childProcess;
  }

  private setupProcessHandlers(childProcess: ChildProcess, server: MCPServer): void {
    childProcess.on('error', (error) => {
      this.logger.error(`Process error for server ${server.name} (${server.id}):`, error);
      this.emit('server_error', { server, error });
      this.updateServerStatus(server.id, 'error');
    });

    childProcess.on('exit', (code, signal) => {
      this.logger.info(`Process exited for server ${server.name} (${server.id}): code=${code}, signal=${signal}`);
      this.runningServers.delete(server.id);
      this.updateServerStatus(server.id, 'inactive');
      this.emit('server_stopped', server);
    });

    childProcess.stdout?.on('data', (data) => {
      const message = data.toString().trim();
      this.logger.debug(`Server ${server.name} stdout: ${message}`);
      this.emit('server_log', {
        serverId: server.id,
        level: 'info',
        message,
        timestamp: new Date()
      });
    });

    childProcess.stderr?.on('data', (data) => {
      const message = data.toString().trim();
      this.logger.debug(`Server ${server.name} stderr: ${message}`);
      this.emit('server_log', {
        serverId: server.id,
        level: 'error',
        message,
        timestamp: new Date()
      });
    });
  }

  // Configuration validation
  private async validateServerConfig(server: MCPServer): Promise<void> {
    const { config } = server;
    
    if (config.transport === 'stdio') {
      if (!config.command) {
        throw new Error('Command is required for stdio transport');
      }
      
      // Check if command exists
      try {
        await fs.access(config.command, fs.constants.F_OK);
      } catch (error) {
        // Command might be in PATH, so we'll let it fail at runtime
        this.logger.warn(`Command not found at path: ${config.command}`);
      }
    } else if (config.transport === 'sse') {
      if (!config.url) {
        throw new Error('URL is required for SSE transport');
      }
      
      // Validate URL format
      try {
        new URL(config.url);
      } catch (error) {
        throw new Error('Invalid URL format for SSE transport');
      }
    }

    // Validate environment variables
    if (config.validation?.required) {
      const missing = config.validation.required.filter((key: string) => 
        !config.env?.[key] && !server.env?.[key]
      );
      
      if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }
    }
  }

  // Server Templates
  async getTemplates(): Promise<MCPTemplate[]> {
    // This would typically come from a registry or marketplace
    // For now, return some built-in templates
    return [
      {
        id: 'filesystem',
        name: 'Filesystem',
        description: 'Access and manipulate files and directories',
        category: 'utilities',
        version: '1.0.0',
        author: 'Anthropic',
        tags: ['filesystem', 'files', 'directories'],
        config: {
          transport: 'stdio',
          command: 'npx',
          args: ['@modelcontextprotocol/server-filesystem', '/path/to/allowed/directory']
        },
        installCommand: 'npm install -g @modelcontextprotocol/server-filesystem',
        isPopular: true
      },
      {
        id: 'postgres',
        name: 'PostgreSQL',
        description: 'Connect to and query PostgreSQL databases',
        category: 'database',
        version: '1.0.0',
        author: 'Anthropic',
        tags: ['database', 'postgresql', 'sql'],
        config: {
          transport: 'stdio',
          command: 'npx',
          args: ['@modelcontextprotocol/server-postgres']
        },
        installCommand: 'npm install -g @modelcontextprotocol/server-postgres',
        environmentVariables: [
          { key: 'POSTGRES_CONNECTION_STRING', description: 'PostgreSQL connection string', required: true }
        ],
        isPopular: true
      },
      {
        id: 'brave-search',
        name: 'Brave Search',
        description: 'Search the web using Brave Search API',
        category: 'search',
        version: '1.0.0',
        author: 'Anthropic',
        tags: ['search', 'web', 'brave'],
        config: {
          transport: 'stdio',
          command: 'npx',
          args: ['@modelcontextprotocol/server-brave-search']
        },
        installCommand: 'npm install -g @modelcontextprotocol/server-brave-search',
        environmentVariables: [
          { key: 'BRAVE_SEARCH_API_KEY', description: 'Brave Search API key', required: true }
        ],
        isPopular: true
      }
    ];
  }

  async createServerFromTemplate(templateId: string, customConfig: Partial<MCPServer>): Promise<MCPServer> {
    const templates = await this.getTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const serverData: Omit<MCPServer, 'id' | 'createdAt' | 'updatedAt'> = {
      name: customConfig.name || template.name,
      description: customConfig.description || template.description,
      type: template.config.transport,
      status: 'inactive',
      category: customConfig.category || template.category,
      folderId: customConfig.folderId,
      config: { ...template.config, ...customConfig.config },
      version: template.version,
      author: template.author,
      tags: template.tags,
      environmentVariables: customConfig.environmentVariables || {},
      isTemplate: false,
      templateId: template.id
    };

    return await this.createServer(serverData);
  }

  // Utility methods
  private getServerUptime(id: string): number {
    const process = this.runningServers.get(id);
    if (!process || !process.pid) return 0;
    
    // This is a simplified implementation
    // In a real implementation, you'd track start time
    return Date.now() - (process.spawnfile ? Date.now() : 0);
  }

  private getServerRestarts(id: string): number {
    // This would be tracked in a separate data structure
    return 0;
  }

  private getLastRestart(id: string): Date | undefined {
    // This would be tracked in a separate data structure
    return undefined;
  }

  // Cleanup
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down MCP service...');
    
    const stopPromises = Array.from(this.runningServers.keys()).map(id => 
      this.stopServer(id)
    );
    
    await Promise.allSettled(stopPromises);
    this.logger.info('MCP service shutdown complete');
  }
}

export default MCPService;
