import { useEffect, useRef, useState, useCallback } from 'react';
import { sseService, SseConnectionOptions } from '../services/sse.service';

export interface UseSSEOptions {
  userId: number;
  autoConnect?: boolean;
  onConnection?: (data: string) => void;
  onWorkflowUpdate?: (data: any) => void;
  onRunUpdate?: (data: any) => void;
  onNodeUpdate?: (data: any) => void;
  onError?: (error: Event) => void;
}

export interface UseSSEReturn {
  isConnected: boolean;
  connectionState: number | null;
  connectToWorkflow: (workflowKey: string) => void;
  connectToRun: (runId: string) => void;
  disconnect: () => void;
  error: Event | null;
}

/**
 * React hook for Server-Sent Events (SSE) connection
 */
export function useSSE(options: UseSSEOptions): UseSSEReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<number | null>(null);
  const [error, setError] = useState<Event | null>(null);
  
  const optionsRef = useRef(options);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Monitor connection state
  useEffect(() => {
    const checkConnectionState = () => {
      const state = sseService.getConnectionState();
      const connected = sseService.isConnected();
      
      setConnectionState(state);
      setIsConnected(connected);
    };

    // Check immediately
    checkConnectionState();

    // Check periodically
    intervalRef.current = setInterval(checkConnectionState, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Create SSE connection options
  const createConnectionOptions = useCallback((): SseConnectionOptions => {
    return {
      userId: optionsRef.current.userId,
      onConnection: (data: string) => {
        console.log('SSE connected:', data);
        setError(null);
        optionsRef.current.onConnection?.(data);
      },
      onWorkflowUpdate: (data: any) => {
        console.log('Workflow update received:', data);
        optionsRef.current.onWorkflowUpdate?.(data);
      },
      onRunUpdate: (data: any) => {
        console.log('Run update received:', data);
        optionsRef.current.onRunUpdate?.(data);
      },
      onNodeUpdate: (data: any) => {
        console.log('Node update received:', data);
        optionsRef.current.onNodeUpdate?.(data);
      },
      onError: (error: Event) => {
        console.error('SSE error:', error);
        setError(error);
        optionsRef.current.onError?.(error);
      },
      onClose: () => {
        console.log('SSE connection closed');
        setIsConnected(false);
        setConnectionState(null);
      }
    };
  }, []);

  // Connect to workflow stream
  const connectToWorkflow = useCallback((workflowKey: string) => {
    console.log('Connecting to workflow stream:', workflowKey);
    const connectionOptions = createConnectionOptions();
    sseService.connectToWorkflowStream(workflowKey, connectionOptions);
  }, [createConnectionOptions]);

  // Connect to run stream
  const connectToRun = useCallback((runId: string) => {
    console.log('Connecting to run stream:', runId);
    const connectionOptions = createConnectionOptions();
    sseService.connectToRunStream(runId, connectionOptions);
  }, [createConnectionOptions]);

  // Disconnect
  const disconnect = useCallback(() => {
    console.log('Disconnecting SSE');
    sseService.disconnect();
    setIsConnected(false);
    setConnectionState(null);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionState,
    connectToWorkflow,
    connectToRun,
    disconnect,
    error
  };
}

/**
 * Hook specifically for workflow updates
 */
export function useWorkflowSSE(workflowKey: string, userId: number, autoConnect = true) {
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const sse = useSSE({
    userId,
    onConnection: (data) => {
      console.log('Connected to workflow stream:', data);
    },
    onWorkflowUpdate: (data) => {
      setWorkflowData(data);
      setLastUpdate(new Date());
    },
    onRunUpdate: (data) => {
      setWorkflowData(data);
      setLastUpdate(new Date());
    },
    onError: (error) => {
      console.error('Workflow SSE error:', error);
    }
  });

  useEffect(() => {
    if (autoConnect && workflowKey && userId) {
      sse.connectToWorkflow(workflowKey);
    }

    return () => {
      sse.disconnect();
    };
  }, [workflowKey, userId, autoConnect, sse]);

  return {
    ...sse,
    workflowData,
    lastUpdate
  };
}

/**
 * Hook specifically for run updates
 */
export function useRunSSE(runId: string, userId: number, autoConnect = true) {
  const [runData, setRunData] = useState<any>(null);
  const [nodeUpdates, setNodeUpdates] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const sse = useSSE({
    userId,
    onConnection: (data) => {
      console.log('Connected to run stream:', data);
    },
    onRunUpdate: (data) => {
      setRunData(data);
      setLastUpdate(new Date());
    },
    onNodeUpdate: (data) => {
      setNodeUpdates(prev => [...prev, { ...data, timestamp: new Date() }]);
      setLastUpdate(new Date());
    },
    onError: (error) => {
      console.error('Run SSE error:', error);
    }
  });

  useEffect(() => {
    if (autoConnect && runId && userId) {
      sse.connectToRun(runId);
    }

    return () => {
      sse.disconnect();
    };
  }, [runId, userId, autoConnect, sse]);

  return {
    ...sse,
    runData,
    nodeUpdates,
    lastUpdate
  };
}