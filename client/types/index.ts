export interface MCPServer {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: 'active' | 'inactive' | 'error' | 'starting' | 'stopping';
  command: string;
  port?: number;
  folderId?: string;
  env: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface MCPFolder {
  id: string;
  name: string;
  parentId?: string;
  children?: MCPFolder[];
  createdAt: string;
  updatedAt: string;
}

export interface MCPLog {
  id: string;
  serverId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface MCPSettings {
  theme: 'system' | 'light' | 'dark';
  autoStart: boolean;
  logRetention: string;
  notifications: boolean;
  healthCheckInterval: string;
}

export interface MCPServerTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  command: string;
  defaultEnv: Record<string, string>;
  configSchema: Record<string, any>;
}

export interface MCPHealthCheck {
  serverId: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  lastCheck: string;
  details?: {
    responseTime?: number;
    error?: string;
    warnings?: string[];
  };
}

export interface MCPServerStats {
  serverId: string;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  requestCount: number;
  errorCount: number;
  lastUpdated: string;
} 