import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { webSocketService } from '../services/websocket.service';
import { collaborationService } from '../services/collaboration.service';
import { liveAnalyticsService } from '../services/liveAnalytics.service';
import { userPresenceService } from '../services/userPresence.service';

interface RealTimeContextType {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastError: Error | null;
}

const RealTimeContext = createContext<RealTimeContextType>({
  isConnected: false,
  connectionStatus: 'disconnected',
  lastError: null
});

export const useRealTimeContext = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTimeContext must be used within a RealTimeProvider');
  }
  return context;
};

interface RealTimeProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

export const RealTimeProvider: React.FC<RealTimeProviderProps> = ({
  children,
  autoConnect = true
}) => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState<RealTimeContextType['connectionStatus']>('disconnected');
  const [lastError, setLastError] = React.useState<Error | null>(null);

  useEffect(() => {
    // Set up WebSocket event listeners
    const handleConnected = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      setLastError(null);
      console.log('Real-time services connected');
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      console.log('Real-time services disconnected');
    };

    const handleError = (err: unknown) => {
      const error = err instanceof Error ? err : new Error(String(err));
      setLastError(error);
      setConnectionStatus('error');
      console.error('Real-time services error:', error);
    };

    // No-op reserved for future use: connecting state is set directly

    // Add event listeners
    webSocketService.on('connected', handleConnected);
    webSocketService.on('disconnected', handleDisconnected);
    webSocketService.on('error', handleError);

    // Auto-connect if enabled
    if (autoConnect) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        setConnectionStatus('connecting');
        webSocketService.connect(token).catch(handleError);
      }
    }

    // Cleanup
    return () => {
      webSocketService.off('connected', handleConnected);
      webSocketService.off('disconnected', handleDisconnected);
      webSocketService.off('error', handleError);
    };
  }, [autoConnect]);

  // Cleanup services on unmount
  useEffect(() => {
    return () => {
      // Clean up all real-time services
      webSocketService.disconnect();
      collaborationService.leaveContent();
      liveAnalyticsService.destroy();
      userPresenceService.destroy();
    };
  }, []);

  const contextValue: RealTimeContextType = React.useMemo(() => ({
    isConnected,
    connectionStatus,
    lastError
  }), [isConnected, connectionStatus, lastError]);

  return (
    <RealTimeContext.Provider value={contextValue}>
      {children}
    </RealTimeContext.Provider>
  );
};