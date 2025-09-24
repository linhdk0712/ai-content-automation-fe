import { api } from './api';

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

interface ApprovalRequest {
  comment?: string;
}

interface RevisionRequest {
  comment: string;
  changes: string[];
}

class ApprovalService {
  async getPendingItems(): Promise<ContentItem[]> {
    const response = await api.get('/approval/pending');
    return response.data;
  }

  async getApprovedItems(): Promise<ContentItem[]> {
    const response = await api.get('/approval/approved');
    return response.data;
  }

  async getRejectedItems(): Promise<ContentItem[]> {
    const response = await api.get('/approval/rejected');
    return response.data;
  }

  async getItemsByStatus(status: string): Promise<ContentItem[]> {
    const response = await api.get(`/approval/items?status=${status}`);
    return response.data;
  }

  async approveContent(contentId: string, comment?: string): Promise<void> {
    const request: ApprovalRequest = { comment };
    await api.post(`/approval/${contentId}/approve`, request);
  }

  async rejectContent(contentId: string, comment: string): Promise<void> {
    const request: ApprovalRequest = { comment };
    await api.post(`/approval/${contentId}/reject`, request);
  }

  async requestRevision(contentId: string, comment: string): Promise<void> {
    const request: RevisionRequest = { 
      comment,
      changes: [] // This could be expanded to include specific change requests
    };
    await api.post(`/approval/${contentId}/revision`, request);
  }

  async addComment(contentId: string, comment: string): Promise<Comment> {
    const response = await api.post(`/approval/${contentId}/comments`, { content: comment });
    return response.data;
  }

  async getContentDetails(contentId: string): Promise<ContentItem> {
    const response = await api.get(`/approval/${contentId}`);
    return response.data;
  }

  async getApprovalHistory(contentId: string): Promise<any[]> {
    const response = await api.get(`/approval/${contentId}/history`);
    return response.data;
  }

  async bulkApprove(contentIds: string[], comment?: string): Promise<void> {
    await api.post('/approval/bulk/approve', { contentIds, comment });
  }

  async bulkReject(contentIds: string[], comment: string): Promise<void> {
    await api.post('/approval/bulk/reject', { contentIds, comment });
  }

  async assignReviewer(contentId: string, reviewerId: string): Promise<void> {
    await api.post(`/approval/${contentId}/assign`, { reviewerId });
  }

  async getApprovalStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    avgApprovalTime: number;
  }> {
    const response = await api.get('/approval/stats');
    return response.data;
  }

  async getReviewerWorkload(): Promise<Array<{
    reviewerId: string;
    reviewerName: string;
    pendingCount: number;
    avgReviewTime: number;
  }>> {
    const response = await api.get('/approval/reviewer-workload');
    return response.data;
  }

  async setApprovalWorkflow(workflowConfig: any): Promise<void> {
    await api.put('/approval/workflow', workflowConfig);
  }

  async getApprovalWorkflow(): Promise<any> {
    const response = await api.get('/approval/workflow');
    return response.data;
  }
}

export const approvalService = new ApprovalService();