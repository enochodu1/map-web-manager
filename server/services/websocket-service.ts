import { Server as SocketIOServer, Socket } from 'socket.io';
import { Logger } from 'winston';

export class WebSocketService {
  private connectedClients: Map<string, Set<string>> = new Map();

  constructor(
    private io: SocketIOServer,
    private logger: Logger
  ) {}

  public initialize(): void {
    this.io.on('connection', (socket: Socket) => {
      this.logger.info(`Client connected: ${socket.id}`);

      socket.on('join_server', (serverId: string) => {
        this.joinServerRoom(socket, serverId);
      });

      socket.on('leave_server', (serverId: string) => {
        this.leaveServerRoom(socket, serverId);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });

    this.logger.info('WebSocket service initialized');
  }

  public emitToServer(serverId: string, event: string, data: any): void {
    const room = `server_${serverId}`;
    this.io.to(room).emit(event, data);
  }

  public emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  private joinServerRoom(socket: Socket, serverId: string): void {
    const room = `server_${serverId}`;
    socket.join(room);

    // Track client subscription
    if (!this.connectedClients.has(serverId)) {
      this.connectedClients.set(serverId, new Set());
    }
    this.connectedClients.get(serverId)!.add(socket.id);

    this.logger.debug(`Client ${socket.id} joined server room: ${serverId}`);
  }

  private leaveServerRoom(socket: Socket, serverId: string): void {
    const room = `server_${serverId}`;
    socket.leave(room);

    // Remove client subscription
    const clients = this.connectedClients.get(serverId);
    if (clients) {
      clients.delete(socket.id);
      if (clients.size === 0) {
        this.connectedClients.delete(serverId);
      }
    }

    this.logger.debug(`Client ${socket.id} left server room: ${serverId}`);
  }

  private handleDisconnect(socket: Socket): void {
    // Remove client from all server rooms
    this.connectedClients.forEach((clients, serverId) => {
      if (clients.has(socket.id)) {
        clients.delete(socket.id);
        if (clients.size === 0) {
          this.connectedClients.delete(serverId);
        }
      }
    });

    this.logger.info(`Client disconnected: ${socket.id}`);
  }

  public getConnectedClientsCount(serverId: string): number {
    return this.connectedClients.get(serverId)?.size || 0;
  }

  public isServerMonitored(serverId: string): boolean {
    return this.connectedClients.has(serverId);
  }
} 