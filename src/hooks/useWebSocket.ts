import { useCallback, useEffect, useRef, useState } from 'react';
import { webSocketService } from '../services/websocket.service';

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectOnMount?: boolean;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  lastMessage: any;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true, reconnectOnMount = true } = options;
  
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastMessage: null
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const connect = useCallback(async (token?: string) => {
    if (stateRef.current.isConnecting || stateRef.current.isConnected) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const authToken = token || localStorage.getItem('auth_token') || '';
      await webSocketService.connect(authToken);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error as Error 
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
  }, []);

  const send = useCallback((message: any) => {
    if (stateRef.current.isConnected) {
      webSocketService.send(message);
    } else {
      console.warn('WebSocket not connected, message queued');
      webSocketService.send(message); // Will be queued
    }
  }, []);

  const subscribe = useCallback((channel: string) => {
    webSocketService.subscribe(channel);
  }, []);

  const unsubscribe = useCallback((channel: string) => {
    webSocketService.unsubscribe(channel);
  }, []);

  useEffect(() => {
    const handleConnected = () => {
      setState(prev => ({ 
        ...prev, 
        isConnected: true, 
        isConnecting: false, 
        error: null 
      }));
    };

    const handleDisconnected = () => {
      setState(prev => ({ 
        ...prev, 
        isConnected: false, 
        isConnecting: false 
      }));
    };

    const handleError = (error: Error) => {
      setState(prev => ({ 
        ...prev, 
        error, 
        isConnecting: false 
      }));
    };

    const handleMessage = (message: any) => {
      setState(prev => ({ 
        ...prev, 
        lastMessage: message 
      }));
    };

    webSocketService.on('connected', handleConnected);
    webSocketService.on('disconnected', handleDisconnected);
    webSocketService.on<Error>('error', handleError);
    webSocketService.on('message', handleMessage);

    // Auto-connect if enabled
    if (autoConnect && !webSocketService.getConnectionStatus()) {
      connect();
    }

    return () => {
      webSocketService.off('connected', handleConnected as any);
      webSocketService.off('disconnected', handleDisconnected as any);
      webSocketService.off('error', handleError as any);
      webSocketService.off('message', handleMessage as any);
    };
  }, [autoConnect, connect]);

  // Reconnect on mount if needed
  useEffect(() => {
    if (reconnectOnMount && !webSocketService.getConnectionStatus()) {
      connect();
    }
  }, [reconnectOnMount, connect]);

  return {
    ...state,
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe
  };
}