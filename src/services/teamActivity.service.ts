import { WebSocketService } from './websocket.service';

export interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  username: string;
  userAvatar?: string;
  action: string;
  description: string;
  timestamp: number;
  resourceId?: string;
  resourceType?: ResourceType;
  resourceName?: string;
  metadata?: Record<string, any>;
  workspaceId?: string;
  visibility: ActivityVisibility;
}

export enum ActivityType {
  CONTENT_CREATED = 'content_created',
  CONTENT_UPDATED = 'content_updated',
  CONTENT_PUBLISHED = 'content_published',
  CONTENT_DELETED = 'content_deleted',
  COMMENT_ADDED = 'comment_added',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  PERMISSION_CHANGED = 'permission_changed',
  WORKSPACE_UPDATED = 'workspace_updated',
  TEMPLATE_CREATED = 'template_created',
  TEMPLATE_USED = 'template_used',
  PAYMENT_COMPLETED = 'payment_completed',
  SUBSCRIPTION_CHANGED = 'subscription_changed',
  INTEGRATION_CONNECTED = 'integration_connected',
  ANALYTICS_MILESTONE = 'analytics_milestone',
  SYSTEM_EVENT = 'system_event'
}

export enum ResourceType {
  CONTENT = 'content',
  TEMPLATE = 'template',
  WORKSPACE = 'workspace',
  USER = 'user',
  PAYMENT = 'payment',
  INTEGRATION = 'integration',
  ANALYTICS = 'analytics'
}

export enum ActivityVisibility {
  PUBLIC = 'public',
  WORKSPACE = 'workspace',
  PRIVATE = 'private'
}

export interface UserPresence {
  userId: string;
  username: string;
  avatar?: string;
  status: PresenceStatus;
  lastSeen: number;
  currentActivity?: string;
  location?: UserLocation;
  device?: DeviceInfo;
  isOnline: boolean;
}

export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline'
}

export interface UserLocation {
  page: string;
  section?: string;
  documentId?: string;
  workspaceId?: string;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
}

export interface CollaborationSession {
  id: string;
  resourceId: string;
  resourceType: ResourceType;
  participants: SessionParticipant[];
  startedAt: number;
  lastActivity: number;
  isActive: boolean;
}

export interface SessionParticipant {
  userId: string;
  username: string;
  avatar?: string;
  joinedAt: number;
  role: ParticipantRole;
  permissions: string[];
  cursor?: CursorPosition;
  selection?: TextSelection;
}

export enum ParticipantRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  COMMENTER = 'commenter'
}

export interface CursorPosition {
  line: number;
  column: number;
  timestamp: number;
}

export interface TextSelection {
  start: CursorPosition;
  end: CursorPosition;
  timestamp: number;
}

export interface ActivityFilter {
  types?: ActivityType[];
  userIds?: string[];
  resourceTypes?: ResourceType[];
  workspaceId?: string;
  dateRange?: {
    start: number;
    end: number;
  };
  visibility?: ActivityVisibility[];
}

export interface ActivityFeed {
  activities: Activity[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
}

export class TeamActivityService {
  private wsService: WebSocketService;
  private userPresences: Map<string, UserPresence> = new Map();
  private collaborationSessions: Map<string, CollaborationSession> = new Map();
  private activityCallbacks: ((activity: Activity) => void)[] = [];
  private presenceCallbacks: ((presences: UserPresence[]) => void)[] = [];
  private sessionCallbacks: ((sessions: CollaborationSession[]) => void)[] = [];
  private currentUserId: string;
  private currentWorkspaceId?: string;

  constructor(wsService: WebSocketService, userId: string) {
    this.wsService = wsService;
    this.currentUserId = userId;
    this.setupWebSocketListeners();
    this.initializePresence();
  }

  private setupWebSocketListeners(): void {
    this.wsService.subscribe('activity_created');
    this.wsService.subscribe('user_presence_update');
    this.wsService.subscribe('user_joined_workspace');
    this.wsService.subscribe('user_left_workspace');
    this.wsService.subscribe('collaboration_session_started');
    this.wsService.subscribe('collaboration_session_updated');
    this.wsService.subscribe('collaboration_session_ended');
    this.wsService.subscribe('participant_joined');
    this.wsService.subscribe('participant_left');
    this.wsService.subscribe('cursor_position_update');
    this.wsService.subscribe('text_selection_update');
    this.wsService.subscribe('bulk_activities');
  }

  // Activity Management
  createActivity(activity: Omit<Activity, 'id' | 'timestamp' | 'userId' | 'username'>): void {
    const fullActivity: Activity = {
      ...activity,
      id: this.generateActivityId(),
      timestamp: Date.now(),
      userId: this.currentUserId,
      username: this.getCurrentUsername()
    };

    this.wsService.send({ type: 'create_activity', payload: { activity: fullActivity } });
  }

  getActivities(filter?: ActivityFilter, limit = 50, cursor?: string): Promise<ActivityFeed> {
    return new Promise(() => {
      const requestId = this.generateRequestId();
      this.wsService.send({ 
        type: 'get_activity_feed', 
        payload: { requestId, filter, limit, cursor } 
      });
    });
  }



