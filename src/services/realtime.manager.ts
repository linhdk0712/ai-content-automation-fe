// Real-time Manager - Centralized Socket.IO management
import { socketService } from './socket.service';
import { publishingStatusService } from './publishingStatus.service';
import { liveAnalyticsService } from './liveAnalytics.service';
import { collaborationService } from './collaboration.service';

export class RealTimeManager {
  private isInitialized = false;
  private connectionRetryCount = 0;
  private maxRetries = 3;

  /**
   * Initialize all real-time services
   */
  async initialize(userId?: number): Promise<void> {
    if (this.isInitialized) {
      console.log('Real-time manager already initialized');
      return;
    }

    try {
      console.log('Initializing real-time services...');

      // Initialize Socket.IO connection with centralized error handling
      await socketService.connect({
        userId,
        onConnection: () => {
          console.log('✅ Real-time services connected');
          this.connectionRetryCount = 0;
          this.isInitialized = true;
        },
        onError: (error: Error) => {
          console.error('❌ Real-time connection error:', error);
          this.handleConnectionError();
        },
        onDisconnect: () => {
          console.warn('⚠️ Real-time services disconnected');
          this.isInitialized = false;
          this.handleDisconnection();
        }
      });

      console.log('✅ Real-time manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize real-time manager:', error);
      this.handleConnectionError();
    }
  }

  /**
   * Disconnect all real-time services
   */
  disconnect(): void {
    try {
      socketService.disconnect();
      this.isInitialized = false;
      this.connectionRetryCount = 0;
      console.log('✅ Real-time services disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting real-time services:', error);
    }
  }

  /**
   * Check if real-time services are connected
   */
  isConnected(): boolean {
    return this.isInitialized && socketService.isConnected();
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    socketId: string | null;
    retryCount: number;
  } {
    return {
      connected: this.isConnected(),
      socketId: socketService.getSocketId(),
      retryCount: this.connectionRetryCount
    };
  }

  /**
   * Subscribe to specific content for real-time updates
   */
  subscribeToContent(contentId: string | number): void {
    if (this.isConnected()) {
      // Subscribe all relevant services to this content
      publishingStatusService.subscribeToContent(contentId.toString());
      collaborationService.joinContent(contentId.toString());
      
      // Join Socket.IO room for this content
      socketService.joinContentRoom(contentId);
      
      console.log(`📡 Subscribed to content: ${contentId}`);
    } else {
      console.warn('Cannot subscribe to content - not connected');
    }
  }

  /**
   * Unsubscribe from content
   */
  unsubscribeFromContent(contentId: string | number): void {
    if (this.isConnected()) {
      // Unsubscribe services
      publishingStatusService.unsubscribeFromContent(`content_${contentId}`);
      collaborationService.leaveContent();
      
      // Leave Socket.IO room
      socketService.leaveRoom(`content_${contentId}`);
      
      console.log(`📡 Unsubscribed from content: ${contentId}`);
    }
  }

  /**
   * Subscribe to workflow execution
   */
  subscribeToExecution(executionId: string): void {
    if (this.isConnected()) {
      publishingStatusService.subscribeToJob(executionId);
      socketService.joinExecutionRoom(executionId);
      
      console.log(`📡 Subscribed to execution: ${executionId}`);
    } else {
      console.warn('Cannot subscribe to execution - not connected');
    }
  }

  /**
   * Unsubscribe from workflow execution
   */
  unsubscribeFromExecution(executionId: string): void {
    if (this.isConnected()) {
      publishingStatusService.unsubscribeFromJob(`execution_${executionId}`);
      socketService.leaveRoom(`execution_${executionId}`);
      
      console.log(`📡 Unsubscribed from execution: ${executionId}`);
    }
  }

  /**
   * Handle connection errors with retry logic
   */
  private handleConnectionError(): void {
    this.connectionRetryCount++;
    
    if (this.connectionRetryCount <= this.maxRetries) {
      const retryDelay = Math.min(1000 * Math.pow(2, this.connectionRetryCount), 10000);
      
      console.log(`🔄 Retrying connection in ${retryDelay}ms (attempt ${this.connectionRetryCount}/${this.maxRetries})`);
      
      setTimeout(() => {
        this.initialize();
      }, retryDelay);
    } else {
      console.error('❌ Max connection retries reached. Real-time features disabled.');
      // Optionally show user notification about offline mode
      this.notifyOfflineMode();
    }
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(): void {
    // Attempt to reconnect after a short delay
    setTimeout(() => {
      if (!this.isConnected()) {
        console.log('🔄 Attempting to reconnect...');
        this.initialize();
      }
    }, 2000);
  }

  /**
   * Notify user about offline mode
   */
  private notifyOfflineMode(): void {
    // This could integrate with a toast service or notification system
    console.warn('📴 Real-time features are currently offline. Some features may not work as expected.');
    
    // Optionally emit an event that UI components can listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('realtime-offline', {
        detail: { retryCount: this.connectionRetryCount }
      }));
    }
  }

  /**
   * Force reconnection
   */
  reconnect(): void {
    console.log('🔄 Force reconnecting real-time services...');
    this.disconnect();
    this.connectionRetryCount = 0;
    setTimeout(() => {
      this.initialize();
    }, 1000);
  }
}

// Export singleton instance
export const realTimeManager = new RealTimeManager();

// Auto-initialize when imported (can be disabled if needed)
if (typeof window !== 'undefined') {
  // Initialize after a short delay to allow other services to load
  setTimeout(() => {
    realTimeManager.initialize();
  }, 1000);
}