import { useEffect, useRef, useState, useCallback } from 'react';
import { socketService, SocketConnectionOptions, SocketEventData } from '../services/socket.service';

export interface UseSocketOptions {
    userId?: number;
    autoConnect?: boolean;
    onConnection?: () => void;
    onWorkflowUpdate?: (data: SocketEventData) => void;
    onExecutionUpdate?: (data: SocketEventData) => void;
    onContentUpdate?: (data: SocketEventData) => void;
    onError?: (error: Error) => void;
    onDisconnect?: () => void;
}

export interface UseSocketReturn {
    isConnected: boolean;
    connectionState: string;
    socketId: string | null;
    connect: () => void;
    disconnect: () => void;
    joinExecutionRoom: (executionId: string) => void;
    joinContentRoom: (contentId: string | number) => void;
    leaveRoom: (roomName: string) => void;
    error: Error | null;
}

/**
 * React hook for Socket.IO connection
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionState, setConnectionState] = useState<string>('disconnected');
    const [socketId, setSocketId] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const optionsRef = useRef(options);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Update options ref when options change
    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    // Monitor connection state
    useEffect(() => {
        const checkConnectionState = () => {
            const state = socketService.getConnectionState();
            const connected = socketService.isConnected();
            const id = socketService.getSocketId();



            setConnectionState(state);
            setIsConnected(connected);
            setSocketId(id);
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

    // Create Socket.IO connection options
    const createConnectionOptions = useCallback((): SocketConnectionOptions => {
        return {
            userId: optionsRef.current.userId,
            onConnection: () => {
                console.log('Socket.IO connected');
                setError(null);
                optionsRef.current.onConnection?.();
            },
            onWorkflowUpdate: (data: SocketEventData) => {
                console.log('Workflow update received:', data);
                optionsRef.current.onWorkflowUpdate?.(data);
            },
            onExecutionUpdate: (data: SocketEventData) => {
                console.log('Execution update received:', data);
                optionsRef.current.onExecutionUpdate?.(data);
            },
            onContentUpdate: (data: SocketEventData) => {
                console.log('Content update received:', data);
                optionsRef.current.onContentUpdate?.(data);
            },
            onError: (error: Error) => {
                console.error('Socket.IO error:', error);
                setError(error);
                optionsRef.current.onError?.(error);
            },
            onDisconnect: () => {
                console.log('Socket.IO disconnected');
                setIsConnected(false);
                setConnectionState('disconnected');
                setSocketId(null);
                optionsRef.current.onDisconnect?.();
            }
        };
    }, []);

    // Connect to Socket.IO server
    const connect = useCallback(async () => {
        const connectionOptions = createConnectionOptions();
        try {
            await socketService.connect(connectionOptions);
        } catch (error) {
            console.error('Socket connection failed:', error);
        }
    }, [createConnectionOptions]);

    // Disconnect from Socket.IO server
    const disconnect = useCallback(() => {
        socketService.disconnect();
        setIsConnected(false);
        setConnectionState('disconnected');
        setSocketId(null);
        setError(null);
    }, []);

    // Join execution room
    const joinExecutionRoom = useCallback((executionId: string) => {
        socketService.joinExecutionRoom(executionId);
    }, []);

    // Join content room
    const joinContentRoom = useCallback((contentId: string | number) => {
        socketService.joinContentRoom(contentId);
    }, []);

    // Leave room
    const leaveRoom = useCallback((roomName: string) => {
        socketService.leaveRoom(roomName);
    }, []);

    // Auto-connect if enabled
    useEffect(() => {
        if (options.autoConnect && !isConnected) {
            connect().catch(error => {
                console.error('Socket auto-connect failed:', error);
            });
        }
    }, [options.autoConnect, isConnected, connect]);

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
        socketId,
        connect,
        disconnect,
        joinExecutionRoom,
        joinContentRoom,
        leaveRoom,
        error
    };
}

/**
 * Hook specifically for workflow updates
 */
export function useWorkflowSocket(workflowId: string, userId?: number, autoConnect = true) {
    const [workflowData, setWorkflowData] = useState<SocketEventData | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const socket = useSocket({
        userId,
        autoConnect,
        onConnection: () => {
            console.log('Connected to workflow socket');
        },
        onWorkflowUpdate: (data) => {
            if (data.workflowId === workflowId) {
                setWorkflowData(data);
                setLastUpdate(new Date());
            }
        },
        onExecutionUpdate: (data) => {
            if (data.workflowId === workflowId) {
                setWorkflowData(data);
                setLastUpdate(new Date());
            }
        },
        onError: (error) => {
            console.error('Workflow socket error:', error);
        }
    });

    return {
        ...socket,
        workflowData,
        lastUpdate
    };
}

/**
 * Hook specifically for execution updates
 */
export function useExecutionSocket(executionId: string, userId?: number, autoConnect = true) {
    const [executionData, setExecutionData] = useState<SocketEventData | null>(null);
    const [nodeUpdates, setNodeUpdates] = useState<SocketEventData[]>([]);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const socket = useSocket({
        userId,
        autoConnect,
        onConnection: () => {
            console.log('Connected to execution socket');
            if (executionId) {
                console.log('Joining execution room on connection:', executionId);
                socket.joinExecutionRoom(executionId);
            }
        },
        onExecutionUpdate: (data) => {
            if (data.executionId === executionId) {
                setExecutionData(data);
                setNodeUpdates(prev => [...prev, { ...data, timestamp: new Date().toISOString() }]);
                setLastUpdate(new Date());
            }
        },
        onError: (error) => {
            console.error('Execution socket error:', error);
        }
    });

    // Join execution room when executionId changes and socket is connected
    useEffect(() => {
        if (socket.isConnected && executionId) {
            console.log('Socket connected, joining execution room:', executionId);
            socket.joinExecutionRoom(executionId);
        }
    }, [socket.isConnected, executionId, socket]);

    return {
        ...socket,
        executionData,
        nodeUpdates,
        lastUpdate
    };
}

/**
 * Hook specifically for content updates
 */
export function useContentSocket(contentId: number, userId?: number, autoConnect = true) {
    const [contentData, setContentData] = useState<SocketEventData | null>(null);
    const [contentUpdates, setContentUpdates] = useState<SocketEventData[]>([]);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const socket = useSocket({
        userId,
        autoConnect,
        onConnection: () => {
            console.log('Connected to content socket');
            if (contentId) {
                console.log('Joining content room on connection:', contentId);
                socket.joinContentRoom(contentId);
            }
        },
        onContentUpdate: (data) => {
            if (data.contentId === contentId) {
                setContentData(data);
                setContentUpdates(prev => [...prev, { ...data, timestamp: new Date().toISOString() }]);
                setLastUpdate(new Date());
            }
        },
        onError: (error) => {
            console.error('Content socket error:', error);
        }
    });

    // Join content room when contentId changes and socket is connected
    useEffect(() => {
        if (socket.isConnected && contentId) {
            console.log('Socket connected, joining content room:', contentId);
            socket.joinContentRoom(contentId);
        }
    }, [socket.isConnected, contentId, socket]);

    return {
        ...socket,
        contentData,
        contentUpdates,
        lastUpdate
    };
}