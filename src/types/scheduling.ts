export interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  scheduledTime: Date;
  platforms: string[];
  status: 'scheduled' | 'published' | 'failed' | 'cancelled';
  contentId?: string;
  userId: string;
  workspaceId?: string;
  recurringPattern?: RecurringPattern;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  dayOfMonth?: number;
  endDate?: Date;
  maxOccurrences?: number;
  exceptions?: Date[];
}

export interface SchedulingConflict {
  id: string;
  existingPost: ScheduledPost;
  newPost: Partial<ScheduledPost>;
  conflictType: 'time_overlap' | 'platform_limit' | 'content_similarity';
  severity: 'low' | 'medium' | 'high';
  suggestions: ConflictResolution[];
}

export interface ConflictResolution {
  type: 'reschedule' | 'merge' | 'replace' | 'ignore';
  description: string;
  newTime?: Date;
  confidence: number;
}

export interface OptimalTimeRecommendation {
  time: Date;
  platform: string;
  score: number;
  reasoning: string;
  audienceSize: number;
  engagementRate: number;
}

export interface BulkScheduleItem {
  title: string;
  content: string;
  scheduledTime: string;
  platforms: string;
  recurringPattern?: string;
  tags?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: ScheduledPost;
  color?: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  conflictCount: number;
}

export interface AudienceInsight {
  platform: string;
  peakHours: number[];
  timezone: string;
  engagementRate: number;
  audienceSize: number;
  demographics: {
    ageGroups: Record<string, number>;
    locations: Record<string, number>;
  };
}