import { useState, useEffect, useCallback, useRef } from 'react';
import { N8nWorkflowRunDto, fetchAllWorkflowRuns, fetchWorkflowRun } from '../services/n8n.service';
import { useSSE } from './useSSE';

export interface WorkflowRunWithSSE extends N8nWorkflowRunDto {
    isLive?: boolean; // Indicates if this run is receiving live updates
    lastUpdated?: Date;
}

export interface UseWorkflowRunsOptions {
    userId: number;
    autoRefresh?: boolean;
    refreshInterval?: number;
}

export interface UseWorkflowRunsReturn {
    runs: WorkflowRunWithSSE[];
    loading: boolean;
    error: string | null;
    refreshRuns: (silent?: boolean) => Promise<void>;
    connectToRun: (runId: string) => void;
    disconnectFromRun: () => void;
    connectedRunId: string | null;
    sseConnected: boolean;
}

export function useWorkflowRuns(options: UseWorkflowRunsOptions): UseWorkflowRunsReturn {
    const { userId, autoRefresh = true, refreshInterval = 30000 } = options;

    const [runs, setRuns] = useState<WorkflowRunWithSSE[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connectedRunId, setConnectedRunId] = useState<string | null>(null);

    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastRefreshRef = useRef<Date | null>(null);
    const isRefreshingRef = useRef<boolean>(false);

    // SSE connection for real-time updates
    const {
        isConnected: sseConnected,
        connectToRun: sseConnectToRun,
        disconnect: sseDisconnect,
        error: sseError
    } = useSSE({
        userId,
        onConnection: (data) => {
            console.log('Connected to workflow run SSE:', data);
        },
        onRunUpdate: (data) => {
            console.log('Received run update via SSE:', data);
            updateRunInList(data);
        },
        onNodeUpdate: (data) => {
            console.log('Received node update via SSE:', data);
            // Update the run with node information
            if (connectedRunId) {
                updateRunProgress(connectedRunId, data);
            }
        },
        onError: (error) => {
            console.error('SSE error in workflow runs:', error);
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

            // Mark runs as live if they're currently running and we have SSE connection
            const runsWithSSE: WorkflowRunWithSSE[] = fetchedRuns.map(run => ({
                ...run,
                isLive: run.status === 'RUNNING' && run.runId === connectedRunId && sseConnected,
                lastUpdated: new Date()
            }));

            setRuns(prevRuns => {
                // Only update if there are actual changes to minimize re-renders
                if (JSON.stringify(prevRuns.map(r => ({ id: r.id, status: r.status, finishedAt: r.finishedAt }))) ===
                    JSON.stringify(runsWithSSE.map(r => ({ id: r.id, status: r.status, finishedAt: r.finishedAt })))) {
                    return prevRuns; // No significant changes
                }
                return runsWithSSE;
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
    }, [connectedRunId, sseConnected]);

    // Update a specific run in the list (smooth update without flickering)
    const updateRunInList = useCallback((updatedRun: N8nWorkflowRunDto) => {
        setRuns(prevRuns => {
            const runIndex = prevRuns.findIndex(run =>
                run.id === updatedRun.id || run.runId === updatedRun.runId
            );

            if (runIndex >= 0) {
                const existingRun = prevRuns[runIndex];

                // Only update if there are actual changes to avoid unnecessary re-renders
                const hasChanges =
                    existingRun.status !== updatedRun.status ||
                    existingRun.finishedAt !== updatedRun.finishedAt ||
                    existingRun.output !== updatedRun.output ||
                    existingRun.errorMessage !== updatedRun.errorMessage;

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
                }, ...prevRuns];
            }
        });
    }, []);

    // Update run progress based on node updates
    const updateRunProgress = useCallback((runId: string, nodeData: any) => {
        setRuns(prevRuns => {
            return prevRuns.map(run => {
                if (run.runId === runId) {
                    // Update output with node information
                    let updatedOutput = run.output;
                    try {
                        const output = updatedOutput ? JSON.parse(updatedOutput) : {};
                        output.currentNode = nodeData.nodeName;
                        output.currentNodeStatus = nodeData.status;
                        output.lastNodeUpdate = new Date().toISOString();
                        updatedOutput = JSON.stringify(output);
                    } catch (e) {
                        console.warn('Failed to update run output with node data:', e);
                    }

                    return {
                        ...run,
                        output: updatedOutput,
                        isLive: true,
                        lastUpdated: new Date()
                    };
                }
                return run;
            });
        });
    }, []);

    // Connect to a specific run for real-time updates
    const connectToRun = useCallback((runId: string) => {
        console.log('Connecting to run for real-time updates:', runId);
        setConnectedRunId(runId);
        sseConnectToRun(runId);

        // Mark the connected run as live
        setRuns(prevRuns =>
            prevRuns.map(run => ({
                ...run,
                isLive: run.runId === runId && run.status === 'RUNNING'
            }))
        );
    }, [sseConnectToRun]);

    // Disconnect from SSE
    const disconnectFromRun = useCallback(() => {
        console.log('Disconnecting from run SSE');
        setConnectedRunId(null);
        sseDisconnect();

        // Mark all runs as not live
        setRuns(prevRuns =>
            prevRuns.map(run => ({
                ...run,
                isLive: false
            }))
        );
    }, [sseDisconnect]);

    // Auto-refresh logic - Fallback when SSE is not available
    useEffect(() => {
        // Clear any existing interval
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
        }

        if (autoRefresh && !sseConnected) {
            console.log('SSE not connected, starting fallback refresh interval');

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
                    console.log('Silent fallback refresh triggered - SSE unavailable');
                    // Use silent refresh to avoid UI flickering
                    refreshRuns(true);
                }
            }, refreshInterval);
        } else if (sseConnected) {
            console.log('SSE connected, disabling fallback refresh interval');
        }

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [autoRefresh, refreshInterval, refreshRuns, sseConnected, runs]);

    // Initial load
    useEffect(() => {
        refreshRuns();
    }, [refreshRuns]);

    // Handle SSE errors
    useEffect(() => {
        if (sseError) {
            setError('Real-time connection lost');
        }
    }, [sseError]);

    // Auto-connect to running workflows
    useEffect(() => {
        const runningRuns = runs.filter(run => run.status === 'RUNNING');

        // If we have running runs and no SSE connection, connect to the most recent one
        if (runningRuns.length > 0 && !connectedRunId && !sseConnected) {
            const mostRecentRun = runningRuns.sort((a, b) =>
                new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
            )[0];

            if (mostRecentRun.runId) {
                console.log('Auto-connecting to most recent running workflow:', mostRecentRun.runId);
                connectToRun(mostRecentRun.runId);
            }
        }

        // If connected run is no longer running, disconnect
        if (connectedRunId && sseConnected) {
            const connectedRun = runs.find(run => run.runId === connectedRunId);
            if (connectedRun && connectedRun.status !== 'RUNNING') {
                console.log('Connected run is no longer running, disconnecting');
                disconnectFromRun();
            }
        }
    }, [runs, connectedRunId, sseConnected, connectToRun, disconnectFromRun]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnectFromRun();
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [disconnectFromRun]);

    return {
        runs,
        loading,
        error,
        refreshRuns,
        connectToRun,
        disconnectFromRun,
        connectedRunId,
        sseConnected
    };
}