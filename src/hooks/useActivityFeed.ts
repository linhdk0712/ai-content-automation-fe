import { useState, useEffect } from 'react';
import { activityService } from '../services/activity.service';

interface Activity {
  id: string;
  type: 'content_created' | 'content_updated' | 'content_published' | 'content_scheduled' | 
        'comment_added' | 'member_joined' | 'member_left' | 'approval_requested' | 
        'content_approved' | 'content_rejected';
  actor: {
    id: string;
    name: string;
    avatar: string;
  };
  target?: {
    id: string;
    name: string;
    type: 'content' | 'user' | 'workspace';
  };
  metadata?: {
    [key: string]: any;
  };
  timestamp: string;
  isRead: boolean;
}

interface UseActivityFeedReturn {
  activities: Activity[] | null;
  loading: boolean;
  error: string | null;
  markAsRead: (activityId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshFeed: () => Promise<void>;
}

export const useActivityFeed = (): UseActivityFeedReturn => {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await activityService.getActivities();
      setActivities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (activityId: string) => {
    try {
      await activityService.markAsRead(activityId);
      
      // Update local state optimistically
      setActivities(prev => 
        prev?.map(activity => 
          activity.id === activityId 
            ? { ...activity, isRead: true }
            : activity
        ) || null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark activity as read');
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      await activityService.markAllAsRead();
      
      // Update local state optimistically
      setActivities(prev => 
        prev?.map(activity => ({ ...activity, isRead: true })) || null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all activities as read');
      throw err;
    }
  };

  const refreshFeed = async () => {
    await fetchActivities();
  };

  useEffect(() => {
    fetchActivities();
    
    // Set up real-time updates (WebSocket or polling)
    const interval = setInterval(fetchActivities, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return {
    activities,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refreshFeed
  };
};