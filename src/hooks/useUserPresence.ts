import { useCallback, useEffect, useRef, useState } from 'react';
import { UserActivity, UserPresence, userPresenceService } from '../services/userPresence.service';

export interface UseUserPresenceOptions {
  workspaceId?: string;
  contentId?: string;
  autoInitialize?: boolean;
}

export interface UserPresenceState {
  currentUser: UserPresence | null;
  allPresences: UserPresence[];
  onlineUsers: UserPresence[];
  usersInLocation: UserPresence[];
  typingUsers: UserPresence[];
  recentActivities: UserActivity[];
}

export function useUserPresence(options: UseUserPresenceOptions = {}) {
  const { workspaceId, contentId, autoInitialize = true } = options;
  
  const [state, setState] = useState<UserPresenceState>({
    currentUser: null,
    allPresences: [],
    onlineUsers: [],
    usersInLocation: [],
    typingUsers: [],
    recentActivities: []
  });

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const initializeUser = useCallback((user: {
    userId: string;
    username: string;
    avatar?: string;
  }) => {
    userPresenceService.initializeUser(user);
  }, []);

  const updateStatus = useCallback((status: UserPresence['status']) => {
    userPresenceService.updateStatus(status);
  }, []);

  const updateLocation = useCallback((location: UserPresence['currentLocation']) => {
    userPresenceService.updateLocation(location);
  }, []);

  const updateCustomStatus = useCallback((customStatus: string) => {
    userPresenceService.updateCustomStatus(customStatus);
  }, []);

  const setTyping = useCallback((isTyping: boolean, context?: { contentId?: string; workspaceId?: string }) => {
    userPresenceService.setTyping(isTyping, context);
  }, []);

  const trackActivity = useCallback((
    action: string,
    resource: string,
    resourceId: string,
    metadata?: Record<string, any>
  ) => {
    userPresenceService.trackActivity(action, resource, resourceId, metadata);
  }, []);

  const getPresence = useCallback((userId: string) => {
    return userPresenceService.getPresence(userId);
  }, []);

  const isUserOnline = useCallback((userId: string) => {
    return userPresenceService.isUserOnline(userId);
  }, []);

  const getLastSeenText = useCallback((userId: string) => {
    return userPresenceService.getLastSeenText(userId);
  }, []);

  const refreshData = useCallback(() => {
    const currentUser = userPresenceService.getCurrentUser();
    const allPresences = userPresenceService.getAllPresences();
    const onlineUsers = userPresenceService.getOnlineUsers();
    
    const usersInLocation = (workspaceId || contentId) 
      ? userPresenceService.getUsersInLocation({
          page: contentId ? 'content' : 'workspace',
          contentId,
          workspaceId
        })
      : [];
    
    const typingUsers = userPresenceService.getTypingUsers(
      contentId || workspaceId ? { contentId, workspaceId } : undefined
    );
    
    const recentActivities = userPresenceService.getRecentActivities();

    setState({
      currentUser,
      allPresences,
      onlineUsers,
      usersInLocation,
      typingUsers,
      recentActivities
    });
  }, [workspaceId, contentId]);

  useEffect(() => {
    const handlePresenceUpdated = () => {
      refreshData();
    };

    const handleStatusChanged = () => {
      refreshData();
    };

    const handleLocationChanged = () => {
      refreshData();
    };

    const handleCurrentUserStatusChanged = (status: UserPresence['status']) => {
      setState(prev => prev.currentUser ? {
        ...prev,
        currentUser: { ...prev.currentUser, status }
      } : prev);
    };

    const handleCurrentUserLocationChanged = (location: UserPresence['currentLocation']) => {
      setState(prev => prev.currentUser ? {
        ...prev,
        currentUser: { ...prev.currentUser, currentLocation: location }
      } : prev);
    };

    userPresenceService.on<UserPresence>('presenceUpdated', handlePresenceUpdated);
    userPresenceService.on<UserPresence>('statusChanged', handleStatusChanged);
    userPresenceService.on<UserPresence>('locationChanged', handleLocationChanged);
    userPresenceService.on<UserPresence['status']>('currentUserStatusChanged', handleCurrentUserStatusChanged);
    userPresenceService.on<UserPresence['currentLocation']>('currentUserLocationChanged', handleCurrentUserLocationChanged);

    // Initial data load
    refreshData();

    // Auto-subscribe to workspace/content if specified
    if (workspaceId) {
      userPresenceService.subscribeToWorkspace(workspaceId);
    }
    if (contentId) {
      userPresenceService.subscribeToContent(contentId);
    }

    return () => {
      userPresenceService.off('presenceUpdated', handlePresenceUpdated as any);
      userPresenceService.off('statusChanged', handleStatusChanged as any);
      userPresenceService.off('locationChanged', handleLocationChanged as any);
      userPresenceService.off('currentUserStatusChanged', handleCurrentUserStatusChanged as any);
      userPresenceService.off('currentUserLocationChanged', handleCurrentUserLocationChanged as any);
      
      // Unsubscribe on cleanup
      if (workspaceId) {
        userPresenceService.unsubscribeFromWorkspace(workspaceId);
      }
      if (contentId) {
        userPresenceService.unsubscribeFromContent(contentId);
      }
    };
  }, [workspaceId, contentId, refreshData]);

  // Auto-initialize user from auth context
  useEffect(() => {
    if (autoInitialize) {
      const authToken = localStorage.getItem('auth_token');
      const userInfo = localStorage.getItem('user_info');
      
      if (authToken && userInfo) {
        try {
          const user = JSON.parse(userInfo);
          initializeUser({
            userId: user.id,
            username: user.username || user.email,
            avatar: user.avatar
          });
        } catch (error) {
          console.error('Failed to initialize user presence:', error);
        }
      }
    }
  }, [autoInitialize, initializeUser]);

  // Update location when workspace/content changes
  useEffect(() => {
    if (state.currentUser && (workspaceId || contentId)) {
      const location: UserPresence['currentLocation'] = {
        page: contentId ? 'content' : 'workspace',
        contentId,
        workspaceId
      };
      updateLocation(location);
    }
  }, [workspaceId, contentId, state.currentUser, updateLocation]);

  // Set up periodic refresh for active data
  useEffect(() => {
    const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [refreshData]);

  return {
    ...state,
    initializeUser,
    updateStatus,
    updateLocation,
    updateCustomStatus,
    setTyping,
    trackActivity,
    getPresence,
    isUserOnline,
    getLastSeenText,
    refreshData
  };
}