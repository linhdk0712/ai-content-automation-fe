import { api } from './api';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  createdAt: string;
  updatedAt?: string;
  parentId?: string;
  replies: Comment[];
  likes: number;
  dislikes: number;
  userReaction?: 'like' | 'dislike';
  isEdited: boolean;
  mentions: string[];
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
}

interface AddCommentRequest {
  content: string;
  parentId?: string;
  mentions?: string[];
  attachments?: File[];
}

interface UpdateCommentRequest {
  content: string;
  mentions?: string[];
}

class CommentService {
  async getComments(contentId: string, contentType: 'content' | 'template' | 'media'): Promise<Comment[]> {
    const response = await api.get(`/comments/${contentType}/${contentId}`);
    return response.data;
  }

  async addComment(
    contentId: string, 
    contentType: 'content' | 'template' | 'media', 
    request: AddCommentRequest
  ): Promise<Comment> {
    const formData = new FormData();
    formData.append('content', request.content);
    
    if (request.parentId) {
      formData.append('parentId', request.parentId);
    }
    
    if (request.mentions) {
      request.mentions.forEach(mention => formData.append('mentions', mention));
    }
    
    if (request.attachments) {
      request.attachments.forEach(file => formData.append('attachments', file));
    }

    const response = await api.post(`/comments/${contentType}/${contentId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateComment(commentId: string, request: UpdateCommentRequest): Promise<Comment> {
    const response = await api.put(`/comments/${commentId}`, request);
    return response.data;
  }

  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/comments/${commentId}`);
  }

  async reactToComment(commentId: string, reaction: 'like' | 'dislike'): Promise<Comment> {
    const response = await api.post(`/comments/${commentId}/react`, { reaction });
    return response.data;
  }

  async removeReaction(commentId: string): Promise<Comment> {
    const response = await api.delete(`/comments/${commentId}/react`);
    return response.data;
  }

  async getCommentById(commentId: string): Promise<Comment> {
    const response = await api.get(`/comments/${commentId}`);
    return response.data;
  }

  async getCommentReplies(commentId: string): Promise<Comment[]> {
    const response = await api.get(`/comments/${commentId}/replies`);
    return response.data;
  }

  async reportComment(commentId: string, reason: string): Promise<void> {
    await api.post(`/comments/${commentId}/report`, { reason });
  }

  async pinComment(commentId: string): Promise<void> {
    await api.post(`/comments/${commentId}/pin`);
  }

  async unpinComment(commentId: string): Promise<void> {
    await api.delete(`/comments/${commentId}/pin`);
  }

  async getCommentHistory(commentId: string): Promise<Array<{
    version: number;
    content: string;
    editedAt: string;
    editedBy: string;
  }>> {
    const response = await api.get(`/comments/${commentId}/history`);
    return response.data;
  }

  async getMentionSuggestions(query: string): Promise<Array<{
    id: string;
    name: string;
    avatar: string;
    role: string;
  }>> {
    const response = await api.get(`/comments/mentions/suggestions?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  async getCommentStats(contentId: string, contentType: string): Promise<{
    totalComments: number;
    totalReplies: number;
    totalReactions: number;
    averageResponseTime: number;
    mostActiveCommenters: Array<{
      userId: string;
      userName: string;
      commentCount: number;
    }>;
  }> {
    const response = await api.get(`/comments/${contentType}/${contentId}/stats`);
    return response.data;
  }

  async bulkDeleteComments(commentIds: string[]): Promise<void> {
    await api.delete('/comments/bulk', { data: { commentIds } });
  }

  async moderateComment(commentId: string, action: 'approve' | 'reject' | 'flag'): Promise<void> {
    await api.post(`/comments/${commentId}/moderate`, { action });
  }

  async getCommentNotifications(): Promise<Array<{
    id: string;
    type: 'mention' | 'reply' | 'reaction';
    commentId: string;
    actorName: string;
    content: string;
    createdAt: string;
    isRead: boolean;
  }>> {
    const response = await api.get('/comments/notifications');
    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await api.put(`/comments/notifications/${notificationId}/read`);
  }
}

export const commentService = new CommentService();