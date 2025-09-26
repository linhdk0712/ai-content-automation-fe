import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';
import { supabaseService } from './supabase.service';

export interface PublishingJob {
  id: string;
  contentId: string;
  platforms: string[];
  status: 'queued' | 'processing' | 'publishing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  startedAt?: number;
  completedAt?: number;
  estimatedCompletion?: number;
  error?: string;
  results: PublishingResult[];
  metadata?: Record<string, any>;
}

export interface PublishingResult {
  platform: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  postId?: string;
  postUrl?: string;
  error?: string;
  publishedAt?: number;
  metrics?: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
  };
}

export interface PublishingProgress {
  jobId: string;
  platform: string;
  stage: 'preparing' | 'uploading' | 'processing' | 'publishing' | 'verifying';
  progress: number;
  message: string;
  timestamp: number;
}

export interface PublishingQueue {
  total: number;
  processing: number;
  completed: number;
  failed: number;
  estimatedWaitTime: number;
}

export class PublishingStatusService extends BrowserEventEmitter {
  private jobs: Map<string, PublishingJob> = new Map();
  private progressUpdates: Map<string, PublishingProgress[]> = new Map();
  private queueStatus: PublishingQueue = {
    total: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    estimatedWaitTime: 0
  };

  constructor() {
    super();
    this.setupSupabaseListeners();
  }

  private setupSupabaseListeners(): void {
    supabaseService.on('authStateChanged', ({ user }) => {
      if (user) {
        this.subscribeToPublishingUpdates();
      }
    });
  }

  private subscribeToPublishingUpdates(): void {
    // Subscribe to publishing jobs table
    supabaseService.subscribeToTable('publishing_jobs', (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        this.handlePublishingStatusUpdate(payload.new);
      }
    });

