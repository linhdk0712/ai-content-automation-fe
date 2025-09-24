import { useCallback, useState } from 'react';

export interface ScheduledPost {
  id: number;
  contentId: number;
  title: string;
  content: string;
  platforms: Array<{
    platform: 'facebook' | 'twitter' | 'instagram' | 'youtube' | 'linkedin' | 'tiktok';
    accountId: number;
    accountName: string;
    status: 'pending' | 'processing' | 'published' | 'failed' | 'cancelled';
    scheduledAt: string;
    publishedAt?: string;
    error?: string;
    postId?: string;
    postUrl?: string;
  }>;
  mediaFiles: Array<{
    id: number;
    type: 'image' | 'video' | 'document';
    url: string;
    filename: string;
    size: number;
  }>;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdBy: {
    id: number;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  scheduledAt: string;
  publishedAt?: string;
  tags: string[];
  metadata: {
    hashtags?: string[];
    mentions?: string[];
    location?: string;
    campaignId?: string;
    estimatedReach?: number;
  };
  analytics?: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    clicks: number;
  };
}

export interface LoadScheduledPostsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  platform?: string;
  priority?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UsePublishingReturn {
  scheduledPosts: ScheduledPost[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  loadScheduledPosts: (params?: LoadScheduledPostsParams) => Promise<void>;
  publishNow: (postId: number) => Promise<void>;
  cancelPost: (postId: number) => Promise<void>;
  reschedulePost: (postId: number, newScheduleDate: string) => Promise<void>;
  deletePost: (postId: number) => Promise<void>;
  bulkAction: (action: 'publish' | 'cancel' | 'delete', postIds: number[]) => Promise<void>;
  retryFailedPost: (postId: number) => Promise<void>;
}

export const usePublishing = (): UsePublishingReturn => {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const loadScheduledPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Mock data - replace with actual API call
      setScheduledPosts([]);
      setTotalCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scheduled posts');
    } finally {
      setLoading(false);
    }
  }, []);

  const publishNow = useCallback(async (postId: number) => {
    try {
      setLoading(true);
      // Mock implementation - replace with actual API call
      console.log('Publishing post now:', postId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish post');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelPost = useCallback(async (postId: number) => {
    try {
      setLoading(true);
      // Mock implementation - replace with actual API call
      console.log('Cancelling post:', postId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel post');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reschedulePost = useCallback(async (postId: number, newScheduleDate: string) => {
    try {
      setLoading(true);
      // Mock implementation - replace with actual API call
      console.log('Rescheduling post:', postId, newScheduleDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule post');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePost = useCallback(async (postId: number) => {
    try {
      setLoading(true);
      // Mock implementation - replace with actual API call
      console.log('Deleting post:', postId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkAction = useCallback(async (action: 'publish' | 'cancel' | 'delete', postIds: number[]) => {
    try {
      setLoading(true);
      // Mock implementation - replace with actual API call
      console.log('Bulk action:', action, postIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform bulk action');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const retryFailedPost = useCallback(async (postId: number) => {
    try {
      setLoading(true);
      // Mock implementation - replace with actual API call
      console.log('Retrying failed post:', postId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry post');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    scheduledPosts,
    loading,
    error,
    totalCount,
    loadScheduledPosts,
    publishNow,
    cancelPost,
    reschedulePost,
    deletePost,
    bulkAction,
    retryFailedPost
  };
};
