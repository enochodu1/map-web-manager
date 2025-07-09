import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MCPServer, MCPLog, MCPHealthCheck } from '@/types';

const WS_URL = process.env.WS_URL || 'ws://localhost:3001';

interface WebSocketCallbacks {
  onServerStatusUpdate?: (status: { serverId: string; status: MCPServer['status'] }) => void;
  onServerLog?: (log: MCPLog) => void;
  onHealthCheck?: (health: MCPHealthCheck) => void;
}

export const useWebSocket = (callbacks: WebSocketCallbacks) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    const socket = socketRef.current;

    // Set up event listeners
    if (callbacks.onServerStatusUpdate) {
      socket.on('server_status', callbacks.onServerStatusUpdate);
    }

    if (callbacks.onServerLog) {
      socket.on('server_log', callbacks.onServerLog);
    }

    if (callbacks.onHealthCheck) {
      socket.on('health_check', callbacks.onHealthCheck);
    }

    // Connection status events
    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (callbacks.onServerStatusUpdate) {
        socket.off('server_status', callbacks.onServerStatusUpdate);
      }

      if (callbacks.onServerLog) {
        socket.off('server_log', callbacks.onServerLog);
      }

      if (callbacks.onHealthCheck) {
        socket.off('health_check', callbacks.onHealthCheck);
      }

      socket.disconnect();
    };
  }, []); // Empty dependency array since we want to initialize only once

  // Helper functions to join/leave server rooms
  const joinServer = (serverId: string) => {
    socketRef.current?.emit('join_server', serverId);
  };

  const leaveServer = (serverId: string) => {
    socketRef.current?.emit('leave_server', serverId);
  };

  return {
    socket: socketRef.current,
    joinServer,
    leaveServer
  };
}; 