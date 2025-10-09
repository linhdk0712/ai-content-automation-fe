import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

export interface WorkflowNodeUpdate {
    executionId: string;
    workflowId: string;
    workflowName: string;
    nodeName: string;
    nodeType: string;
    status: 'success' | 'failed' | 'running' | 'waiting';
    mode: 'test' | 'production';
    finishedAt: string;
    contentId?: string;
    result?: any;
    timestamp: string;
}

export interface WorkflowExecution {
    executionId: string;
    workflowId: string;
    workflowName: string;
    contentId?: string;
    nodes: WorkflowNodeUpdate[];
    startedAt: string;
    status: 'running' | 'completed' | 'failed';
    lastUpdated: string;
}

export interface UseWorkflowNodeTimelineOptions {
    userId: number;
    executionId?: string;
    contentId?: string;
    autoConnect?: boolean;
}

export interface UseWorkflowNodeTimelineReturn {
    executions: WorkflowExecution[];
    currentExecution: WorkflowExecution | null;
    loading: boolean;
    error: string | null;
    socketConnected: boolean;
    connectToExecution: (executionId: string) => void;
    connectToContent: (contentId: string) => void;
    disconnect: () => void;
    clearHistory: () => void;
}

export function useWorkflowNodeTimeline(options: UseWorkflowNodeTimelineOptions): UseWorkflowNodeTimelineReturn {
    const { userId, executionId, contentId, autoConnect = true } = options;

    const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
    const [currentExecution, setCurrentExecution] = useState<WorkflowExecution | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Socket connection for real-time node updates
    const {
        isConnected: socketConnected,
        connect: socketConnect,
        disconnect: socketDisconnect,
        joinExecutionRoom,
        joinContentRoom,
        error: socketError
    } = useSocket({
        userId,
        autoConnect,
        onConnection: () => {
            console.log('Connected to workflow node timeline socket');
            setError(null);
        },
        onExecutionUpdate: (data) => {
            console.log('Received execution update:', data);
            handleNodeUpdate(data);
        },
        onWorkflowUpdate: (data) => {
            console.log('Received workflow update:', data);
            handleNodeUpdate(data);
        },
        onContentUpdate: (data) => {
            console.log('Received content update:', data);
            handleNodeUpdate(data);
        },
        onError: (error) => {
            console.error('Socket error in node timeline:', error);
            setError('Kết nối realtime bị lỗi');
        }
    });

    // Handle incoming node updates from socket
    const handleNodeUpdate = useCallback((data: any) => {
        const nodeUpdate: WorkflowNodeUpdate = {
            executionId: data.executionId,
            workflowId: data.workflowId,
            workflowName: data.workflowName || '',
            nodeName: data.nodeName,
            nodeType: data.nodeType || 'unknown',
            status: data.status,
            mode: data.mode || 'production',
            finishedAt: data.finishedAt,
            contentId: data.contentId,
            result: data.result,
            timestamp: data.timestamp || new Date().toISOString()
        };

        setExecutions(prevExecutions => {
            const executionIndex = prevExecutions.findIndex(
                exec => exec.executionId === nodeUpdate.executionId
            );

            if (executionIndex >= 0) {
                // Update existing execution
                const updatedExecutions = [...prevExecutions];
                const execution = { ...updatedExecutions[executionIndex] };

                // Check if node already exists
                const nodeIndex = execution.nodes.findIndex(
                    node => node.nodeName === nodeUpdate.nodeName
                );

                if (nodeIndex >= 0) {
                    // Update existing node
                    execution.nodes[nodeIndex] = nodeUpdate;
                } else {
                    // Add new node
                    execution.nodes.push(nodeUpdate);
                }

                // Sort nodes by timestamp
                execution.nodes.sort((a, b) =>
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );

                // Update execution status
                execution.lastUpdated = nodeUpdate.timestamp;

                // Determine execution status based on node statuses
                const hasFailedNodes = execution.nodes.some(node => node.status === 'failed');
                const hasRunningNodes = execution.nodes.some(node => node.status === 'running');

                if (hasFailedNodes) {
                    execution.status = 'failed';
                } else if (hasRunningNodes) {
                    execution.status = 'running';
                } else {
                    execution.status = 'completed';
                }

                updatedExecutions[executionIndex] = execution;
                return updatedExecutions;
            } else {
                // Create new execution
                const newExecution: WorkflowExecution = {
                    executionId: nodeUpdate.executionId,
                    workflowId: nodeUpdate.workflowId,
                    workflowName: nodeUpdate.workflowName,
                    contentId: nodeUpdate.contentId,
                    nodes: [nodeUpdate],
                    startedAt: nodeUpdate.timestamp,
                    status: nodeUpdate.status === 'failed' ? 'failed' : 'running',
                    lastUpdated: nodeUpdate.timestamp
                };

                return [newExecution, ...prevExecutions];
            }
        });

        // Update current execution if it matches
        setCurrentExecution(prevCurrent => {
            if (prevCurrent && prevCurrent.executionId === nodeUpdate.executionId) {
                const nodeIndex = prevCurrent.nodes.findIndex(
                    node => node.nodeName === nodeUpdate.nodeName
                );

                const updatedExecution = { ...prevCurrent };

                if (nodeIndex >= 0) {
                    updatedExecution.nodes[nodeIndex] = nodeUpdate;
                } else {
                    updatedExecution.nodes.push(nodeUpdate);
                }

                updatedExecution.nodes.sort((a, b) =>
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );

                updatedExecution.lastUpdated = nodeUpdate.timestamp;

                // Update status
                const hasFailedNodes = updatedExecution.nodes.some(node => node.status === 'failed');
                const hasRunningNodes = updatedExecution.nodes.some(node => node.status === 'running');

                if (hasFailedNodes) {
                    updatedExecution.status = 'failed';
                } else if (hasRunningNodes) {
                    updatedExecution.status = 'running';
                } else {
                    updatedExecution.status = 'completed';
                }

                return updatedExecution;
            }
            return prevCurrent;
        });
    }, []);

    // Connect to specific execution
    const connectToExecution = useCallback((execId: string) => {
        if (!socketConnected) {
            socketConnect();
        }

        joinExecutionRoom(execId);

        // Set current execution
        const execution = executions.find(exec => exec.executionId === execId);
        setCurrentExecution(execution || null);
    }, [socketConnected, socketConnect, joinExecutionRoom, executions]);

    // Connect to content updates
    const connectToContent = useCallback((contentId: string) => {
        if (!socketConnected) {
            socketConnect();
        }

        joinContentRoom(contentId);
    }, [socketConnected, socketConnect, joinContentRoom]);

    // Disconnect from socket
    const disconnect = useCallback(() => {
        socketDisconnect();
        setCurrentExecution(null);
    }, [socketDisconnect]);

    // Clear execution history
    const clearHistory = useCallback(() => {
        setExecutions([]);
        setCurrentExecution(null);
    }, []);

    // Auto-connect on mount if executionId or contentId provided
    useEffect(() => {
        if (autoConnect && socketConnected) {
            if (executionId) {
                connectToExecution(executionId);
            }
            if (contentId) {
                connectToContent(contentId);
            }
        }
    }, [autoConnect, socketConnected, executionId, contentId, connectToExecution, connectToContent]);

    // Handle socket errors
    useEffect(() => {
        if (socketError) {
            setError('Mất kết nối realtime');
        }
    }, [socketError]);

    return {
        executions,
        currentExecution,
        loading,
        error,
        socketConnected,
        connectToExecution,
        connectToContent,
        disconnect,
        clearHistory
    };
}