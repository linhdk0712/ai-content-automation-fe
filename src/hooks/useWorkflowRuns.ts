import { useState, useEffect, useCallback, useRef } from 'react';
import { N8nWorkflowRunDto, fetchAllWorkflowRuns, fetchWorkflowRun } from '../services/n8n.service';
import { useSocket } from './useSocket';

export interface WorkflowRunWithSocket extends N8nWorkflowRunDto {
    isLive?: boolean; // Indicates if this run is receiving live updates
    lastUpdated?: Date;
}

export interface UseWorkflowRunsOptions {
    userId: number;
    autoRefresh?: boolean;
    refreshInterval?: number;
}

export interface UseWorkflowRunsReturn {
    runs: WorkflowRunWithSocket[];
    loading: boolean;
    error: string | null;
    refreshRuns: (silent?: boolean) => Promise<void>;
    connectToExecution: (executionId: string) => void;
    disconnectFromExecution: () => void;
    connectedExecutionId: string | null;
    socketConnected: boolean;
}

export function useWorkflowRuns(options: UseWorkflowRunsOptions): UseWorkflowRunsReturn {
    const { userId, autoRefresh = true, refreshInterval = 30000 } = options;

    const [runs, setRuns] = useState<WorkflowRunWithSocket[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connectedExecutionId, setConnectedExecutionId] = useState<string | null>(null);

    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastRefreshRef = useRef<Date | null>(null);
    const isRefreshingRef = useRef<boolean>(false);

    // Socket connection for real-time updates
    const {
        isConnected: socketConnected,
        connect: socketConnect,
        disconnect: socketDisconnect,
        joinExecutionRoom,
        error: socketError
    } = useSocket({
        userId,
        autoConnect: true, // Auto-connect to show connection status
        onConnection: () => {
            console.log('Connected to workflow runs socket');
        },
        onExecutionUpdate: (data) => {
            console.log('Received execution update via Socket.IO:', data);
            updateRunFromSocket(data);
        },
        onWorkflowUpdate: (data) => {
            console.log('Received workflow update via Socket.IO:', data);
            updateRunFromSocket(data);
        },
        onError: (error) => {
            console.error('Socket error in workflow runs:', error);
            setError('Real-time connection error');
        }
    });

    // Load all workflow runs from database
    const refreshRuns = useCallback(async (silent = false) => {
        // Prevent concurrent refreshes
        if (isRefreshingRef.current) {
            console.log('Refresh already in progress, skipping...');
            return;
        }

        try {
            isRefreshingRef.current = true;

            // Only show loading spinner for initial load or manual refresh
            if (!silent) {
                setLoading(true);
            }
            setError(null);

            const fetchedRuns = await fetchAllWorkflowRuns();

            // Mark runs as live if they're currently running and we have socket connection
            const runsWithSocket: WorkflowRunWithSocket[] = fetchedRuns.map(run => ({
                ...run,
                isLive: run.status === 'RUNNING' && run.runId === connectedExecutionId && socketConnected,
                lastUpdated: new Date()
            }));

            setRuns(prevRuns => {
                // Only update if there are actual changes to minimize re-renders
                if (JSON.stringify(prevRuns.map(r => ({ id: r.id, status: r.status, finishedAt: r.finishedAt }))) ===
                    JSON.stringify(runsWithSocket.map(r => ({ id: r.id, status: r.status, finishedAt: r.finishedAt })))) {
                    return prevRuns; // No significant changes
                }
                return runsWithSocket;
            });

            lastRefreshRef.current = new Date();

            console.log(`${silent ? 'Silent' : 'Manual'} loaded ${fetchedRuns.length} workflow runs`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load workflow runs';
            setError(errorMessage);
            console.error('Error loading workflow runs:', err);
        } finally {
            isRefreshingRef.current = false;
            if (!silent) {
                setLoading(false);
            }
        }
    }, [connectedExecutionId, socketConnected]);

    // Update a specific run from socket data
    const updateRunFromSocket = useCallback((socketData: any) => {
        // Convert socket data to workflow run format
        const updatedRun: Partial<N8nWorkflowRunDto> = {
            runId: socketData.executionId,
            workflowId: socketData.workflowId,
            workflowName: socketData.workflowName,
            status: socketData.status,
            finishedAt: socketData.finishedAt,
            updatedAt: new Date().toISOString()
        };

        setRuns(prevRuns => {
            const runIndex = prevRuns.findIndex(run =>
                run.runId === socketData.executionId
            );

            if (runIndex >= 0) {
                const existingRun = prevRuns[runIndex];

                // Only update if there are actual changes to avoid unnecessary re-renders
                const hasChanges =
                    existingRun.status !== updatedRun.status ||
                    existingRun.finishedAt !== updatedRun.finishedAt;

                if (!hasChanges) {
                    return prevRuns; // No changes, return same reference
                }

                const newRuns = [...prevRuns];
                newRuns[runIndex] = {
                    ...existingRun,
                    ...updatedRun,
                    isLive: true,
                    lastUpdated: new Date()
                };
                return newRuns;
            } else {
                // New run, add to the beginning of the list
                return [{
                    ...updatedRun,
                    isLive: true,
                    lastUpdated: new Date()
                } as WorkflowRunWithSocket, ...prevRuns];
            }
        });
    }, []);

    // Connect to a specific execution for real-time updates
    const connectToExecution = useCallback((executionId: string) => {
        setConnectedExecutionId(executionId);

        // Connect to socket if not already connected
        if (!socketConnected) {
            socketConnect();
            // Don't join room immediately, wait for connection
        } else {
            // Socket is already connected, join room immediately
            joinExecutionRoom(executionId);
        }

        // Mark the connected run as live
        setRuns(prevRuns =>
            prevRuns.map(run => ({
                ...run,
                isLive: run.runId === executionId && run.status === 'RUNNING'
            }))
        );
    }, [socketConnected, socketConnect, joinExecutionRoom]);

    // Disconnect from socket
    const disconnectFromExecution = useCallback(() => {
        setConnectedExecutionId(null);
        socketDisconnect();

        // Mark all runs as not live
        setRuns(prevRuns =>
            prevRuns.map(run => ({
                ...run,
                isLive: false
            }))
        );
    }, [socketDisconnect]);

    // Auto-refresh logic - Fallback when Socket is not available
    useEffect(() => {
        // Clear any existing interval
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
        }

        if (autoRefresh && !socketConnected) {

            refreshIntervalRef.current = setInterval(() => {
                // Only refresh if we're not getting live updates
                const hasRunningRuns = runs.some(run => run.status === 'RUNNING');
                const timeSinceLastRefresh = lastRefreshRef.current
                    ? Date.now() - lastRefreshRef.current.getTime()
                    : Infinity;

                // More conservative refresh strategy:
                // 1. Only refresh if there are running workflows AND it's been a while
                // 2. Or if it's been a very long time (safety net)
                const needsRefresh =
                    (hasRunningRuns && timeSinceLastRefresh > refreshInterval) ||
                    timeSinceLastRefresh > refreshInterval * 3; // Safety net: 90 seconds

                if (needsRefresh && !isRefreshingRef.current) {
                    // Use silent refresh to avoid UI flickering
                    refreshRuns(true);
                }
            }, refreshInterval);
        }

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [autoRefresh, refreshInterval, refreshRuns, socketConnected, runs]);

    // Initial load
    useEffect(() => {
        refreshRuns();
    }, [refreshRuns]);

    // Handle Socket errors
    useEffect(() => {
        if (socketError) {
            setError('Real-time connection lost');
        }
    }, [socketError]);

    // Join execution room when socket connects and we have a pending execution
    useEffect(() => {
        if (socketConnected && connectedExecutionId) {
            joinExecutionRoom(connectedExecutionId);
        }
    }, [socketConnected, connectedExecutionId, joinExecutionRoom]);

    // Auto-connect to running workflows
    useEffect(() => {
        const runningRuns = runs.filter(run => run.status === 'RUNNING');

        // If we have running runs and no socket connection, connect to the most recent one
        if (runningRuns.length > 0 && !connectedExecutionId && !socketConnected) {
            const mostRecentRun = runningRuns.sort((a, b) =>
                new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
            )[0];

            if (mostRecentRun.runId) {
                connectToExecution(mostRecentRun.runId);
            }
        }

        // If connected run is no longer running, disconnect
        if (connectedExecutionId && socketConnected) {
            const connectedRun = runs.find(run => run.runId === connectedExecutionId);
            if (connectedRun && connectedRun.status !== 'RUNNING') {
                disconnectFromExecution();
            }
        }
    }, [runs, connectedExecutionId, socketConnected, connectToExecution, disconnectFromExecution]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnectFromExecution();
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [disconnectFromExecution]);

    return {
        runs,
        loading,
        error,
        refreshRuns,
        connectToExecution,
        disconnectFromExecution,
        connectedExecutionId,
        socketConnected
    };
}