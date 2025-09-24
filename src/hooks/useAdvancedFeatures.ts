import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { collaborativeEditingService } from '../services/collaborativeEditing.service';
import { liveAnalyticsService } from '../services/liveAnalytics.service';

interface AdvancedFeaturesConfig {
  enableCollaboration?: boolean;
  enableLiveAnalytics?: boolean;
  enableKeyboardShortcuts?: boolean;
  enableAdvancedSearch?: boolean;
  workspaceId?: string;
  contentId?: string;
}

interface CollaborationState {
  isActive: boolean;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    cursor?: { line: number; column: number };
    lastActivity: Date;
  }>;
  sessionId?: string;
}

interface AnalyticsState {
  isStreaming: boolean;
  metrics: any[];
  events: any[];
  lastUpdate: Date | null;
}

interface SearchState {
  query: string;
  results: any[];
  filters: Record<string, any>;
  suggestions: string[];
  isLoading: boolean;
}

export const useAdvancedFeatures = (config: AdvancedFeaturesConfig) => {
  // Collaboration state
  const [collaboration, setCollaboration] = useState<CollaborationState>({
    isActive: false,
    participants: [],
  });

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsState>({
    isStreaming: false,
    metrics: [],
    events: [],
    lastUpdate: null,
  });

  // Search state
  const [search, setSearch] = useState<SearchState>({
    query: '',
    results: [],
    filters: {},
    suggestions: [],
    isLoading: false,
  });

  // Refs for cleanup
  const analyticsUnsubscribe = useRef<(() => void) | null>(null);
  const collaborationSession = useRef<string | null>(null);

  // WebSocket for real-time features
  const { isConnected, send, lastMessage } = useWebSocket();
  useEffect(() => {
    if (!lastMessage) return;
    handleWebSocketMessage(lastMessage);
  }, [lastMessage]);

  function handleWebSocketMessage(message: any) {
    switch (message.type) {
      case 'collaboration_update':
        handleCollaborationUpdate(message.data);
        break;
      case 'analytics_update':
        handleAnalyticsUpdate(message.data);
        break;
      case 'search_suggestion':
        handleSearchSuggestion(message.data);
        break;
    }
  }

  const handleCollaborationUpdate = useCallback((data: any) => {
    setCollaboration(prev => ({
      ...prev,
      participants: data.participants || prev.participants,
    }));
  }, []);

  const handleAnalyticsUpdate = useCallback((data: any) => {
    setAnalytics(prev => ({
      ...prev,
      metrics: data.metrics || prev.metrics,
      events: [...prev.events, ...(data.events || [])].slice(-100), // Keep last 100 events
      lastUpdate: new Date(),
    }));
  }, []);

  const handleSearchSuggestion = useCallback((data: any) => {
    setSearch(prev => ({
      ...prev,
      suggestions: data.suggestions || prev.suggestions,
    }));
  }, []);

  // Collaboration functions
  const startCollaboration = useCallback(async (contentId: string) => {
    if (!config.enableCollaboration) return;

    try {
      const session = await collaborativeEditingService.createSession(contentId);
      collaborationSession.current = session.id;
      
      setCollaboration({
        isActive: true,
        participants: (session.participants || []).map((p: any) => ({
          id: p.userId,
          name: p.userName,
          avatar: p.userAvatar,
          cursor: p.cursor,
          lastActivity: p.lastActivity,
        })),
        sessionId: session.id,
      });

      // Notify via WebSocket
      send({
        type: 'join_collaboration',
        data: { sessionId: session.id, contentId },
      });
    } catch (error) {
      console.error('Failed to start collaboration:', error);
    }
  }, [config.enableCollaboration, send]);

  const stopCollaboration = useCallback(async () => {
    if (!collaborationSession.current) return;

    try {
      await collaborativeEditingService.leaveSession(collaborationSession.current);
      
      setCollaboration({
        isActive: false,
        participants: [],
        sessionId: undefined,
      });

      send({
        type: 'leave_collaboration',
        data: { sessionId: collaborationSession.current },
      });

      collaborationSession.current = null;
    } catch (error) {
      console.error('Failed to stop collaboration:', error);
    }
  }, [send]);

  const updateCursor = useCallback(async (cursor: { line: number; column: number }) => {
    if (!collaborationSession.current) return;

    try {
      await collaborativeEditingService.updateCursor(collaborationSession.current, cursor);
      
      send({
        type: 'cursor_update',
        data: { sessionId: collaborationSession.current, cursor },
      });
    } catch (error) {
      console.error('Failed to update cursor:', error);
    }
  }, [send]);

  // Analytics functions
  const startAnalyticsStreaming = useCallback(() => {
    if (!config.enableLiveAnalytics || analyticsUnsubscribe.current) return;

    const filter = {
      workspaceId: config.workspaceId,
      contentIds: config.contentId ? [config.contentId] : undefined,
    } as const;

    liveAnalyticsService.subscribeToMetrics(filter);

    analyticsUnsubscribe.current = () => {
      liveAnalyticsService.unsubscribeFromMetrics(filter);
    };

    setAnalytics(prev => ({
      ...prev,
      isStreaming: true,
      lastUpdate: new Date(),
    }));
  }, [config.enableLiveAnalytics, config.workspaceId, config.contentId]);

  const stopAnalyticsStreaming = useCallback(() => {
    if (analyticsUnsubscribe.current) {
      analyticsUnsubscribe.current();
      analyticsUnsubscribe.current = null;
      
      setAnalytics(prev => ({
        ...prev,
        isStreaming: false,
      }));
    }
  }, []);

  const trackEvent = useCallback(async (event: {
    type: string;
    data: Record<string, any>;
  }) => {
    if (!config.enableLiveAnalytics) return;

    try {
      // Send via websocket service directly
      send({ type: 'analytics_event', payload: event });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, [config.enableLiveAnalytics, send]);

  // Search functions
  const performSearch = useCallback(async (
    query: string,
    filters: Record<string, any> = {}
  ) => {
    if (!config.enableAdvancedSearch) return;

    setSearch(prev => ({ ...prev, isLoading: true, query, filters }));

    try {
      // Simulate search API call
      const response = await fetch('/api/v1/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, filters }),
      });
      
      const data = await response.json();
      
      setSearch(prev => ({
        ...prev,
        results: data.results || [],
        suggestions: data.suggestions || [],
        isLoading: false,
      }));
    } catch (error) {
      console.error('Search failed:', error);
      setSearch(prev => ({ ...prev, isLoading: false }));
    }
  }, [config.enableAdvancedSearch]);

  const clearSearch = useCallback(() => {
    setSearch({
      query: '',
      results: [],
      filters: {},
      suggestions: [],
      isLoading: false,
    });
  }, []);

  // Drag and drop functions
  const handleDragStart = useCallback((item: any, event: DragEvent) => {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify(item));
      event.dataTransfer.effectAllowed = 'move';
    }
  }, []);

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((event: DragEvent, onDrop?: (item: any) => void) => {
    event.preventDefault();
    
    try {
      const data = event.dataTransfer?.getData('application/json');
      if (data) {
        const item = JSON.parse(data);
        onDrop?.(item);
      }
    } catch (error) {
      console.error('Failed to handle drop:', error);
    }
  }, []);

  // Keyboard shortcuts integration
  const registerShortcut = useCallback((
    keys: string[],
    action: () => void,
    description: string
  ) => {
    if (!config.enableKeyboardShortcuts) return;

    // This would integrate with the KeyboardShortcutsSystem
    const shortcutId = `advanced-${Date.now()}`;
    
    // Register with keyboard shortcuts system
    // Implementation depends on the keyboard shortcuts context
    
    return shortcutId;
  }, [config.enableKeyboardShortcuts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCollaboration();
      stopAnalyticsStreaming();
    };
  }, [stopCollaboration, stopAnalyticsStreaming]);

  // Auto-start features based on config
  useEffect(() => {
    if (config.enableLiveAnalytics && !analytics.isStreaming) {
      startAnalyticsStreaming();
    }
  }, [config.enableLiveAnalytics, analytics.isStreaming, startAnalyticsStreaming]);

  return {
    // Collaboration
    collaboration,
    startCollaboration,
    stopCollaboration,
    updateCursor,
    
    // Analytics
    analytics,
    startAnalyticsStreaming,
    stopAnalyticsStreaming,
    trackEvent,
    
    // Search
    search,
    performSearch,
    clearSearch,
    
    // Drag and Drop
    handleDragStart,
    handleDragOver,
    handleDrop,
    
    // Keyboard Shortcuts
    registerShortcut,
    
    // WebSocket
    isConnected,
    send,
  };
};