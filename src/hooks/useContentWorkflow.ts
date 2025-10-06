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
import { useSSE } from './useSSE';

export interface UseContentWorkflowOptions {
  contentId: number;
  userId: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableSSE?: boolean;
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
  
  // SSE connection
  sseConnected: boolean;
  connectToWorkflow: () => void;
  disconnectFromWorkflow: () => void;
}

export function useContentWorkflow(options: UseContentWorkflowOptions): UseContentWorkflowReturn {
  const { 
    contentId, 
    userId, 
    autoRefresh = true, 
    refreshInterval = 30000,
    enableSSE = true 
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

  // SSE connection for real-time updates
  const {
    isConnected: sseConnected,
    connectToWorkflow: sseConnectToWorkflow,
    disconnect: sseDisconnect,
    error: sseError
  } = useSSE({
    userId,
    onConnection: (data) => {
      console.log('Connected to content workflow SSE:', data);
    },
    onWorkflowUpdate: (data) => {
      console.log('Received workflow update via SSE:', data);
      updateWorkflowRunInList(data);
      // Refresh status to get updated overall status
      refreshStatus();
    },
    onRunUpdate: (data) => {
      console.log('Received run update via SSE:', data);
      updateWorkflowRunInList(data);
    },
    onNodeUpdate: (data) => {
      console.log('Received node update via SSE:', data);
      updateNodeRunInList(data);
      // Refresh status to get updated progress
      refreshStatus();
    },
    onError: (error) => {
      console.error('SSE error in content workflow:', error);
      setError('Real-time connection error');
    }
  });

  // Update workflow run in list
  const updateWorkflowRunInList = useCallback((updatedRun: N8nWorkflowRunDto) => {
    setWorkflowRuns(prevRuns => {
      const runIndex = prevRuns.findIndex(run => 
        run.id === updatedRun.id || run.runId === updatedRun.runId
      );
      
      if (runIndex >= 0) {
        const newRuns = [...prevRuns];
        newRuns[runIndex] = { ...newRuns[runIndex], ...updatedRun };
        return newRuns;
      } else {
        // New run, add to the beginning
        return [updatedRun, ...prevRuns];
      }
    });
  }, []);

  // Update node run in list
  const updateNodeRunInList = useCallback((nodeData: any) => {
    // Create a node run DTO from the node update data
    const nodeRunUpdate: Partial<N8nNodeRunDto> = {
      executionId: nodeData.executionId,
      workflowId: nodeData.workflowId,
      workflowName: nodeData.workflowName,
      nodeName: nodeData.nodeName,
      nodeType: nodeData.nodeType,
      status: nodeData.status,
      mode: nodeData.mode,
      finishedAt: nodeData.finishedAt,
      updatedAt: new Date().toISOString(),
      contentId: contentId
    };

    setNodeRuns(prevNodes => {
      const nodeIndex = prevNodes.findIndex(node => 
        node.executionId === nodeData.executionId && 
        node.nodeName === nodeData.nodeName
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
      if (!prev || (nodeData.finishedAt && nodeData.finishedAt > prev.finishedAt)) {
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

  // Connect to workflow for real-time updates
  const connectToWorkflow = useCallback(() => {
    if (enableSSE && status?.workflowRun?.runId) {
      console.log('Connecting to workflow for real-time updates:', status.workflowRun.runId);
      sseConnectToWorkflow(status.workflowRun.runId);
    }
  }, [enableSSE, status?.workflowRun?.runId, sseConnectToWorkflow]);

  // Disconnect from workflow
  const disconnectFromWorkflow = useCallback(() => {
    console.log('Disconnecting from workflow SSE');
    sseDisconnect();
  }, [sseDisconnect]);

  // Auto-refresh logic
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (autoRefresh && !sseConnected) {
      console.log('SSE not connected, starting fallback refresh interval');
      
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
  }, [autoRefresh, refreshInterval, sseConnected, status?.overallStatus, refreshAll]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Auto-connect to SSE when workflow is running
  useEffect(() => {
    if (enableSSE && status?.overallStatus === 'RUNNING' && !sseConnected) {
      connectToWorkflow();
    }
  }, [enableSSE, status?.overallStatus, sseConnected, connectToWorkflow]);

  // Handle SSE errors
  useEffect(() => {
    if (sseError) {
      setError('Real-time connection lost');
    }
  }, [sseError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromWorkflow();
    };
  }, [disconnectFromWorkflow]);

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
    
    // SSE connection
    sseConnected,
    connectToWorkflow,
    disconnectFromWorkflow
  };
}