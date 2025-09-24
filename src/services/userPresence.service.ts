import { webSocketService } from './websocket.service';
import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

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

export interface PresenceUpdate {
  userId: string;
  status?: UserPresence['status'];
  location?: UserPresence['currentLocation'];
  isTyping?: boolean;
  customStatus?: string;
  timestamp: number;
}

export class UserPresenceService extends BrowserEventEmitter {
  private presences: Map<string, UserPresence> = new Map();
  private activities: UserActivity[] = [];
  private currentUser: UserPresence | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private typingTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private maxActivities = 200;
 
  constructor() {
    super();
    this.setupWebSocketListeners();
    this.setupVisibilityHandlers();
    this.setupActivityTracking();
  }

  private setupWebSocketListeners(): void {
    webSocketService.on('userPresence', (presence: unknown) => {
      this.handlePresenceUpdate(presence as UserPresence);
    });

    webSocketService.on('userActivity', (activity: unknown) => {
      this.handleActivityUpdate(activity as UserActivity);
    });

    webSocketService.on('presenceUpdate', (update: unknown) => {
      this.handlePresenceUpdateEvent(update as PresenceUpdate);
    });

    webSocketService.on('connected', () => {
      if (this.currentUser) {
        this.broadcastPresence();
        this.startHeartbeat();
      }
    });

    webSocketService.on('disconnected', () => {
      this.stopHeartbeat();
    });
  }

  private setupVisibilityHandlers(): void {
    document.addEventListener('visibilitychange', () => {
      if (this.currentUser) {
        const status = document.hidden ? 'away' : 'online';
        this.updateStatus(status);
      }
    });

    // Handle page focus/blur
    window.addEventListener('focus', () => {
      if (this.currentUser) {
        this.updateStatus('online');
      }
    });

    window.addEventListener('blur', () => {
      if (this.currentUser) {
        this.updateStatus('away');
      }
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      if (this.currentUser) {
        this.updateStatus('offline');
      }
    });
  }

  private setupActivityTracking(): void {
    // Track mouse movement
    let lastMouseMove = 0;
    document.addEventListener('mousemove', () => {
      const now = Date.now();
      if (now - lastMouseMove > 5000) { // Throttle to every 5 seconds
        this.updateLastActivity();
        lastMouseMove = now;
      }
    });

    // Track keyboard activity
    let lastKeyPress = 0;
    document.addEventListener('keypress', () => {
      const now = Date.now();
      if (now - lastKeyPress > 5000) { // Throttle to every 5 seconds
        this.updateLastActivity();
        lastKeyPress = now;
      }
    });

    // Track clicks
    document.addEventListener('click', () => {
      this.updateLastActivity();
    });
  }

  private handlePresenceUpdate(presence: UserPresence): void {
    const existingPresence = this.presences.get(presence.userId);
    this.presences.set(presence.userId, presence);

    if (!existingPresence || existingPresence.status !== presence.status) {
      this.emit('statusChanged', presence);
    }

    if (!existingPresence || 
        JSON.stringify(existingPresence.currentLocation) !== JSON.stringify(presence.currentLocation)) {
      this.emit('locationChanged', presence);
    }

    this.emit('presenceUpdated', presence);
  }

  private handleActivityUpdate(activity: UserActivity): void {
    this.activities.unshift(activity);
    
    // Keep only recent activities
    if (this.activities.length > this.maxActivities) {
      this.activities = this.activities.slice(0, this.maxActivities);
    }

    this.emit('activityAdded', activity);
  }

  private handlePresenceUpdateEvent(update: PresenceUpdate): void {
    const presence = this.presences.get(update.userId);
    if (presence) {
      if (update.status) presence.status = update.status;
      if (update.location) presence.currentLocation = update.location;
      if (update.isTyping !== undefined) presence.isTyping = update.isTyping;
      if (update.customStatus !== undefined) presence.customStatus = update.customStatus;
      
      presence.lastSeen = update.timestamp;
      
      this.emit('presenceUpdated', presence);
    }
  }

  initializeUser(user: {
    userId: string;
    username: string;
    avatar?: string;
  }): void {
    this.currentUser = {
      ...user,
      status: 'online',
      lastSeen: Date.now()
    };

    this.broadcastPresence();
    this.startHeartbeat();
  }

  updateStatus(status: UserPresence['status']): void {
    if (!this.currentUser) return;

    this.currentUser.status = status;
    this.currentUser.lastSeen = Date.now();
    
    this.broadcastPresence();
    this.emit('currentUserStatusChanged', status);
  }

  updateLocation(location: UserPresence['currentLocation']): void {
    if (!this.currentUser) return;

    this.currentUser.currentLocation = location;
    this.currentUser.lastSeen = Date.now();
    
    this.broadcastPresence();
    this.emit('currentUserLocationChanged', location);
  }

