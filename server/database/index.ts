import sqlite3 from 'sqlite3';
import { open, Database as SQLiteDB } from 'sqlite';
import path from 'path';
import {
  ServerModel,
  FolderModel,
  LogModel,
  SettingsModel,
  TemplateModel,
  HealthCheckModel,
  ServerStatsModel,
  MCPServer,
  MCPFolder,
  MCPLog,
  MCPSettings,
  MCPServerTemplate,
  MCPHealthCheck,
  MCPServerStats
} from '../types';
import fs from 'fs-extra';

export default class Database {
  private db: SQLiteDB | null = null;
  private dbPath: string;

  constructor(dbPath: string = './data/mcp.db') {
    this.dbPath = path.resolve(dbPath);
  }

  public async initialize(): Promise<void> {
    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });

      // Open database connection
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });

      // Enable foreign keys
      await this.db.run('PRAGMA foreign_keys = ON');

      // Create tables
      await this.createTables();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS servers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        command TEXT NOT NULL,
        port INTEGER,
        folderId TEXT,
        env TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (folderId) REFERENCES folders (id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parentId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (parentId) REFERENCES folders (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        serverId TEXT NOT NULL,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        metadata TEXT,
        FOREIGN KEY (serverId) REFERENCES servers (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        theme TEXT NOT NULL,
        autoStart BOOLEAN NOT NULL,
        logRetention TEXT NOT NULL,
        notifications BOOLEAN NOT NULL,
        healthCheckInterval TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        command TEXT NOT NULL,
        defaultEnv TEXT NOT NULL,
        configSchema TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS health_checks (
        id TEXT PRIMARY KEY,
        serverId TEXT NOT NULL,
        status TEXT NOT NULL,
        lastCheck TEXT NOT NULL,
        details TEXT,
        FOREIGN KEY (serverId) REFERENCES servers (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS server_stats (
        id TEXT PRIMARY KEY,
        serverId TEXT NOT NULL,
        uptime INTEGER NOT NULL,
        memoryUsage INTEGER NOT NULL,
        cpuUsage INTEGER NOT NULL,
        requestCount INTEGER NOT NULL,
        errorCount INTEGER NOT NULL,
        lastUpdated TEXT NOT NULL,
        FOREIGN KEY (serverId) REFERENCES servers (id) ON DELETE CASCADE
      );
    `);
  }

  public async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  // Server operations
  public async saveServer(server: MCPServer): Promise<void> {
    const { id, env, ...rest } = server;
    await this.db!.run(
      `INSERT OR REPLACE INTO servers (id, env, createdAt, updatedAt, ...) 
       VALUES (?, ?, ?, ?, ...)`,
      [id, JSON.stringify(env), new Date().toISOString(), new Date().toISOString(), ...Object.values(rest)]
    );
  }

  public async getServer(id: string): Promise<MCPServer | null> {
    const server = await this.db!.get('SELECT * FROM servers WHERE id = ?', id);
    if (!server) return null;
    return this.mapServerModel(server);
  }

  public async getAllServers(): Promise<MCPServer[]> {
    const servers = await this.db!.all('SELECT * FROM servers');
    return servers.map(this.mapServerModel);
  }

  public async deleteServer(id: string): Promise<void> {
    await this.db!.run('DELETE FROM servers WHERE id = ?', id);
  }

  // Folder operations
  public async saveFolder(folder: MCPFolder): Promise<void> {
    const { id, ...rest } = folder;
    await this.db!.run(
      `INSERT OR REPLACE INTO folders (id, createdAt, updatedAt, ...) 
       VALUES (?, ?, ?, ...)`,
      [id, new Date().toISOString(), new Date().toISOString(), ...Object.values(rest)]
    );
  }

  public async getFolder(id: string): Promise<MCPFolder | null> {
    const folder = await this.db!.get('SELECT * FROM folders WHERE id = ?', id);
    if (!folder) return null;
    return this.mapFolderModel(folder);
  }

  public async getAllFolders(): Promise<MCPFolder[]> {
    const folders = await this.db!.all('SELECT * FROM folders');
    return this.buildFolderTree(folders.map(this.mapFolderModel));
  }

  public async deleteFolder(id: string): Promise<void> {
    await this.db!.run('DELETE FROM folders WHERE id = ?', id);
  }

  // Log operations
  public async saveLog(log: MCPLog): Promise<void> {
    const { id, metadata, ...rest } = log;
    await this.db!.run(
      `INSERT INTO logs (id, metadata, ...) 
       VALUES (?, ?, ...)`,
      [id, metadata ? JSON.stringify(metadata) : null, ...Object.values(rest)]
    );
  }

  public async getLogs(serverId: string, options: {
    level?: string;
    startTime?: string;
    endTime?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<MCPLog[]> {
    let query = 'SELECT * FROM logs WHERE serverId = ?';
    const params: any[] = [serverId];

    if (options.level) {
      query += ' AND level = ?';
      params.push(options.level);
    }

    if (options.startTime) {
      query += ' AND timestamp >= ?';
      params.push(options.startTime);
    }

    if (options.endTime) {
      query += ' AND timestamp <= ?';
      params.push(options.endTime);
    }

    query += ' ORDER BY timestamp DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    if (options.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }

    const logs = await this.db!.all(query, ...params);
    return logs.map(this.mapLogModel);
  }

  public async clearLogs(serverId: string): Promise<void> {
    await this.db!.run('DELETE FROM logs WHERE serverId = ?', serverId);
  }

  // Settings operations
  public async saveSettings(settings: MCPSettings): Promise<void> {
    await this.db!.run(
      `INSERT OR REPLACE INTO settings (id, theme, autoStart, logRetention, notifications, healthCheckInterval)
       VALUES ('default', ?, ?, ?, ?, ?)`,
      [settings.theme, settings.autoStart, settings.logRetention, settings.notifications, settings.healthCheckInterval]
    );
  }

  public async getSettings(): Promise<MCPSettings | null> {
    const settings = await this.db!.get('SELECT * FROM settings WHERE id = ?', 'default');
    if (!settings) return null;
    return this.mapSettingsModel(settings);
  }

  // Template operations
  public async saveTemplate(template: MCPServerTemplate): Promise<void> {
    const { id, defaultEnv, configSchema, ...rest } = template;
    await this.db!.run(
      `INSERT OR REPLACE INTO templates (id, defaultEnv, configSchema, ...) 
       VALUES (?, ?, ?, ...)`,
      [id, JSON.stringify(defaultEnv), JSON.stringify(configSchema), ...Object.values(rest)]
    );
  }

  public async getTemplate(id: string): Promise<MCPServerTemplate | null> {
    const template = await this.db!.get('SELECT * FROM templates WHERE id = ?', id);
    if (!template) return null;
    return this.mapTemplateModel(template);
  }

  public async getTemplates(): Promise<MCPServerTemplate[]> {
    const templates = await this.db!.all('SELECT * FROM templates');
    return templates.map(this.mapTemplateModel);
  }

  // Health check operations
  public async saveHealthCheck(healthCheck: MCPHealthCheck): Promise<void> {
    const { serverId, details, ...rest } = healthCheck;
    await this.db!.run(
      `INSERT INTO health_checks (serverId, details, ...) 
       VALUES (?, ?, ...)`,
      [serverId, details ? JSON.stringify(details) : null, ...Object.values(rest)]
    );
  }

  public async getLatestHealthCheck(serverId: string): Promise<MCPHealthCheck | null> {
    const healthCheck = await this.db!.get(
      'SELECT * FROM health_checks WHERE serverId = ? ORDER BY lastCheck DESC LIMIT 1',
      serverId
    );
    if (!healthCheck) return null;
    return this.mapHealthCheckModel(healthCheck);
  }

  // Server stats operations
  public async saveServerStats(stats: MCPServerStats): Promise<void> {
    const { serverId, ...rest } = stats;
    await this.db!.run(
      `INSERT INTO server_stats (serverId, ...) 
       VALUES (?, ...)`,
      [serverId, ...Object.values(rest)]
    );
  }

  public async getServerStats(serverId: string): Promise<MCPServerStats | null> {
    const stats = await this.db!.get(
      'SELECT * FROM server_stats WHERE serverId = ? ORDER BY lastUpdated DESC LIMIT 1',
      serverId
    );
    if (!stats) return null;
    return this.mapServerStatsModel(stats);
  }

  // Helper functions to map database models to domain models
  private mapServerModel(model: ServerModel): MCPServer {
    return {
      ...model,
      env: JSON.parse(model.env)
    };
  }

  private mapFolderModel(model: FolderModel): MCPFolder {
    return {
      ...model,
      children: []
    };
  }

  private mapLogModel(model: LogModel): MCPLog {
    return {
      ...model,
      metadata: model.metadata ? JSON.parse(model.metadata) : undefined
    };
  }

  private mapSettingsModel(model: SettingsModel): MCPSettings {
    return model;
  }

  private mapTemplateModel(model: TemplateModel): MCPServerTemplate {
    return {
      ...model,
      defaultEnv: JSON.parse(model.defaultEnv),
      configSchema: JSON.parse(model.configSchema)
    };
  }

  private mapHealthCheckModel(model: HealthCheckModel): MCPHealthCheck {
    return {
      ...model,
      details: model.details ? JSON.parse(model.details) : undefined
    };
  }

  private mapServerStatsModel(model: ServerStatsModel): MCPServerStats {
    return model;
  }

  private buildFolderTree(folders: MCPFolder[]): MCPFolder[] {
    const folderMap = new Map<string, MCPFolder>();
    const rootFolders: MCPFolder[] = [];

    // Create a map of all folders
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Build the tree structure
    folders.forEach(folder => {
      const mappedFolder = folderMap.get(folder.id)!;
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children!.push(mappedFolder);
        }
      } else {
        rootFolders.push(mappedFolder);
      }
    });

    return rootFolders;
  }
}
