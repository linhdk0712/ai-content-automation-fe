import { useCallback, useEffect, useRef, useState } from 'react';
import { supabaseService } from '../services/supabase.service';
import { useSupabase } from '../contexts/RealTimeContext';

export interface UseSupabaseRealtimeOptions {
  autoSubscribe?: boolean;
}

export interface RealtimeState {
  isConnected: boolean;
  subscriptions: string[];
  error: Error | null;
  lastMessage: any;
}

export function useSupabaseRealtime(options: UseSupabaseRealtimeOptions = {}) {
  const { autoSubscribe = true } = options;
  const { isAuthenticated } = useSupabase();
  
  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    subscriptions: [],
    error: null,
    lastMessage: null
  });

  const subscriptionsRef = useRef<Set<string>>(new Set());

  const subscribeToTable = useCallback((
    table: string,
    callback: (payload: any) => void,
    filter?: string
  ) => {
    if (!isAuthenticated) {
      console.warn('User not authenticated, cannot subscribe to table');
      return null;
    }

    try {
      const channelName = supabaseService.subscribeToTable(table as any, callback, filter);
      subscriptionsRef.current.add(channelName);
      
      setState(prev => ({
        ...prev,
        subscriptions: Array.from(subscriptionsRef.current),
        error: null
      }));
      
      return channelName;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Subscription failed');
      setState(prev => ({ ...prev, error: err }));
      return null;
    }
  }, [isAuthenticated]);

  const subscribeToPresence = useCallback((
    workspaceId: string,
    callback: (payload: any) => void
  ) => {
    if (!isAuthenticated) {
      console.warn('User not authenticated, cannot subscribe to presence');
      return null;
    }

    try {
      const channelName = supabaseService.subscribeToPresence(workspaceId, callback);
      subscriptionsRef.current.add(channelName);
      
      setState(prev => ({
        ...prev,
        subscriptions: Array.from(subscriptionsRef.current),
        error: null
      }));
      
      return channelName;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Presence subscription failed');
      setState(prev => ({ ...prev, error: err }));
      return null;
    }
  }, [isAuthenticated]);

  const unsubscribe = useCallback((channelName: string) => {
    supabaseService.unsubscribe(channelName);
    subscriptionsRef.current.delete(channelName);
    
    setState(prev => ({
      ...prev,
      subscriptions: Array.from(subscriptionsRef.current)
    }));
  }, []);

  const unsubscribeAll = useCallback(() => {
    subscriptionsRef.current.forEach(channelName => {
      supabaseService.unsubscribe(channelName);
    });
    subscriptionsRef.current.clear();
    
    setState(prev => ({
      ...prev,
      subscriptions: []
    }));
  }, []);

  useEffect(() => {
    const handleSubscribed = ({ table, channelName }: { table: string; channelName: string }) => {
      setState(prev => ({
        ...prev,
        isConnected: true,
        lastMessage: { type: 'subscribed', table, channelName }
      }));
    };

    supabaseService.on('subscribed', handleSubscribed);

    return () => {
      supabaseService.off('subscribed', handleSubscribed);
    };
  }, []);

  // Cleanup subscriptions when component unmounts or user signs out
  useEffect(() => {
    if (!isAuthenticated) {
      unsubscribeAll();
    }
  }, [isAuthenticated, unsubscribeAll]);

  useEffect(() => {
    return () => {
      unsubscribeAll();
    };
  }, [unsubscribeAll]);

  // Add missing methods for backward compatibility
  const send = (message: any) => {
    console.log('WebSocket send not implemented in Supabase realtime:', message);
  };

  const subscribe = (channel: string, callback: (data: any) => void) => {
    return subscribeToTable(channel, callback);
  };

  return {
    ...state,
    subscribeToTable,
    subscribeToPresence,
    unsubscribe,
    unsubscribeAll,
    send,
    subscribe
  };
}

// Backward compatibility
export const useWebSocket = useSupabaseRealtime;