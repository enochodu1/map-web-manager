import { Router } from 'express';
import { z } from 'zod';
import Database from '../database';
import { MCPServer } from '../types';
import { ValidationError } from '../types';
import { MCPService } from '../services/mcp-service';

const router = Router();

// Validation schemas
const createServerSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.string(),
  command: z.string(),
  port: z.number().optional(),
  folderId: z.string().optional(),
  env: z.record(z.string(), z.string()).optional()
});

const updateServerSchema = createServerSchema.partial();

export default function serversRouter(database: Database, mcpService: MCPService) {
  // Get all servers
  router.get('/', async (req, res, next) => {
    try {
      const servers = await database.getAllServers();
      res.json(servers);
    } catch (error) {
      next(error);
    }
  });

  // Get a specific server
  router.get('/:id', async (req, res, next) => {
    try {
      const server = await database.getServer(req.params.id);
      if (!server) {
        throw new ValidationError(`Server ${req.params.id} not found`);
      }
      res.json(server);
    } catch (error) {
      next(error);
    }
  });

  // Create a new server
  router.post('/', async (req, res, next) => {
    try {
      const data = createServerSchema.parse(req.body);
      const server: MCPServer = {
        id: `server_${Date.now()}`,
        name: data.name,
        description: data.description,
        type: data.type,
        status: 'inactive',
        command: data.command,
        port: data.port,
        folderId: data.folderId,
        env: data.env || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await database.saveServer(server);
      res.status(201).json(server);
    } catch (error) {
      next(error);
    }
  });

  // Update a server
  router.put('/:id', async (req, res, next) => {
    try {
      const data = updateServerSchema.parse(req.body);
      const existingServer = await database.getServer(req.params.id);
      
      if (!existingServer) {
        throw new ValidationError(`Server ${req.params.id} not found`);
      }

      const updatedServer: MCPServer = {
        ...existingServer,
        ...data,
        updatedAt: new Date().toISOString()
      };

      await database.saveServer(updatedServer);
      res.json(updatedServer);
    } catch (error) {
      next(error);
    }
  });

  // Delete a server
  router.delete('/:id', async (req, res, next) => {
    try {
      await mcpService.stopServer(req.params.id);
      await database.deleteServer(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Start a server
  router.post('/:id/start', async (req, res, next) => {
    try {
      const server = await database.getServer(req.params.id);
      if (!server) {
        throw new ValidationError(`Server ${req.params.id} not found`);
      }

      await mcpService.startServer(server);
      res.json({ status: 'started' });
    } catch (error) {
      next(error);
    }
  });

  // Stop a server
  router.post('/:id/stop', async (req, res, next) => {
    try {
      await mcpService.stopServer(req.params.id);
      res.json({ status: 'stopped' });
    } catch (error) {
      next(error);
    }
  });

  // Restart a server
  router.post('/:id/restart', async (req, res, next) => {
    try {
      const server = await database.getServer(req.params.id);
      if (!server) {
        throw new ValidationError(`Server ${req.params.id} not found`);
      }

      await mcpService.stopServer(server.id);
      await mcpService.startServer(server);
      res.json({ status: 'restarted' });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
