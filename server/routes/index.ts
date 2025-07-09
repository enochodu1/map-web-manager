import { Router } from 'express';
import Database from '../database';
import { MCPService } from '../services/mcp-service';
import { HealthService } from '../services/health-service';
import { ConfigService } from '../services/config-service';
import { LogService } from '../services/log-service';
import { WebSocketService } from '../services/websocket-service';
import { Logger } from 'winston';

import serversRouter from './servers';
import foldersRouter from './folders';

interface ServiceContext {
  database: Database;
  mcpService: MCPService;
  healthService: HealthService;
  configService: ConfigService;
  logService: LogService;
  webSocketService: WebSocketService;
  logger: Logger;
}

export function setupRoutes(app: Router, services: ServiceContext) {
  // API Routes
  app.use('/api/v1/servers', serversRouter(services.database, services.mcpService));
  app.use('/api/v1/folders', foldersRouter(services.database));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Version endpoint
  app.get('/api/version', (req, res) => {
    res.json({
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version
    });
  });

  return app;
}
