import { api } from './api';
import { 
  ScheduledPost, 
  RecurringPattern, 
  SchedulingConflict, 
  OptimalTimeRecommendation,
  BulkScheduleItem,
  AudienceInsight,
  ConflictResolution 
} from '../types/scheduling';

class SchedulingService {
  async getScheduledPosts(): Promise<ScheduledPost[]> {
    const response = await api.get('/scheduling/posts');
    return response.data;
  }

  async createScheduledPost(post: Partial<ScheduledPost>): Promise<ScheduledPost> {
    const response = await api.post('/scheduling/posts', post);
    return response.data;
  }

  async updateScheduledPost(id: string, data: Partial<ScheduledPost>): Promise<ScheduledPost> {
    const response = await api.put(`/scheduling/posts/${id}`, data);
    return response.data;
  }

  async deleteScheduledPost(id: string): Promise<void> {
    await api.delete(`/scheduling/posts/${id}`);
  }

  async bulkSchedulePosts(items: BulkScheduleItem[]): Promise<ScheduledPost[]> {
    const response = await api.post('/scheduling/bulk', { items });
    return response.data;
  }

  async getOptimalTimes(platforms: string[]): Promise<OptimalTimeRecommendation[]> {
    const response = await api.post('/scheduling/optimal-times', { platforms });
    return response.data;
  }

  async getAudienceInsights(platforms: string[]): Promise<AudienceInsight[]> {
    const response = await api.post('/scheduling/audience-insights', { platforms });
    return response.data;
  }

  async detectConflicts(newPost: Partial<ScheduledPost>): Promise<SchedulingConflict[]> {
    const response = await api.post('/scheduling/detect-conflicts', newPost);
    return response.data;
  }

  async resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<void> {
    await api.post(`/scheduling/conflicts/${conflictId}/resolve`, resolution);
  }

  async createRecurringPost(post: Partial<ScheduledPost>, pattern: RecurringPattern): Promise<ScheduledPost[]> {
    const response = await api.post('/scheduling/recurring', { post, pattern });
    return response.data;
  }

  async updateRecurringPattern(id: string, pattern: RecurringPattern): Promise<ScheduledPost[]> {
    const response = await api.put(`/scheduling/recurring/${id}`, { pattern });
    return response.data;
  }

  async getCalendarEvents(startDate: Date, endDate: Date): Promise<ScheduledPost[]> {
    const response = await api.get('/scheduling/calendar', {
      params: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
    return response.data;
  }

  async validateBulkSchedule(items: BulkScheduleItem[]): Promise<{ valid: BulkScheduleItem[]; invalid: { item: BulkScheduleItem; errors: string[] }[] }> {
    const response = await api.post('/scheduling/bulk/validate', { items });
    return response.data;
  }
}

export const schedulingService = new SchedulingService();