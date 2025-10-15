import { useEffect, useState, useCallback } from 'react';
import { realTimeManager } from '../services/realtime.manager';
import { publishingStatusService } from '../services/publishingStatus.service';
import { liveAnalyticsService } from '../services/liveAnalytics.service';
import { collaborationService } from '../services/collaboration.service';

export interface RealTimeStatus {
  connected: boolean;
  socketId: string | null;
  retryCount: number;
}

export interface UseRealTimeOptions {
  autoConnect?: boolean;
  contentId?: string | number;
  executionId?: string;
}

export interface UseRealTimeReturn {
  status: RealTimeStatus;
  isConnected: boolean;
  
  // Connection management
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  
  // Content subscription
  subscribeToContent: (contentId: string | number) => void;
  unsubscribeFromContent: (contentId: string | number) => void;
  
  // Execution subscription
  subscribeToExecution: (executionId: string) => void;
  unsubscribeFromExecution: (executionId: string) => void;
  
  // Service access
  publishingStatus: typeof publishingStatusService;
  analytics: typeof liveAnalyticsService;
  collaboration: typeof collaborationService;
}

/**
 * Hook for managing real-time connections and subscriptions
 */
export function useRealTime(options: UseRealTimeOptions = {}): UseRealTimeReturn {
  const { autoConnect = true, contentId, executionId } = options;
  
  const [status, setStatus] = useState<RealTimeStatus>({
    connected: false,
    socketId: null,
    retryCount: 0
  });

  // Update status from real-time manager
  const updateStatus = useCallback(() => {
    const currentStatus = realTimeManager.getConnectionStatus();
    setStatus(currentStatus);
  }, []);

  // Connection management
  const connect = useCallback(() => {
    realTimeManager.initialize().then(updateStatus);
  }, [updateStatus]);

  const disconnect = useCallback(() => {
    realTimeManager.disconnect();
    updateStatus();
  }, [updateStatus]);

  const reconnect = useCallback(() => {
    realTimeManager.reconnect();
    updateStatus();
  }, [updateStatus]);

  // Content subscription
  const subscribeToContent = useCallback((id: string | number) => {
    realTimeManager.subscribeToContent(id);
  }, []);

  const unsubscribeFromContent = useCallback((id: string | number) => {
    realTimeManager.unsubscribeFromContent(id);
  }, []);

  // Execution subscription
  const subscribeToExecution = useCallback((id: string) => {
    realTimeManager.subscribeToExecution(id);
  }, []);

  const unsubscribeFromExecution = useCallback((id: string) => {
    realTimeManager.unsubscribeFromExecution(id);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    // Set up status polling
    const statusInterval = setInterval(updateStatus, 2000);
    
    return () => {
      clearInterval(statusInterval);
    };
  }, [autoConnect, connect, updateStatus]);

  // Auto-subscribe to content/execution
  useEffect(() => {
    if (status.connected) {
      if (contentId) {
        subscribeToContent(contentId);
      }
      if (executionId) {
        subscribeToExecution(executionId);
      }
    }
    
    return () => {
      if (contentId) {
        unsubscribeFromContent(contentId);
      }
      if (executionId) {
        unsubscribeFromExecution(executionId);
      }
    };
  }, [status.connected, contentId, executionId, subscribeToContent, unsubscribeFromContent, subscribeToExecution, unsubscribeFromExecution]);

  // Listen for offline events
  useEffect(() => {
    const handleOffline = () => {
      updateStatus();
    };

    window.addEventListener('realtime-offline', handleOffline);
    
    return () => {
      window.removeEventListener('realtime-offline', handleOffline);
    };
  }, [updateStatus]);

  return {
    status,
    isConnected: status.connected,
    
    // Connection management
    connect,
    disconnect,
    reconnect,
    
    // Subscription management
    subscribeToContent,
    unsubscribeFromContent,
    subscribeToExecution,
    unsubscribeFromExecution,
    
    // Service access
    publishingStatus: publishingStatusService,
    analytics: liveAnalyticsService,
    collaboration: collaborationService
  };
}

/**
 * Hook specifically for content collaboration
 */
export function useContentCollaboration(contentId: string | number) {
  const realTime = useRealTime({ contentId });
  
  const [activeUsers, setActiveUsers] = useState<Map<string, any>>(new Map());
  const [isCollaborating, setIsCollaborating] = useState(false);

  useEffect(() => {
    if (realTime.isConnected && contentId) {
      setIsCollaborating(true);
      
      // Listen for collaboration events
      const handleUserJoined = (user: any) => {
        setActiveUsers(prev => new Map(prev.set(user.id, user)));
      };
      
      const handleUserLeft = (userId: string) => {
        setActiveUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
      };
      
      realTime.collaboration.on('userJoined', handleUserJoined);
      realTime.collaboration.on('userLeft', handleUserLeft);
      
      return () => {
        realTime.collaboration.off('userJoined', handleUserJoined);
        realTime.collaboration.off('userLeft', handleUserLeft);
        setIsCollaborating(false);
      };
    }
  }, [realTime.isConnected, contentId, realTime.collaboration]);

  return {
    ...realTime,
    activeUsers: Array.from(activeUsers.values()),
    isCollaborating,
    updateCursor: realTime.collaboration.updateCursor.bind(realTime.collaboration),
    updateSelection: realTime.collaboration.updateSelection.bind(realTime.collaboration),
    applyTextOperation: realTime.collaboration.applyTextOperation.bind(realTime.collaboration)
  };
}

/**
 * Hook specifically for publishing status
 */
export function usePublishingStatus(contentId?: string | number) {
  const realTime = useRealTime({ contentId });
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (realTime.isConnected) {
      // Listen for publishing status updates
      const handleStatusUpdate = (job: any) => {
        setJobs(prev => {
          const index = prev.findIndex(j => j.id === job.id);
          if (index >= 0) {
            const newJobs = [...prev];
            newJobs[index] = job;
            return newJobs;
          } else {
            return [...prev, job];
          }
        });
        
        setIsPublishing(job.status === 'processing');
      };
      
      realTime.publishingStatus.on('statusUpdate', handleStatusUpdate);
      
      return () => {
        realTime.publishingStatus.off('statusUpdate', handleStatusUpdate);
      };
    }
  }, [realTime.isConnected, realTime.publishingStatus]);

  return {
    ...realTime,
    jobs,
    isPublishing,
    startPublishing: realTime.publishingStatus.startPublishing.bind(realTime.publishingStatus),
    cancelPublishing: realTime.publishingStatus.cancelPublishing.bind(realTime.publishingStatus)
  };
}

/**
 * Hook specifically for live analytics
 */
export function useLiveAnalytics(contentId?: string | number) {
  const realTime = useRealTime({ contentId });
  
  const [metrics, setMetrics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (realTime.isConnected) {
      setIsLoading(true);
      
      // Listen for analytics updates
      const handleMetricsUpdate = (data: any) => {
        setMetrics(prev => [...prev, ...data.metrics]);
        setIsLoading(false);
      };
      
      realTime.analytics.on('metricsUpdate', handleMetricsUpdate);
      
      return () => {
        realTime.analytics.off('metricsUpdate', handleMetricsUpdate);
      };
    }
  }, [realTime.isConnected, realTime.analytics]);

  return {
    ...realTime,
    metrics,
    isLoading,
    subscribeToMetrics: realTime.analytics.subscribeToMetrics.bind(realTime.analytics)
  };
}