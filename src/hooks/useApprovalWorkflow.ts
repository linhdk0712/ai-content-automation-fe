import { useState, useEffect } from 'react';
import { approvalService } from '../services/approval.service';

interface ContentItem {
  id: string;
  title: string;
  type: 'text' | 'image' | 'video';
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  submittedAt: string;
  reviewedAt?: string;
  reviewer?: {
    id: string;
    name: string;
  };
  comments: Comment[];
  priority: 'low' | 'medium' | 'high';
}

interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  content: string;
  createdAt: string;
  type: 'comment' | 'approval' | 'rejection';
}

interface UseApprovalWorkflowReturn {
  pendingItems: ContentItem[] | null;
  approvedItems: ContentItem[] | null;
  rejectedItems: ContentItem[] | null;
  loading: boolean;
  error: string | null;
  approveContent: (contentId: string, comment?: string) => Promise<void>;
  rejectContent: (contentId: string, comment: string) => Promise<void>;
  requestRevision: (contentId: string, comment: string) => Promise<void>;
  addComment: (contentId: string, comment: string) => Promise<void>;
  refreshItems: () => Promise<void>;
}

export const useApprovalWorkflow = (): UseApprovalWorkflowReturn => {
  const [pendingItems, setPendingItems] = useState<ContentItem[] | null>(null);
  const [approvedItems, setApprovedItems] = useState<ContentItem[] | null>(null);
  const [rejectedItems, setRejectedItems] = useState<ContentItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pending, approved, rejected] = await Promise.all([
        approvalService.getPendingItems(),
        approvalService.getApprovedItems(),
        approvalService.getRejectedItems()
      ]);
      setPendingItems(pending);
      setApprovedItems(approved);
      setRejectedItems(rejected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch approval items');
    } finally {
      setLoading(false);
    }
  };

  const approveContent = async (contentId: string, comment?: string) => {
    try {
      setLoading(true);
      await approvalService.approveContent(contentId, comment);
      
      // Move item from pending to approved
      const item = pendingItems?.find(item => item.id === contentId);
      if (item) {
        setPendingItems(prev => prev?.filter(i => i.id !== contentId) || null);
        setApprovedItems(prev => [...(prev || []), { ...item, status: 'approved' as const }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve content');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectContent = async (contentId: string, comment: string) => {
    try {
      setLoading(true);
      await approvalService.rejectContent(contentId, comment);
      
      // Move item from pending to rejected
      const item = pendingItems?.find(item => item.id === contentId);
      if (item) {
        setPendingItems(prev => prev?.filter(i => i.id !== contentId) || null);
        setRejectedItems(prev => [...(prev || []), { ...item, status: 'rejected' as const }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject content');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const requestRevision = async (contentId: string, comment: string) => {
    try {
      setLoading(true);
      await approvalService.requestRevision(contentId, comment);
      
      // Update item status
      setPendingItems(prev => 
        prev?.map(item => 
          item.id === contentId 
            ? { ...item, status: 'revision_requested' as const }
            : item
        ) || null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request revision');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (contentId: string, comment: string) => {
    try {
      await approvalService.addComment(contentId, comment);
      // Refresh items to get updated comments
      await fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      throw err;
    }
  };

  const refreshItems = async () => {
    await fetchItems();
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return {
    pendingItems,
    approvedItems,
    rejectedItems,
    loading,
    error,
    approveContent,
    rejectContent,
    requestRevision,
    addComment,
    refreshItems
  };
};