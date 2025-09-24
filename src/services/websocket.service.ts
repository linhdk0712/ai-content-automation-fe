import { BrowserEventEmitter } from '../utils/BrowserEventEmitter'

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: number;
  userId?: string;
  workspaceId?: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

export class WebSocketService extends BrowserEventEmitter {
  private ws: WebSocket | null = null;
  private readonly config: WebSocketConfig;
  private reconnectAttempts = 0;
  private heartbeatTimer: number | null = null;
  private isConnected = false;
  private readonly messageQueue: WebSocketMessage[] = [];
  private readonly subscriptions = new Set<string>();

  constructor(config: WebSocketConfig) {
    super();
    this.config = config;
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.config.url}?token=${token}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.processMessageQueue();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = typeof event.data === 'string' ? event.data : '';
            const message: WebSocketMessage = JSON.parse(data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.stopHeartbeat();
          this.emit('disconnected', event);
          
          if (!event.wasClean && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(new Error('WebSocket connection failed'));
        };

      } catch (error) {
        reject(error instanceof Error ? error : new Error('WebSocket connection failed'));
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.stopHeartbeat();
    this.isConnected = false;
  }

  send(message: Omit<WebSocketMessage, 'timestamp'>): void {
    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: Date.now()
    };

    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(fullMessage));
    } else {
      // Queue message for later delivery
      this.messageQueue.push(fullMessage);
    }
  }

  subscribe(channel: string): void {
    this.subscriptions.add(channel);
    this.send({
      type: 'subscribe',
      payload: { channel }
    });
  }

  unsubscribe(channel: string): void {
    this.subscriptions.delete(channel);
    this.send({
      type: 'unsubscribe',
      payload: { channel }
    });
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'heartbeat':
        this.send({ type: 'heartbeat_ack', payload: {} });
        break;
      case 'content_updated':
        this.emit('contentUpdated', message.payload);
        break;
      case 'user_presence':
        this.emit('userPresence', message.payload);
        break;
      case 'notification':
        this.emit('notification', message.payload);
        break;
      case 'analytics_update':
        this.emit('analyticsUpdate', message.payload);
        break;
      case 'publishing_status':
        this.emit('publishingStatus', message.payload);
        break;
      case 'collaboration_event':
        this.emit('collaborationEvent', message.payload);
        break;
      default:
        this.emit('message', message);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = window.setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'heartbeat', payload: {} });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
      this.connect(this.getStoredToken());
    }, delay);
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.ws?.send(JSON.stringify(message));
      }
    }
  }

  private getStoredToken(): string {
    return localStorage.getItem('auth_token') || '';
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }
}

// Singleton instance
const wsConfig: WebSocketConfig = {
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws',
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000
};

export const webSocketService = new WebSocketService(wsConfig);