    // Subscribe to publishing progress table
    supabaseService.subscribeToTable('publishing_progress', (payload) => {
      if (payload.eventType === 'INSERT') {
        this.handleProgressUpdate(payload.new);
      }
    });
  }

  private handlePublishingStatusUpdate(data: any): void {
    const job: PublishingJob = {
      id: data.id,
      contentId: data.contentId,
      platforms: data.platforms,
      status: data.status,
      progress: data.progress || 0,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      estimatedCompletion: data.estimatedCompletion,
      error: data.error,
      results: data.results || [],
      metadata: data.metadata
    };

    const existingJob = this.jobs.get(job.id);
    this.jobs.set(job.id, job);

    // Emit specific events based on status changes
    if (!existingJob || existingJob.status !== job.status) {
      this.emit('jobStatusChanged', job);
      
      switch (job.status) {
        case 'processing':
          this.emit('jobStarted', job);
          break;
        case 'completed':
          this.emit('jobCompleted', job);
          break;
        case 'failed':
          this.emit('jobFailed', job);
          break;
        case 'cancelled':
          this.emit('jobCancelled', job);
          break;
      }
    }

    // Emit progress updates
    if (!existingJob || existingJob.progress !== job.progress) {
      this.emit('jobProgress', job);
    }

    this.emit('jobUpdated', job);
  }

  private handleProgressUpdate(progress: PublishingProgress): void {
    const jobProgress = this.progressUpdates.get(progress.jobId) || [];
    jobProgress.push(progress);
    
    // Keep only last 50 progress updates per job
    if (jobProgress.length > 50) {
      jobProgress.splice(0, jobProgress.length - 50);
    }
    
    this.progressUpdates.set(progress.jobId, jobProgress);
    
    // Update job progress
    const job = this.jobs.get(progress.jobId);
    if (job) {
      job.progress = progress.progress;
      this.emit('progressUpdate', progress);
    }
  }

  private handleQueueUpdate(queue: PublishingQueue): void {
    this.queueStatus = queue;
    this.emit('queueUpdated', queue);
  }

  private async loadActiveJobs(): Promise<void> {
    try {
      const jobs = await supabaseService.select('publishing_jobs', {
        filter: { status: 'processing' },
        order: { column: 'created_at', ascending: false }
      });

      if (jobs) {
        jobs.forEach(job => this.handlePublishingStatusUpdate(job));
      }
    } catch (error) {
      console.error('Failed to load active jobs:', error);
    }
  }

  async startPublishing(contentId: string, platforms: string[], options?: {
    scheduledTime?: number;
    priority?: 'low' | 'normal' | 'high';
    metadata?: Record<string, any>;
  }): Promise<string> {
    try {
      const jobData = {
        content_id: contentId,
        platforms: platforms,
        status: 'queued' as const,
        progress: 0,
        scheduled_time: options?.scheduledTime ? new Date(options.scheduledTime).toISOString() : null,
        priority: options?.priority || 'normal',
        metadata: options?.metadata || {},
        user_id: supabaseService.user?.id
      };

      const job = await supabaseService.insert('publishing_jobs', jobData);
      return job.id;
    } catch (error) {
      console.error('Failed to start publishing:', error);
      throw error;
    }
  }

  async cancelPublishing(jobId: string): Promise<void> {
    try {
      await supabaseService.update('publishing_jobs', jobId, {
        status: 'cancelled',
        completed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cancel publishing:', error);
      throw error;
    }
  }

  async retryPublishing(jobId: string, platforms?: string[]): Promise<void> {
    try {
      const updateData: any = {
        status: 'queued',
        progress: 0,
        error: null,
        started_at: null,
        completed_at: null
      };

      if (platforms) {
        updateData.platforms = platforms;
      }

      await supabaseService.update('publishing_jobs', jobId, updateData);
    } catch (error) {
      console.error('Failed to retry publishing:', error);
      throw error;
    }
  }

  getJob(jobId: string): PublishingJob | undefined {
    return this.jobs.get(jobId);
  }

  getJobs(filter?: {
    contentId?: string;
    status?: PublishingJob['status'];
    platform?: string;
    limit?: number;
  }): PublishingJob[] {
    let jobs = Array.from(this.jobs.values());

    if (filter) {
      if (filter.contentId) {
        jobs = jobs.filter(job => job.contentId === filter.contentId);
      }
      if (filter.status) {
        jobs = jobs.filter(job => job.status === filter.status);
      }
      if (filter.platform) {
        jobs = jobs.filter(job => job.platforms.includes(filter.platform!));
      }
      if (filter.limit) {
        jobs = jobs.slice(0, filter.limit);
      }
    }

    return jobs.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
  }

  getActiveJobs(): PublishingJob[] {
    return this.getJobs({
      status: 'processing'
    }).concat(this.getJobs({
      status: 'queued'
    }));
  }

  getJobProgress(jobId: string): PublishingProgress[] {
    return this.progressUpdates.get(jobId) || [];
  }

  getLatestProgress(jobId: string): PublishingProgress | undefined {
    const progress = this.progressUpdates.get(jobId);
    return progress && progress.length > 0 ? progress[progress.length - 1] : undefined;
  }

  getQueueStatus(): PublishingQueue {
    return this.queueStatus;
  }

  getJobsByContent(contentId: string): PublishingJob[] {
    return this.getJobs({ contentId });
  }

  getJobsByPlatform(platform: string): PublishingJob[] {
    return this.getJobs({ platform });
  }

  getJobStatistics(timeRange?: number): {
    total: number;
    completed: number;
    failed: number;
    cancelled: number;
    successRate: number;
    averageTime: number;
    platformStats: Record<string, {
      total: number;
      success: number;
      failed: number;
      successRate: number;
    }>;
  } {
    const cutoff = timeRange ? Date.now() - timeRange : 0;
    const jobs = Array.from(this.jobs.values())
      .filter(job => (job.startedAt || 0) >= cutoff);

    const total = jobs.length;
    const completed = jobs.filter(job => job.status === 'completed').length;
    const failed = jobs.filter(job => job.status === 'failed').length;
    const cancelled = jobs.filter(job => job.status === 'cancelled').length;
    const successRate = total > 0 ? (completed / total) * 100 : 0;

    // Calculate average completion time
    const completedJobs = jobs.filter(job => 
      job.status === 'completed' && job.startedAt && job.completedAt
    );
    const averageTime = completedJobs.length > 0 
      ? completedJobs.reduce((sum, job) => 
          sum + (job.completedAt! - job.startedAt!), 0
        ) / completedJobs.length
      : 0;

    // Platform statistics
    const platformStats: Record<string, any> = {};
    jobs.forEach(job => {
      job.platforms.forEach(platform => {
        if (!platformStats[platform]) {
          platformStats[platform] = { total: 0, success: 0, failed: 0, successRate: 0 };
        }
        platformStats[platform].total++;
        
        const platformResult = job.results.find(r => r.platform === platform);
        if (platformResult) {
          if (platformResult.status === 'success') {
            platformStats[platform].success++;
          } else if (platformResult.status === 'failed') {
            platformStats[platform].failed++;
          }
        }
      });
    });

    // Calculate success rates for platforms
    Object.keys(platformStats).forEach(platform => {
      const stats = platformStats[platform];
      stats.successRate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
    });

    return {
      total,
      completed,
      failed,
      cancelled,
      successRate,
      averageTime,
      platformStats
    };
  }

  subscribeToJob(jobId: string): string | null {
    return supabaseService.subscribeToTable('publishing_jobs', (payload) => {
      if (payload.new?.id === jobId) {
        this.handlePublishingStatusUpdate(payload.new);
      }
    }, `id=eq.${jobId}`);
  }

  unsubscribeFromJob(channelName: string): void {
    supabaseService.unsubscribe(channelName);
  }

  subscribeToContent(contentId: string): string | null {
    return supabaseService.subscribeToTable('publishing_jobs', (payload) => {
      if (payload.new?.content_id === contentId) {
        this.handlePublishingStatusUpdate(payload.new);
      }
    }, `content_id=eq.${contentId}`);
  }

  unsubscribeFromContent(channelName: string): void {
    supabaseService.unsubscribe(channelName);
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clearCompletedJobs(olderThan?: number): void {
    const cutoff = olderThan || (Date.now() - 24 * 60 * 60 * 1000); // 24 hours default
    
    const jobsToRemove: string[] = [];
    this.jobs.forEach((job, jobId) => {
      if ((job.status === 'completed' || job.status === 'failed') && 
          (job.completedAt || 0) < cutoff) {
        jobsToRemove.push(jobId);
      }
    });

    jobsToRemove.forEach(jobId => {
      this.jobs.delete(jobId);
      this.progressUpdates.delete(jobId);
    });

    if (jobsToRemove.length > 0) {
      this.emit('jobsCleared', jobsToRemove);
    }
  }
}

export const publishingStatusService = new PublishingStatusService();