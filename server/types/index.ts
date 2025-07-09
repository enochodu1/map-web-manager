import { MCPServer, MCPFolder, MCPLog, MCPSettings, MCPServerTemplate, MCPHealthCheck, MCPServerStats } from '../../client/types';

// Database Models
export interface ServerModel extends Omit<MCPServer, 'env'> {
  env: string; // JSON string
}

export interface FolderModel extends Omit<MCPFolder, 'children'> {}

export interface LogModel extends MCPLog {
  metadata: string; // JSON string
}

export interface SettingsModel extends MCPSettings {}

export interface TemplateModel extends Omit<MCPServerTemplate, 'defaultEnv' | 'configSchema'> {
  defaultEnv: string; // JSON string
  configSchema: string; // JSON string
}

export interface HealthCheckModel extends Omit<MCPHealthCheck, 'details'> {
  details: string; // JSON string
}

export interface ServerStatsModel extends MCPServerStats {}

// Service Types
export interface ServerProcess {
  id: string;
  process: any; // NodeJS.Process
  status: MCPServer['status'];
  startTime: number;
  logs: string[];
}

export interface ServerConfig {
  command: string;
  env: Record<string, string>;
  port?: number;
  workingDirectory?: string;
  args?: string[];
}

export interface HealthCheckConfig {
  interval: number;
  timeout: number;
  retries: number;
  endpoint?: string;
}

export interface LogConfig {
  level: string;
  retention: number;
  maxSize: number;
  maxFiles: number;
  directory: string;
}

// WebSocket Events
export interface ServerStatusEvent {
  serverId: string;
  status: MCPServer['status'];
  timestamp: string;
}

export interface ServerLogEvent {
  serverId: string;
  log: MCPLog;
}

export interface HealthCheckEvent {
  serverId: string;
  health: MCPHealthCheck;
}

export interface ServerStatsEvent {
  serverId: string;
  stats: MCPServerStats;
}

// API Request/Response Types
export interface CreateServerRequest {
  name: string;
  description?: string;
  type: string;
  command: string;
  port?: number;
  folderId?: string;
  env?: Record<string, string>;
}

export interface UpdateServerRequest extends Partial<CreateServerRequest> {}

export interface CreateFolderRequest {
  name: string;
  parentId?: string;
}

export interface UpdateFolderRequest extends Partial<CreateFolderRequest> {}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Error Types
export class MCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export class ValidationError extends MCPError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends MCPError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ServerError extends MCPError {
  constructor(message: string, details?: any) {
    super(message, 'SERVER_ERROR', 500, details);
    this.name = 'ServerError';
  }
}
