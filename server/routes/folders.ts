import { Router } from 'express';
import { z } from 'zod';
import Database from '../database';
import { MCPFolder } from '../types';
import { ValidationError } from '../types';

const router = Router();

// Validation schemas
const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().optional()
});

const updateFolderSchema = createFolderSchema.partial();

export default function foldersRouter(database: Database) {
  // Get all folders
  router.get('/', async (req, res, next) => {
    try {
      const folders = await database.getAllFolders();
      res.json(folders);
    } catch (error) {
      next(error);
    }
  });

  // Get a specific folder
  router.get('/:id', async (req, res, next) => {
    try {
      const folder = await database.getFolder(req.params.id);
      if (!folder) {
        throw new ValidationError(`Folder ${req.params.id} not found`);
      }
      res.json(folder);
    } catch (error) {
      next(error);
    }
  });

  // Create a new folder
  router.post('/', async (req, res, next) => {
    try {
      const data = createFolderSchema.parse(req.body);
      const folder: MCPFolder = {
        id: `folder_${Date.now()}`,
        name: data.name,
        parentId: data.parentId,
        children: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await database.saveFolder(folder);
      res.status(201).json(folder);
    } catch (error) {
      next(error);
    }
  });

  // Update a folder
  router.put('/:id', async (req, res, next) => {
    try {
      const data = updateFolderSchema.parse(req.body);
      const existingFolder = await database.getFolder(req.params.id);
      
      if (!existingFolder) {
        throw new ValidationError(`Folder ${req.params.id} not found`);
      }

      const updatedFolder: MCPFolder = {
        ...existingFolder,
        ...data,
        updatedAt: new Date().toISOString()
      };

      await database.saveFolder(updatedFolder);
      res.json(updatedFolder);
    } catch (error) {
      next(error);
    }
  });

  // Delete a folder
  router.delete('/:id', async (req, res, next) => {
    try {
      await database.deleteFolder(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
} 