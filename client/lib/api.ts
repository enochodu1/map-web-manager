import axios from 'axios';
import { MCPServer, MCPFolder } from '@/types';

const API_URL = process.env.API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Server API
export const getServers = async () => {
  const response = await api.get<MCPServer[]>('/servers');
  return response.data;
};

export const getServer = async (id: string) => {
  const response = await api.get<MCPServer>(`/servers/${id}`);
  return response.data;
};

export const createServer = async (server: Omit<MCPServer, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
  const response = await api.post<MCPServer>('/servers', server);
  return response.data;
};

export const updateServer = async (id: string, server: Partial<MCPServer>) => {
  const response = await api.put<MCPServer>(`/servers/${id}`, server);
  return response.data;
};

export const deleteServer = async (id: string) => {
  await api.delete(`/servers/${id}`);
};

export const startServer = async (id: string) => {
  const response = await api.post(`/servers/${id}/start`);
  return response.data;
};

export const stopServer = async (id: string) => {
  const response = await api.post(`/servers/${id}/stop`);
  return response.data;
};

export const restartServer = async (id: string) => {
  const response = await api.post(`/servers/${id}/restart`);
  return response.data;
};

// Folder API
export const getFolders = async () => {
  const response = await api.get<MCPFolder[]>('/folders');
  return response.data;
};

export const getFolder = async (id: string) => {
  const response = await api.get<MCPFolder>(`/folders/${id}`);
  return response.data;
};

export const createFolder = async (folder: Omit<MCPFolder, 'id' | 'children' | 'createdAt' | 'updatedAt'>) => {
  const response = await api.post<MCPFolder>('/folders', folder);
  return response.data;
};

export const updateFolder = async (id: string, folder: Partial<MCPFolder>) => {
  const response = await api.put<MCPFolder>(`/folders/${id}`, folder);
  return response.data;
};

export const deleteFolder = async (id: string) => {
  await api.delete(`/folders/${id}`);
};

export const apiClient = {
  getServers,
  getServer,
  createServer,
  updateServer,
  deleteServer,
  startServer,
  stopServer,
  restartServer,
  getFolders,
  getFolder,
  createFolder,
  updateFolder,
  deleteFolder
}; 