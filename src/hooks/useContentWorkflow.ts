import { useState, useEffect, useCallback } from 'react';
import { 
  ContentWorkflowStatusDto, 
  N8nWorkflowRunDto, 
  N8nNodeRunDto,
  fetchContentWorkflowStatus,
  fetchWorkflowRunsByContentId,
  fetchNodeRunsByContentId,
  fetchLatestNodeRunByContentId
} from '../services/n8n.service';
import { useContentSocket } from './useSocket';

export interface UseContentWorkflowOptions {
  contentId: number;
  userId: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableSocket?: boolean;
}

export interface UseContentWorkflowReturn {
  // Status data
  status: ContentWorkflowStatusDto | null;
  workflowRuns: N8nWorkflowRunDto[];
  nodeRuns: N8nNodeRunDto[];
  latestNodeRun: N8nNodeRunDto | null;
  
  // Loading states
  loading: boolean;
  statusLoading: boolean;
  workflowRunsLoading: boolean;
  nodeRunsLoading: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  refreshStatus: () => Promise<void>;
  refreshWorkflowRuns: () => Promise<void>;
  refreshNodeRuns: (status?: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Socket connection
  socketConnected: boolean;
  connectToContent: () => void;
  disconnectFromContent: () => void;
}

export function useContentWorkflow(options: UseContentWorkflowOptions): UseContentWorkflowReturn {
  const { 
    contentId, 
    userId, 
    autoRefresh = true, 
    refreshInterval = 30000,
    enableSocket = true 
  } = options;

  // State
  const [status, setStatus] = useState<ContentWorkflowStatusDto | null>(null);
  const [workflowRuns, setWorkflowRuns] = useState<N8nWorkflowRunDto[]>([]);
  const [nodeRuns, setNodeRuns] = useState<N8nNodeRunDto[]>([]);
  const [latestNodeRun, setLatestNodeRun] = useState<N8nNodeRunDto | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [workflowRunsLoading, setWorkflowRunsLoading] = useState(false);
  const [nodeRunsLoading, setNodeRunsLoading] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Socket connection for real-time updates
  const {
    isConnected: socketConnected,
    connect: socketConnect,
    disconnect: socketDisconnect,
    contentData,
    error: socketError
  } = useContentSocket(contentId, userId, enableSocket);

  // Update node run from socket data
  interface SocketData {
    executionId: string;
    workflowId: string;
    workflowName: string;
    nodeName: string;
    nodeType: string;
    status: string;
    mode: string;
    finishedAt: string | null;
  }

  const updateNodeRunFromSocket = useCallback((socketData: SocketData) => {
    // Create a node run DTO from the socket update data
    const nodeRunUpdate: Partial<N8nNodeRunDto> = {
      executionId: socketData.executionId,
      workflowId: socketData.workflowId,
      workflowName: socketData.workflowName,
      nodeName: socketData.nodeName,
      nodeType: socketData.nodeType,
      status: socketData.status,
      mode: socketData.mode,
      finishedAt: socketData.finishedAt ?? undefined,
      updatedAt: new Date().toISOString(),
      contentId: contentId
    };

    setNodeRuns(prevNodes => {
      const nodeIndex = prevNodes.findIndex(node => 
        node.executionId === socketData.executionId && 
        node.nodeName === socketData.nodeName
      );
      
      if (nodeIndex >= 0) {
        const newNodes = [...prevNodes];
        newNodes[nodeIndex] = { ...newNodes[nodeIndex], ...nodeRunUpdate };
        return newNodes;
      } else {
        // New node run, add to the beginning
        return [nodeRunUpdate as N8nNodeRunDto, ...prevNodes];
      }
    });

    // Update latest node run if this is more recent
    setLatestNodeRun(prev => {
      if (!prev || (socketData.finishedAt && prev.finishedAt && socketData.finishedAt > prev.finishedAt)) {
        return nodeRunUpdate as N8nNodeRunDto;
      }
      return prev;
    });
  }, [contentId]);

  // Refresh content workflow status
  const refreshStatus = useCallback(async () => {
    try {
      setStatusLoading(true);
      setError(null);
      
      const statusData = await fetchContentWorkflowStatus(contentId);
      setStatus(statusData);
      
      console.log(`Loaded content workflow status for content ${contentId}:`, statusData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load workflow status';
      setError(errorMessage);
      console.error('Error loading content workflow status:', err);
    } finally {
      setStatusLoading(false);
    }
  }, [contentId]);

  // Handle socket updates
  useEffect(() => {
    if (contentData) {
      console.log('Received content update via Socket.IO:', contentData);
      
      // Update node runs based on socket data
      if (contentData.workflowId) {
        updateNodeRunFromSocket(contentData as SocketData);
      } else {
        console.error('Invalid contentData: workflowId is undefined');
      }
      
      // Refresh status to get updated overall status
      refreshStatus();
    }
  }, [contentData, refreshStatus, updateNodeRunFromSocket]);

  // Refresh workflow runs
  const refreshWorkflowRuns = useCallback(async () => {
    try {
      setWorkflowRunsLoading(true);
      setError(null);
      
      const runs = await fetchWorkflowRunsByContentId(contentId);
      setWorkflowRuns(runs);
      
      console.log(`Loaded ${runs.length} workflow runs for content ${contentId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load workflow runs';
      setError(errorMessage);
      console.error('Error loading workflow runs:', err);
    } finally {
      setWorkflowRunsLoading(false);
    }
  }, [contentId]);

  // Refresh node runs
  const refreshNodeRuns = useCallback(async (statusFilter?: string) => {
    try {
      setNodeRunsLoading(true);
      setError(null);
      
      const nodes = await fetchNodeRunsByContentId(contentId, statusFilter);
      setNodeRuns(nodes);
      
      // Also fetch latest node run
      try {
        const latest = await fetchLatestNodeRunByContentId(contentId);
        setLatestNodeRun(latest);
      } catch (latestErr) {
        // Latest node run is optional, don't fail the whole operation
        console.warn('Could not fetch latest node run:', latestErr);
      }
      
      console.log(`Loaded ${nodes.length} node runs for content ${contentId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load node runs';
      setError(errorMessage);
      console.error('Error loading node runs:', err);
    } finally {
      setNodeRunsLoading(false);
    }
  }, [contentId]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshStatus(),
        refreshWorkflowRuns(),
        refreshNodeRuns()
      ]);
    } finally {
      setLoading(false);
    }
  }, [refreshStatus, refreshWorkflowRuns, refreshNodeRuns]);

