import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import winston from 'winston';
import { RateLimiterMemory } from 'rate-limiter-flexible';

import Database from './database';
import { setupRoutes } from './routes';
import { MCPService } from './services/mcp-service';
import { HealthService } from './services/health-service';
import { ConfigService } from './services/config-service';
import { LogService } from './services/log-service';
import { WebSocketService } from './services/websocket-service';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mcp-web-manager' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Rate limiter
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'mcp_api',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

class MCPWebManager {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private database: Database;
  private mcpService!: MCPService;
  private healthService!: HealthService;
  private configService!: ConfigService;
  private logService!: LogService;
  private webSocketService!: WebSocketService;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.database = new Database();
    this.setupServices();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupErrorHandling();
  }

  private setupServices() {
    this.mcpService = new MCPService(this.database, logger);
    this.healthService = new HealthService(this.database, logger);
    this.configService = new ConfigService(this.database, logger);
    this.logService = new LogService(this.database, logger);
    this.webSocketService = new WebSocketService(this.io, logger);
  }

  private setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger(logger));

    // Rate limiting
    this.app.use(async (req, res, next) => {
      try {
        await rateLimiter.consume(req.ip);
        next();
      } catch (rejRes) {
        res.status(429).json({
          success: false,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded'
        });
      }
    });

    // Static files (for serving the built client)
    const clientPath = path.join(__dirname, '../../client/dist');
    this.app.use(express.static(clientPath));
  }

  private setupRoutes() {
    setupRoutes(this.app, {
      database: this.database,
      mcpService: this.mcpService,
      healthService: this.healthService,
      configService: this.configService,
      logService: this.logService,
      webSocketService: this.webSocketService,
      logger
    });

    // Catch-all handler for SPA
    this.app.get('*', (req, res) => {
      const clientPath = path.join(__dirname, '../../client/dist/index.html');
      res.sendFile(clientPath);
    });
  }

  private setupWebSocket() {
    this.io.on('connection', (socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`);

      socket.on('join_server', (serverId: string) => {
        socket.join(`server_${serverId}`);
        logger.debug(`Client ${socket.id} joined server room: ${serverId}`);
      });

      socket.on('leave_server', (serverId: string) => {
        socket.leave(`server_${serverId}`);
        logger.debug(`Client ${socket.id} left server room: ${serverId}`);
      });

      socket.on('disconnect', () => {
        logger.info(`WebSocket client disconnected: ${socket.id}`);
      });
    });

    // Set up WebSocket service
    this.webSocketService.initialize();
  }

  private setupErrorHandling() {
    // 404 handler
    this.app.use((req, res, next) => {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`
      });
    });

    // Global error handler
    this.app.use(errorHandler(logger));

    // Graceful shutdown
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
  }

  private async gracefulShutdown() {
    logger.info('Received shutdown signal, closing server gracefully...');
    
    this.server.close(() => {
      logger.info('HTTP server closed');
      
      // Close database connection
      this.database.close();
      
      // Stop all MCP services
      this.mcpService.stopAllServers();
      
      process.exit(0);
    });
  }

  public async start() {
    try {
      // Initialize database
      await this.database.initialize();
      
      // Start the server
      const port = parseInt(process.env.PORT || '3001', 10);
      this.server.listen(port, () => {
        logger.info(`MCP Web Manager server started on port ${port}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
      });

      // Start health checks
      await this.healthService.startPeriodicHealthChecks();
      
      logger.info('MCP Web Manager fully initialized');
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the application
const app = new MCPWebManager();
app.start().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
