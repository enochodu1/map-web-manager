// Re-export client types
export type {
  MCPServer,
  MCPFolder,
  MCPLog,
  MCPSettings,
  MCPServerTemplate,
  MCPHealthCheck,
  MCPServerStats
} from '../../client/types';

// Additional server-specific types
export interface MCPServerStatus {
  serverId: string;
  status: string;
  pid?: number;
  uptime?: number;
  restarts?: number;
  lastRestart?: Date;
}

export type MCPServerConfig = {
  command: string;
  env: Record<string, string>;
  port?: number;
  workingDirectory?: string;
  args?: string[];
};

export type MCPTemplate = MCPServerTemplate;

// Database Models
export interface ServerModel {
  id: string;
  name: string;
  description?: string;
  type: string;
  command: string;
  port?: number;
  status: string;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
  env: string; // JSON string
}

export interface FolderModel {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogModel {
  id: string;
  serverId: string;
  level: string;
  message: string;
  timestamp: string;
  metadata: string; // JSON string
}

export interface SettingsModel {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

export interface TemplateModel {
  id: string;
  name: string;
  description?: string;
  type: string;
  command: string;
  defaultEnv: string; // JSON string
  configSchema: string; // JSON string
  tags: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthCheckModel {
  id: string;
  serverId: string;
  status: string;
  responseTime?: number;
  timestamp: string;
  details: string; // JSON string
}

export interface ServerStatsModel {
  id: string;
  serverId: string;
  cpuUsage: number;
  memoryUsage: number;
  uptime: number;
  requestCount: number;
  errorCount: number;
  timestamp: string;
}

// Service Types
export interface ServerProcess {
  id: string;
  process: any; // NodeJS.Process
  status: string;
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
  status: string;
  timestamp: string;
}

export interface ServerLogEvent {
  serverId: string;
  log: LogModel;
}

export interface HealthCheckEvent {
  serverId: string;
  health: HealthCheckModel;
}

export interface ServerStatsEvent {
  serverId: string;
  stats: ServerStatsModel;
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
