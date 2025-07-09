import { Logger } from 'winston';
import Database from '../database';
import { MCPSettings, MCPServerTemplate, ValidationError } from '../types';
import fs from 'fs/promises';
import path from 'path';

export class ConfigService {
  private settings: MCPSettings = {
    theme: 'system',
    autoStart: false,
    logRetention: '7',
    notifications: true,
    healthCheckInterval: '60'
  };

  constructor(
    private database: Database,
    private logger: Logger
  ) {}

  public async initialize(): Promise<void> {
    try {
      // Load settings from database
      const savedSettings = await this.database.getSettings();
      if (savedSettings) {
        this.settings = savedSettings;
      } else {
        // Save default settings
        await this.database.saveSettings(this.settings);
      }

      // Load templates
      await this.loadTemplates();

      this.logger.info('Configuration service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize configuration service:', error);
      throw error;
    }
  }

  public async getSettings(): Promise<MCPSettings> {
    return this.settings;
  }

  public async updateSettings(newSettings: Partial<MCPSettings>): Promise<MCPSettings> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await this.database.saveSettings(this.settings);
      this.logger.info('Settings updated');
      return this.settings;
    } catch (error) {
      this.logger.error('Failed to update settings:', error);
      throw error;
    }
  }

  public async getTemplates(): Promise<MCPServerTemplate[]> {
    try {
      return await this.database.getTemplates();
    } catch (error) {
      this.logger.error('Failed to get templates:', error);
      throw error;
    }
  }

  public async getTemplate(id: string): Promise<MCPServerTemplate> {
    try {
      const template = await this.database.getTemplate(id);
      if (!template) {
        throw new ValidationError(`Template ${id} not found`);
      }
      return template;
    } catch (error) {
      this.logger.error(`Failed to get template ${id}:`, error);
      throw error;
    }
  }

  private async loadTemplates(): Promise<void> {
    try {
      // Load built-in templates
      const templatesDir = path.join(__dirname, '../templates');
      const files = await fs.readdir(templatesDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const templatePath = path.join(templatesDir, file);
          const templateContent = await fs.readFile(templatePath, 'utf-8');
          const template = JSON.parse(templateContent);

          // Validate template
          this.validateTemplate(template);

          // Save to database
          await this.database.saveTemplate(template);
        }
      }

      this.logger.info(`Loaded ${files.length} templates`);
    } catch (error) {
      this.logger.error('Failed to load templates:', error);
      throw error;
    }
  }

  private validateTemplate(template: any): void {
    const requiredFields = ['id', 'name', 'description', 'type', 'command'];
    const missingFields = requiredFields.filter(field => !template[field]);

    if (missingFields.length > 0) {
      throw new ValidationError(
        `Invalid template: missing required fields: ${missingFields.join(', ')}`
      );
    }
  }

  public async exportConfig(format: 'json' | 'yaml' = 'json'): Promise<string> {
    try {
      const config = {
        settings: this.settings,
        servers: await this.database.getAllServers(),
        folders: await this.database.getAllFolders(),
        templates: await this.database.getTemplates(),
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      };

      if (format === 'yaml') {
        // TODO: Implement YAML export
        throw new Error('YAML export not implemented yet');
      }

      return JSON.stringify(config, null, 2);
    } catch (error) {
      this.logger.error('Failed to export configuration:', error);
      throw error;
    }
  }

  public async importConfig(configData: string, format: 'json' | 'yaml' = 'json'): Promise<void> {
    try {
      let config;
      if (format === 'yaml') {
        // TODO: Implement YAML import
        throw new Error('YAML import not implemented yet');
      } else {
        config = JSON.parse(configData);
      }

      // Validate config
      this.validateConfig(config);

      // Import settings
      await this.updateSettings(config.settings);

      // Import folders first (for referential integrity)
      for (const folder of config.folders) {
        await this.database.saveFolder(folder);
      }

      // Import servers
      for (const server of config.servers) {
        await this.database.saveServer(server);
      }

      // Import templates
      for (const template of config.templates) {
        await this.database.saveTemplate(template);
      }

      this.logger.info('Configuration imported successfully');
    } catch (error) {
      this.logger.error('Failed to import configuration:', error);
      throw error;
    }
  }

  private validateConfig(config: any): void {
    if (!config || typeof config !== 'object') {
      throw new ValidationError('Invalid configuration format');
    }

    const requiredSections = ['settings', 'servers', 'folders', 'templates'];
    const missingSections = requiredSections.filter(section => !config[section]);

    if (missingSections.length > 0) {
      throw new ValidationError(
        `Invalid configuration: missing sections: ${missingSections.join(', ')}`
      );
    }

    if (!Array.isArray(config.servers)) {
      throw new ValidationError('Invalid configuration: servers must be an array');
    }

    if (!Array.isArray(config.folders)) {
      throw new ValidationError('Invalid configuration: folders must be an array');
    }

    if (!Array.isArray(config.templates)) {
      throw new ValidationError('Invalid configuration: templates must be an array');
    }
  }
} 