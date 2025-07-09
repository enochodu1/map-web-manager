import { create } from 'zustand';
import { MCPServer } from '@/types';

interface ServerState {
  servers: MCPServer[];
  selectedServerId: string | null;
  addServer: (server: MCPServer) => void;
  updateServer: (id: string, updates: Partial<MCPServer>) => void;
  removeServer: (id: string) => void;
  setSelectedServer: (id: string | null) => void;
  getServer: (id: string) => MCPServer | undefined;
}

export const useServerStore = create<ServerState>((set, get) => ({
  servers: [],
  selectedServerId: null,

  addServer: (server) => {
    set((state) => ({
      servers: [...state.servers, server]
    }));
  },

  updateServer: (id, updates) => {
    set((state) => ({
      servers: state.servers.map((server) =>
        server.id === id ? { ...server, ...updates } : server
      )
    }));
  },

  removeServer: (id) => {
    set((state) => ({
      servers: state.servers.filter((server) => server.id !== id),
      selectedServerId: state.selectedServerId === id ? null : state.selectedServerId
    }));
  },

  setSelectedServer: (id) => {
    set({ selectedServerId: id });
  },

  getServer: (id) => {
    return get().servers.find((server) => server.id === id);
  }
})); 