  // Connect to content for real-time updates
  const connectToContent = useCallback(() => {
    if (enableSocket) {
      console.log('Connecting to content for real-time updates:', contentId);
      socketConnect();
    }
  }, [enableSocket, contentId, socketConnect]);

  // Disconnect from content
  const disconnectFromContent = useCallback(() => {
    console.log('Disconnecting from content Socket.IO');
    socketDisconnect();
  }, [socketDisconnect]);

  // Auto-refresh logic (fallback when socket is not connected)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (autoRefresh && !socketConnected) {
      console.log('Socket not connected, starting fallback refresh interval');
      
      intervalId = setInterval(() => {
        // Only refresh if there are running workflows
        const hasRunningWorkflow = status?.overallStatus === 'RUNNING';
        
        if (hasRunningWorkflow) {
          console.log('Silent refresh triggered - workflow is running');
          refreshAll();
        }
      }, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, socketConnected, status?.overallStatus, refreshAll]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Auto-connect to Socket when workflow is running
  useEffect(() => {
    if (enableSocket && status?.overallStatus === 'RUNNING' && !socketConnected) {
      connectToContent();
    }
  }, [enableSocket, status?.overallStatus, socketConnected, connectToContent]);

  // Handle Socket errors
  useEffect(() => {
    if (socketError) {
      setError('Real-time connection lost');
    }
  }, [socketError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromContent();
    };
  }, [disconnectFromContent]);

  return {
    // Status data
    status,
    workflowRuns,
    nodeRuns,
    latestNodeRun,
    
    // Loading states
    loading,
    statusLoading,
    workflowRunsLoading,
    nodeRunsLoading,
    
    // Error state
    error,
    
    // Actions
    refreshStatus,
    refreshWorkflowRuns,
    refreshNodeRuns,
    refreshAll,
    
    // Socket connection
    socketConnected,
    connectToContent,
    disconnectFromContent
  };
}