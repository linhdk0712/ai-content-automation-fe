// Dynamic import approach for Socket.IO client
let io: any = null;

// Initialize Socket.IO client
const initializeSocketIO = async () => {
  if (io) return io;

  try {
    const socketIOModule = await import('socket.io-client');
    io = socketIOModule.io || socketIOModule.default;
    return io;
  } catch (error) {
    console.error('Failed to load Socket.IO client:', error);
    // Fallback mock
    io = () => ({
      connected: false,
      on: () => { },
      emit: () => { },
      disconnect: () => { },
      id: null
    });
    return io;
  }
};

export interface SocketEventData<T = any> {
  type: string;
  executionId: string;
  workflowId?: string;
  workflowName?: string;
  nodeName: string;
  nodeType?: string;
  status: string;
  mode?: string;
  finishedAt?: string;
  result?: T;
  contentId?: number;
  timestamp: string;
}

export interface SocketConnectionOptions {
  userId?: number;
  onConnection?: () => void;
  onWorkflowUpdate?: (data: SocketEventData) => void;
  onExecutionUpdate?: (data: SocketEventData) => void;
  onContentUpdate?: (data: SocketEventData) => void;
  onError?: (error: Error) => void;
  onDisconnect?: () => void;
}

export class SocketService {
  private socket: any | null = null;
  private baseUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private connectionOptions: SocketConnectionOptions | null = null;

  constructor() {
    // Use environment variable for realtime server URL with fallback
    this.baseUrl = import.meta.env.VITE_REALTIME_SERVER_URL || 'http://localhost:3001';
    console.log('Socket service initialized with URL:', this.baseUrl);
  }

  /**
   * Connect to Socket.IO server
   */
  async connect(options: SocketConnectionOptions): Promise<void> {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.connectionOptions = options;

    try {
      // Initialize Socket.IO client
      const socketIO = await initializeSocketIO();

      if (typeof socketIO !== 'function') {
        throw new Error('Socket.IO client not available');
      }

      this.socket = socketIO(this.baseUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to create socket connection:', error);
      // Fallback to mock behavior
      setTimeout(() => {
        this.connectionOptions?.onError?.(new Error(`Socket.IO connection failed: ${error}`));
      }, 100);
    }
  }

  /**
   * Setup Socket.IO event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket || !this.connectionOptions) return;

    try {
      // Connection events
      this.socket.on('connect', () => {
        console.log('Socket.IO connected:', this.socket?.id);
        this.reconnectAttempts = 0;
        this.connectionOptions?.onConnection?.();
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log('Socket.IO disconnected:', reason);
        this.connectionOptions?.onDisconnect?.();
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('Socket.IO connection error:', error);
        this.connectionOptions?.onError?.(error);
      });

      // Workflow update events
      this.socket.on('workflow_update', (data: SocketEventData) => {
        console.log('Received workflow update:', data);
        this.connectionOptions?.onWorkflowUpdate?.(data);
      });

      this.socket.on('execution_update', (data: SocketEventData) => {
        console.log('Received execution update:', data);
        this.connectionOptions?.onExecutionUpdate?.(data);
      });

      this.socket.on('content_update', (data: SocketEventData) => {
        console.log('Received content update:', data);
        this.connectionOptions?.onContentUpdate?.(data);
      });

      // Room events
      this.socket.on('joined_room', (data: { room: string; type: string }) => {
        console.log('Joined room:', data);
      });

      this.socket.on('left_room', (data: { room: string }) => {
        console.log('Left room:', data);
      });
    } catch (error) {
      console.error('Error setting up socket listeners:', error);
    }
  }

  /**
   * Join execution room for specific execution updates
   */
  joinExecutionRoom(executionId: string): void {
    try {
      if (!this.socket?.connected) {
        console.warn('Socket not connected, cannot join execution room');
        return;
      }
      this.socket.emit('join_execution', executionId);
    } catch (error) {
      console.error('Error joining execution room:', error);
    }
  }

  /**
   * Join content room for specific content updates
   */
  joinContentRoom(contentId: string | number): void {
    try {
      if (!this.socket?.connected) {
        console.warn('Socket not connected, cannot join content room');
        return;
      }
      this.socket.emit('join_content', contentId);
    } catch (error) {
      console.error('Error joining content room:', error);
    }
  }

  /**
   * Leave a specific room
   */
  leaveRoom(roomName: string): void {
    try {
      if (!this.socket?.connected) {
        console.warn('Socket not connected, cannot leave room');
        return;
      }
      this.socket.emit('leave_room', roomName);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    try {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
        this.connectionOptions = null;
        this.reconnectAttempts = 0;
      }
    } catch (error) {
      console.error('Error disconnecting socket:', error);
    }
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    try {
      return this.socket?.connected || false;
    } catch (error) {
      console.error('Error checking connection state:', error);
      return false;
    }
  }

  /**
   * Get connection state
   */
  getConnectionState(): string {
    try {
      if (!this.socket) return 'disconnected';
      return this.socket.connected ? 'connected' : 'disconnected';
    } catch (error) {
      console.error('Error getting connection state:', error);
      return 'disconnected';
    }
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | null {
    try {
      return this.socket?.id || null;
    } catch (error) {
      console.error('Error getting socket ID:', error);
      return null;
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();