  updateCustomStatus(customStatus: string): void {
    if (!this.currentUser) return;

    this.currentUser.customStatus = customStatus;
    this.currentUser.lastSeen = Date.now();
    
    this.broadcastPresence();
  }

  setTyping(isTyping: boolean, context?: { contentId?: string; workspaceId?: string }): void {
    if (!this.currentUser) return;

    this.currentUser.isTyping = isTyping;
    
    webSocketService.send({
      type: 'typing_status',
      payload: {
        isTyping,
        context,
        timestamp: Date.now()
      }
    });

    // Auto-clear typing status after 3 seconds of inactivity
    if (isTyping) {
      const timeoutKey = `${this.currentUser.userId}_typing`;
      const existingTimeout = this.typingTimeouts.get(timeoutKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        this.setTyping(false, context);
        this.typingTimeouts.delete(timeoutKey);
      }, 3000);

      this.typingTimeouts.set(timeoutKey, timeout);
    }
  }

  private broadcastPresence(): void {
    if (!this.currentUser) return;

    webSocketService.send({
      type: 'presence_update',
      payload: {
        ...this.currentUser,
        timestamp: Date.now()
      }
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.currentUser) {
        this.updateLastActivity();
        this.broadcastPresence();
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval as unknown as number);
      this.heartbeatInterval = null;
    }
  }

  private updateLastActivity(): void {
    if (!this.currentUser) return;

    this.currentUser.lastSeen = Date.now();
    
    // Update status to online if user was away
    if (this.currentUser.status === 'away') {
      this.updateStatus('online');
    }
  }

  trackActivity(action: string, resource: string, resourceId: string, metadata?: Record<string, any>): void {
    if (!this.currentUser) return;

    const activity: UserActivity = {
      userId: this.currentUser.userId,
      action,
      resource,
      resourceId,
      timestamp: Date.now(),
      metadata
    };

    webSocketService.send({
      type: 'user_activity',
      payload: activity
    });

    // Add to local activities
    this.handleActivityUpdate(activity);
  }

  getPresence(userId: string): UserPresence | undefined {
    return this.presences.get(userId);
  }

  getAllPresences(): UserPresence[] {
    return Array.from(this.presences.values());
  }

  getOnlineUsers(): UserPresence[] {
    return this.getAllPresences().filter(p => p.status === 'online');
  }

  getUsersInLocation(location: { page: string; contentId?: string; workspaceId?: string }): UserPresence[] {
    return this.getAllPresences().filter(presence => {
      if (!presence.currentLocation) return false;
      
      return presence.currentLocation.page === location.page &&
             presence.currentLocation.contentId === location.contentId &&
             presence.currentLocation.workspaceId === location.workspaceId;
    });
  }

  getTypingUsers(context?: { contentId?: string; workspaceId?: string }): UserPresence[] {
    return this.getAllPresences().filter(presence => {
      if (!presence.isTyping) return false;
      
      if (context) {
        return presence.currentLocation?.contentId === context.contentId &&
               presence.currentLocation?.workspaceId === context.workspaceId;
      }
      
      return true;
    });
  }

  getRecentActivities(userId?: string, limit = 20): UserActivity[] {
    let activities = this.activities;
    
    if (userId) {
      activities = activities.filter(a => a.userId === userId);
    }
    
    return activities.slice(0, limit);
  }

  subscribeToWorkspace(workspaceId: string): void {
    webSocketService.subscribe(`presence:workspace:${workspaceId}`);
  }

  unsubscribeFromWorkspace(workspaceId: string): void {
    webSocketService.unsubscribe(`presence:workspace:${workspaceId}`);
  }

  subscribeToContent(contentId: string): void {
    webSocketService.subscribe(`presence:content:${contentId}`);
  }

  unsubscribeFromContent(contentId: string): void {
    webSocketService.unsubscribe(`presence:content:${contentId}`);
  }

  getCurrentUser(): UserPresence | null {
    return this.currentUser;
  }

  isUserOnline(userId: string): boolean {
    const presence = this.presences.get(userId);
    if (!presence) return false;
    
    const now = Date.now();
    const offlineThreshold = 5 * 60 * 1000; // 5 minutes
    
    return presence.status === 'online' && 
           (now - presence.lastSeen) < offlineThreshold;
  }

  getLastSeenText(userId: string): string {
    const presence = this.presences.get(userId);
    if (!presence) return 'Never';
    
    const now = Date.now();
    const diff = now - presence.lastSeen;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return `${Math.floor(diff / 86400000)} days ago`;
  }

  destroy(): void {
    this.stopHeartbeat();
    
    // Clear all typing timeouts
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout as unknown as number));
    this.typingTimeouts.clear();
    
    // Update status to offline
    if (this.currentUser) {
      this.updateStatus('offline');
    }
    
    this.presences.clear();
    this.activities = [];
    this.removeAllListeners();
  }
}

export const userPresenceService = new UserPresenceService();