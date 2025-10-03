// UserPresence service - cleaned version
// Realtime functionality has been removed

export interface UserPresence {
  userId: string;
  username: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
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

  // Placeholder methods - implement with new realtime technology
  setupSupabaseListeners(): void {
    console.log('UserPresenceService: setupSupabaseListeners() method needs to be implemented with new realtime technology');
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