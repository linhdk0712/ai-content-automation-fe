import { useEffect, useState } from 'react';
import { BillingInfo, WorkspaceService, WorkspaceSettings } from '../services/workspace.service';

const workspaceService = new WorkspaceService();

interface UseWorkspaceReturn {
  workspace: WorkspaceSettings | null;
  billingInfo: BillingInfo | null;
  loading: boolean;
  error: string | null;
  updateWorkspace: (settings: WorkspaceSettings) => Promise<void>;
  deleteWorkspace: () => Promise<void>;
  refreshWorkspace: () => Promise<void>;
}

export const useWorkspace = (workspaceId: string): UseWorkspaceReturn => {
  const [workspace, setWorkspace] = useState<WorkspaceSettings | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      setError(null);
      const [workspaceData, billingData] = await Promise.all([
        workspaceService.getWorkspace(workspaceId),
        workspaceService.getBillingInfo(workspaceId)
      ]);
      setWorkspace(workspaceData.settings);
      setBillingInfo(billingData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workspace data');
    } finally {
      setLoading(false);
    }
  };

  const updateWorkspace = async (settings: WorkspaceSettings) => {
    try {
      setLoading(true);
        const updatedWorkspace = await workspaceService.updateWorkspace(workspaceId, {
          settings: settings
        });
      setWorkspace(updatedWorkspace.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workspace');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkspace = async () => {
    try {
      setLoading(true);
      await workspaceService.deleteWorkspace(workspaceId);
      setWorkspace(null);
      setBillingInfo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workspace');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshWorkspace = async () => {
    await fetchWorkspace();
  };

  useEffect(() => {
    fetchWorkspace();
  }, []);

  return {
    workspace,
    billingInfo,
    loading,
    error,
    updateWorkspace,
    deleteWorkspace,
    refreshWorkspace
  };
};