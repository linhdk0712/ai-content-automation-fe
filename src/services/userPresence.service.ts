// UserPresence service - cleaned version
// Realtime functionality has been removed

export interface UserPresence {
  userId: string;
  username: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy';
  lastSeen: number;
  currentLocation?: {
    page: string;
    contentId?: string;
    workspaceId?: string;
  };
  isTyping?: boolean;
  customStatus?: string;
}

export interface UserActivity {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class UserPresenceService {
  // Placeholder for future realtime implementation with alternative technology
  private static instance: UserPresenceService | null = null;

  static getInstance(): UserPresenceService {
    if (!UserPresenceService.instance) {
      return new UserPresenceService();
    }
    return UserPresenceService.instance;
  }

  // Real-time presence using Socket.IO
  setupSocketListeners(): void {
    const { socketService } = require('./socket.service');
    
    socketService.connect({
      onConnection: () => {
        console.log('User presence service connected to Socket.IO');
        this.updatePresence('online');
      },
      onWorkflowUpdate: (data: any) => {
        // Handle presence updates from workflow data
        if (data.result && data.result.userPresence) {
          this.handlePresenceUpdate(data.result.userPresence);
        }
      },
      onError: (error: Error) => {
        console.error('User presence Socket.IO error:', error);
      },
      onDisconnect: () => {
        console.warn('User presence Socket.IO disconnected');
        this.updatePresence('away');
      }
    });
  }

  private handlePresenceUpdate(presenceData: any): void {
    // Handle incoming presence updates from other users
    if (presenceData.userId && presenceData.status) {
      // Update local presence cache
      console.log('User presence update:', presenceData);
      // Emit event for UI updates
      this.emit?.('presenceUpdate', presenceData);
    }
  }

  private async updatePresence(status: 'online' | 'away' | 'busy'): Promise<void> {
    try {
      // Send presence update to backend
      const { apiRequest } = require('./api');
      await apiRequest.patch('/user/presence', {
        status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  }

  startHeartbeat(): void {
    console.log('UserPresenceService: startHeartbeat() method needs to be implemented with new realtime technology');
  }

  stopHeartbeat(): void {
    console.log('UserPresenceService: stopHeartbeat() method needs to be implemented with new realtime technology');
  }

  refreshAuthSession(): void {
    console.log('UserPresenceService: refreshAuthSession() method needs to be implemented with new realtime technology');
  }

  updatePresenceStatus(): void {
    console.log('UserPresenceService: updatePresenceStatus() method needs to be implemented with new realtime technology');
  }

  updateLocation(_location: UserPresence['currentLocation']): void {
    console.log('UserPresenceService: updateLocation() method needs to be implemented with new realtime technology');
  }

  setTyping(_isTyping: boolean, _contentId?: string): void {
    console.log('UserPresenceService: setTyping() method needs to be implemented with new realtime technology');
  }

  getActivePresences(): UserPresence[] {
    console.log('UserPresenceService: getActivePresences() method needs to be implemented with new realtime technology');
    return [];
  }

  getPresenceHistory(): UserActivity[] {
    console.log('UserPresenceService: getPresenceHistory() method needs to be implemented with new realtime technology');
    return [];
  }

  addActivityLog(): void {
    console.log('UserPresenceService: addActivityLog() method needs to be implemented with new realtime technology');
  }

  subscribeToPresenceUpdates(): () => void {
    console.log('UserPresenceService: subscribeToPresenceUpdates() method needs to be implemented with new realtime technology');
    return () => {}; // Return empty cleanup function
  }

  subscribeToActivityUpdates(): () => void {
    console.log('UserPresenceService: subscribeToActivityUpdates() method needs to be implemented with new realtime technology');
    return () => {}; // Return empty cleanup function
  }

  subscribeToWorkspace(_workspaceId: string): () => void {
    console.log('UserPresenceService: subscribeToWorkspace() method needs to be implemented with new realtime technology');
    return () => {}; // Return empty cleanup function
  }

  subscribeToContent(_contentId: string): () => void {
    console.log('UserPresenceService: subscribeToContent() method needs to be implemented with new realtime technology');
    return () => {}; // Return empty cleanup function
  }

  cleanup(): void {
    console.log('UserPresenceService: cleanup() method needs to be implemented with new realtime technology');
  }

  destroy(): void {
    UserPresenceService.instance = null;
  }
}

// Export singleton instance
export const userPresenceService = UserPresenceService.getInstance();