  // Presence Management
  private initializePresence(): void {
    this.updatePresence(PresenceStatus.ONLINE);
    
    // Update presence periodically
    setInterval(() => {
      this.sendHeartbeat();
    }, 30000);

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.updatePresence(PresenceStatus.AWAY);
      } else {
        this.updatePresence(PresenceStatus.ONLINE);
      }
    });

    // Handle beforeunload
    window.addEventListener('beforeunload', () => {
      this.updatePresence(PresenceStatus.OFFLINE);
    });
  }

  updatePresence(status: PresenceStatus, activity?: string, location?: UserLocation): void {
    const presence: UserPresence = {
      userId: this.currentUserId,
      username: this.getCurrentUsername(),
      avatar: this.getCurrentUserAvatar(),
      status,
      lastSeen: Date.now(),
      currentActivity: activity,
      location,
      device: this.getDeviceInfo(),
      isOnline: status !== PresenceStatus.OFFLINE
    };

    this.userPresences.set(this.currentUserId, presence);

    this.wsService.send({ type: 'update_presence', payload: { presence } });
  }




  private sendHeartbeat(): void {
    this.wsService.send({ 
      type: 'presence_heartbeat', 
      payload: { userId: this.currentUserId, timestamp: Date.now() } 
    });
  }

  // Collaboration Session Management
  startCollaborationSession(resourceId: string, resourceType: ResourceType): void {
    this.wsService.send({ 
      type: 'start_collaboration_session', 
      payload: { resourceId, resourceType, userId: this.currentUserId } 
    });
  }

  joinCollaborationSession(sessionId: string): void {
    this.wsService.send({ 
      type: 'join_collaboration_session', 
      payload: { sessionId, userId: this.currentUserId } 
    });
  }

  leaveCollaborationSession(sessionId: string): void {
    this.wsService.send({ 
      type: 'leave_collaboration_session', 
      payload: { sessionId, userId: this.currentUserId } 
    });
  }

  updateCursorPosition(sessionId: string, cursor: CursorPosition): void {
    this.wsService.send({ 
      type: 'update_cursor_position', 
      payload: { sessionId, userId: this.currentUserId, cursor } 
    });
  }

  updateTextSelection(sessionId: string, selection: TextSelection): void {
    this.wsService.send({ 
      type: 'update_text_selection', 
      payload: { sessionId, userId: this.currentUserId, selection } 
    });
  }








  // Workspace Management
  setCurrentWorkspace(workspaceId: string): void {
    this.currentWorkspaceId = workspaceId;
    
    this.wsService.send({ 
      type: 'join_workspace', 
      payload: { workspaceId, userId: this.currentUserId } 
    });

    this.updatePresence(PresenceStatus.ONLINE, 'working', {
      page: 'workspace',
      workspaceId
    });
  }

  leaveCurrentWorkspace(): void {
    if (this.currentWorkspaceId) {
      this.wsService.send({ 
        type: 'leave_workspace', 
        payload: { workspaceId: this.currentWorkspaceId, userId: this.currentUserId } 
      });
      
      this.currentWorkspaceId = undefined;
    }
  }

  // Event Listeners
  onActivity(callback: (activity: Activity) => void): () => void {
    this.activityCallbacks.push(callback);
    return () => {
      const index = this.activityCallbacks.indexOf(callback);
      if (index > -1) {
        this.activityCallbacks.splice(index, 1);
      }
    };
  }

  onPresenceChange(callback: (presences: UserPresence[]) => void): () => void {
    this.presenceCallbacks.push(callback);
    return () => {
      const index = this.presenceCallbacks.indexOf(callback);
      if (index > -1) {
        this.presenceCallbacks.splice(index, 1);
      }
    };
  }

  onSessionChange(callback: (sessions: CollaborationSession[]) => void): () => void {
    this.sessionCallbacks.push(callback);
    return () => {
      const index = this.sessionCallbacks.indexOf(callback);
      if (index > -1) {
        this.sessionCallbacks.splice(index, 1);
      }
    };
  }

  // Getters
  getUserPresences(): UserPresence[] {
    return Array.from(this.userPresences.values());
  }

  getOnlineUsers(): UserPresence[] {
    return this.getUserPresences().filter(p => p.isOnline);
  }

  getCollaborationSessions(): CollaborationSession[] {
    return Array.from(this.collaborationSessions.values());
  }

  getActiveCollaborationSessions(): CollaborationSession[] {
    return this.getCollaborationSessions().filter(s => s.isActive);
  }

  getUserPresence(userId: string): UserPresence | undefined {
    return this.userPresences.get(userId);
  }

  // Utility Methods
  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      deviceType = /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }

    return {
      type: deviceType,
      browser: this.getBrowserName(),
      os: this.getOSName()
    };
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOSName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private generateActivityId(): string {
    return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUsername(): string {
    // This should be retrieved from auth service
    return 'current_username'; // Placeholder
  }

  private getCurrentUserAvatar(): string | undefined {
    // This should be retrieved from auth service
    return undefined; // Placeholder
  }

}