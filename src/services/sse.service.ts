import { TokenManager } from './api';

export interface SseEventData<T = any> {
  errorCode: string;
  errorMessage: string;
  data: T;
}

export interface SseConnectionOptions {
  userId: number;
  onConnection?: (data: string) => void;
  onWorkflowUpdate?: (data: any) => void;
  onRunUpdate?: (data: any) => void;
  onNodeUpdate?: (data: any) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
}

export class SseService {
  private eventSource: EventSource | null = null;
  private baseUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  }

  /**
   * Connect to workflow stream for real-time updates
   */
  connectToWorkflowStream(workflowKey: string, options: SseConnectionOptions): void {
    const url = `${this.baseUrl}/n8n/workflows/${workflowKey}/stream`;
    this.connect(url, options);
  }

  /**
   * Connect to workflow run stream for real-time updates
   */
  connectToRunStream(runId: string, options: SseConnectionOptions): void {
    const url = `${this.baseUrl}/n8n/runs/${runId}/stream`;
    this.connect(url, options);
  }

  /**
   * Generic connect method
   */
  private connect(url: string, options: SseConnectionOptions): void {
    this.disconnect(); // Close existing connection

    try {
      // Get authentication token
      const token = TokenManager.getAccessToken();
      
      // Create EventSource with authentication headers
      // Note: EventSource doesn't support custom headers directly
      // We need to pass auth via URL params or use a different approach
      const authUrl = this.addAuthToUrl(url, options.userId, token);
      
      console.log('Connecting to SSE:', authUrl);
      
      this.eventSource = new EventSource(authUrl);

      // Connection opened
      this.eventSource.onopen = () => {
        console.log('SSE connection opened');
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      };

      // Handle different event types
      this.eventSource.addEventListener('connection', (event) => {
        console.log('SSE connection confirmed:', event.data);
        try {
          const parsedData: SseEventData<string> = JSON.parse(event.data);
          options.onConnection?.(parsedData.data);
        } catch (error) {
          console.error('Failed to parse connection event:', error);
        }
      });

      this.eventSource.addEventListener('workflow-update', (event) => {
        console.log('SSE workflow update:', event.data);
        try {
          const parsedData: SseEventData = JSON.parse(event.data);
          options.onWorkflowUpdate?.(parsedData.data);
        } catch (error) {
          console.error('Failed to parse workflow update:', error);
        }
      });

      this.eventSource.addEventListener('run-update', (event) => {
        console.log('SSE run update:', event.data);
        try {
          const parsedData: SseEventData = JSON.parse(event.data);
          options.onRunUpdate?.(parsedData.data);
        } catch (error) {
          console.error('Failed to parse run update:', error);
        }
      });

      this.eventSource.addEventListener('node-update', (event) => {
        console.log('SSE node update:', event.data);
        try {
          const parsedData: SseEventData = JSON.parse(event.data);
          options.onNodeUpdate?.(parsedData.data);
        } catch (error) {
          console.error('Failed to parse node update:', error);
        }
      });

      // Handle errors
      this.eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        options.onError?.(error);
        
        // Attempt to reconnect
        this.handleReconnect(url, options);
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      options.onError?.(error as Event);
    }
  }

  /**
   * Add authentication to URL since EventSource doesn't support custom headers
   */
  private addAuthToUrl(url: string, userId: number, token: string | null): string {
    const urlObj = new URL(url, window.location.origin);
    
    // Add user ID as header parameter (backend expects X-User-Id header)
    // We'll need to modify backend to also accept URL params for SSE
    urlObj.searchParams.set('userId', userId.toString());
    
    if (token) {
      // Add token as parameter (backend needs to handle this)
      urlObj.searchParams.set('token', token);
    }
    
    return urlObj.toString();
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(url: string, options: SseConnectionOptions): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(url, options);
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      options.onClose?.();
    }
  }

  /**
   * Disconnect from SSE stream
   */
  disconnect(): void {
    if (this.eventSource) {
      console.log('Disconnecting SSE');
      this.eventSource.close();
      this.eventSource = null;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  /**
   * Get connection state
   */
  getConnectionState(): number | null {
    return this.eventSource?.readyState || null;
  }
}

// Export singleton instance
export const sseService = new SseService();