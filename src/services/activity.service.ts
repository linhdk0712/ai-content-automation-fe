import { api } from './api';

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

interface ActivityFilters {
  types?: string[];
  actorIds?: string[];
  startDate?: string;
  endDate?: string;
  isRead?: boolean;
}

class ActivityService {
  async getActivities(filters?: ActivityFilters): Promise<Activity[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.types) {
        filters.types.forEach(type => params.append('types', type));
      }
      if (filters.actorIds) {
        filters.actorIds.forEach(id => params.append('actorIds', id));
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      if (filters.isRead !== undefined) {
        params.append('isRead', filters.isRead.toString());
      }
    }

    const response = await api.get(`/activity?${params.toString()}`);
    return response.data;
  }

  async markAsRead(activityId: string): Promise<void> {
    await api.put(`/activity/${activityId}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await api.put('/activity/read-all');
  }

  async getUnreadCount(): Promise<number> {
    const response = await api.get('/activity/unread-count');
    return response.data.count;
  }

  async getActivityById(activityId: string): Promise<Activity> {
    const response = await api.get(`/activity/${activityId}`);
    return response.data;
  }

  async deleteActivity(activityId: string): Promise<void> {
    await api.delete(`/activity/${activityId}`);
  }

  async getActivityTypes(): Promise<Array<{
    type: string;
    label: string;
    description: string;
  }>> {
    const response = await api.get('/activity/types');
    return response.data;
  }

  async getUserActivitySummary(userId: string, period: 'day' | 'week' | 'month'): Promise<{
    totalActivities: number;
    activitiesByType: Record<string, number>;
    mostActiveDay: string;
    averageActivitiesPerDay: number;
  }> {
    const response = await api.get(`/activity/users/${userId}/summary?period=${period}`);
    return response.data;
  }

  async getWorkspaceActivitySummary(period: 'day' | 'week' | 'month'): Promise<{
    totalActivities: number;
    activitiesByType: Record<string, number>;
    mostActiveUsers: Array<{
      userId: string;
      userName: string;
      activityCount: number;
    }>;
    activityTrend: Array<{
      date: string;
      count: number;
    }>;
  }> {
    const response = await api.get(`/activity/workspace/summary?period=${period}`);
    return response.data;
  }

  async exportActivities(filters?: ActivityFilters, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    
    if (filters) {
      if (filters.types) {
        filters.types.forEach(type => params.append('types', type));
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
    }

    const response = await api.get(`/activity/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async subscribeToRealTimeUpdates(callback: (activity: Activity) => void): Promise<() => void> {
    // In a real implementation, this would set up WebSocket connection
    // For now, we'll simulate with polling
    const interval = setInterval(async () => {
      try {
        const activities = await this.getActivities({ isRead: false });
        if (activities.length > 0) {
          callback(activities[0]); // Notify about the latest activity
        }
      } catch (error) {
        console.error('Failed to fetch real-time activities:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }
}

export const activityService = new ActivityService();