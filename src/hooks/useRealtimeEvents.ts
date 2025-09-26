import { useCallback, useEffect, useState } from 'react';
import { supabaseService, Database } from '../services/supabase.service';
import { useSupabase } from '../contexts/RealTimeContext';

export interface UseRealtimeEventsOptions {
  tenantId?: string;
  eventTypes?: string[];
  taskId?: string;
  autoSubscribe?: boolean;
  showBrowserNotifications?: boolean;
}

export interface RealtimeEventsState {
  events: Database['public']['Tables']['realtime_events']['Row'][];
  isSubscribed: boolean;
  channelName: string | null;
  lastEvent: Database['public']['Tables']['realtime_events']['Row'] | null;
}

export function useRealtimeEvents(options: UseRealtimeEventsOptions = {}) {
  const { 
    tenantId, 
    eventTypes, 
    taskId, 
    autoSubscribe = true, 
    showBrowserNotifications = true 
  } = options;
  const { isAuthenticated } = useSupabase();
  
  const [state, setState] = useState<RealtimeEventsState>({
    events: [],
    isSubscribed: false,
    channelName: null,
    lastEvent: null
  });

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  const subscribeToEvents = useCallback(() => {
    if (!isAuthenticated) {
      console.warn('User not authenticated, cannot subscribe to realtime events');
      return null;
    }

    try {
      const channelName = supabaseService.subscribeToRealtimeEvents({
        tenantId,
        eventTypes,
        taskId,
        callback: (event) => {
          console.log('🎯 New Realtime Event in Hook:', event);
          
          setState(prev => ({
            ...prev,
            events: [event, ...prev.events.slice(0, 49)], // Keep last 50 events
            lastEvent: event
          }));

          // Show popup notification
          if (showBrowserNotifications) {
            showPopupNotification(event);
          }
        }
      });

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        channelName
      }));

      return channelName;
    } catch (error) {
      console.error('Failed to subscribe to realtime events:', error);
      return null;
    }
  }, [isAuthenticated, tenantId, eventTypes, taskId, showBrowserNotifications]);

  const unsubscribeFromEvents = useCallback(() => {
    if (state.channelName) {
      supabaseService.unsubscribe(state.channelName);
      setState(prev => ({
        ...prev,
        isSubscribed: false,
        channelName: null
      }));
    }
  }, [state.channelName]);

  const showPopupNotification = useCallback((event: Database['public']['Tables']['realtime_events']['Row']) => {
    // Simple popup notification - you can replace this with a toast library
    const message = `New ${event.type} event received!\n\nTenant: ${event.tenant_id}\nTask: ${event.task_id || 'N/A'}\n\nClick OK to view details in console.`;
    
    if (window.confirm(message)) {
      console.log('📊 Event Details:', event);
    }
  }, []);

  const loadRecentEvents = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const options: any = {
        order: { column: 'created_at', ascending: false },
        limit: 20
      };

      // Apply filters
      const filters: any = {};
      if (tenantId) filters.tenant_id = tenantId;
      if (taskId) filters.task_id = taskId;
      
      if (Object.keys(filters).length > 0) {
        options.filter = filters;
      }

      const events = await supabaseService.selectRealtimeEvents(options);
      
      setState(prev => ({
        ...prev,
        events: events || []
      }));
    } catch (error) {
      console.error('Failed to load recent events:', error);
    }
  }, [isAuthenticated, tenantId, taskId]);

  const createTestEvent = useCallback(async (type: string = 'test', payload?: Record<string, any>) => {
    if (!isAuthenticated) return;

    try {
      const testEvent = await supabaseService.insertRealtimeEvent({
        tenant_id: tenantId || 'test-tenant',
        type,
        task_id: `task-${Date.now()}`,
        payload: payload || { 
          message: 'Test event created from frontend',
          timestamp: new Date().toISOString(),
          random: Math.random()
        }
      });

      console.log('✅ Test event created:', testEvent);
      return testEvent;
    } catch (error) {
      console.error('Failed to create test event:', error);
      throw error;
    }
  }, [isAuthenticated, tenantId]);

  // Advanced subscription methods
  const subscribeToEventType = useCallback((eventType: string) => {
    if (!isAuthenticated) return null;
    
    const channelName = supabaseService.subscribeToEventType(eventType, (event) => {
      setState(prev => ({
        ...prev,
        events: [event, ...prev.events.slice(0, 49)],
        lastEvent: event
      }));
      
      if (showBrowserNotifications) {
        showPopupNotification(event);
      }
    });
    
    setState(prev => ({
      ...prev,
      isSubscribed: true,
      channelName
    }));
    
    return channelName;
  }, [isAuthenticated, showBrowserNotifications, showPopupNotification]);

  const subscribeToTenantEvents = useCallback((targetTenantId: string) => {
    if (!isAuthenticated) return null;
    
    const channelName = supabaseService.subscribeToTenantEvents(targetTenantId, (event) => {
      setState(prev => ({
        ...prev,
        events: [event, ...prev.events.slice(0, 49)],
        lastEvent: event
      }));
      
      if (showBrowserNotifications) {
        showPopupNotification(event);
      }
    });
    
    setState(prev => ({
      ...prev,
      isSubscribed: true,
      channelName
    }));
    
    return channelName;
  }, [isAuthenticated, showBrowserNotifications, showPopupNotification]);

  const subscribeToTaskEvents = useCallback((targetTaskId: string) => {
    if (!isAuthenticated) return null;
    
    const channelName = supabaseService.subscribeToTaskEvents(targetTaskId, (event) => {
      setState(prev => ({
        ...prev,
        events: [event, ...prev.events.slice(0, 49)],
        lastEvent: event
      }));
      
      if (showBrowserNotifications) {
        showPopupNotification(event);
      }
    });
    
    setState(prev => ({
      ...prev,
      isSubscribed: true,
      channelName
    }));
    
    return channelName;
  }, [isAuthenticated, showBrowserNotifications, showPopupNotification]);

  // Auto-subscribe when authenticated
  useEffect(() => {
    if (isAuthenticated && autoSubscribe) {
      loadRecentEvents();
      subscribeToEvents();
      
      // Request notification permission
      if (showBrowserNotifications) {
        requestNotificationPermission();
      }
    } else {
      unsubscribeFromEvents();
      setState(prev => ({
        ...prev,
        events: []
      }));
    }
  }, [isAuthenticated, autoSubscribe, showBrowserNotifications, loadRecentEvents, subscribeToEvents, unsubscribeFromEvents, requestNotificationPermission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromEvents();
    };
  }, [unsubscribeFromEvents]);

  return {
    ...state,
    subscribeToEvents,
    unsubscribeFromEvents,
    loadRecentEvents,
    createTestEvent,
    requestNotificationPermission,
    // Advanced methods
    subscribeToEventType,
    subscribeToTenantEvents,
    subscribeToTaskEvents
  };
}