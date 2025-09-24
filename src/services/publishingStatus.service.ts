import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';
import { webSocketService } from './websocket.service';

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
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners(): void {
    webSocketService.on('publishingStatus', (data: any) => {
      this.handlePublishingStatusUpdate(data);
    });

    webSocketService.on('publishingProgress', (progress: PublishingProgress) => {
      this.handleProgressUpdate(progress);
    });

    webSocketService.on('publishingQueue', (queue: PublishingQueue) => {
      this.handleQueueUpdate(queue);
    });

    webSocketService.on('connected', () => {
      // Request current status for all active jobs
      this.requestActiveJobsStatus();
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

  private requestActiveJobsStatus(): void {
    webSocketService.send({
      type: 'publishing_status_request',
      payload: {
        activeOnly: true
      }
    });
  }

  startPublishing(contentId: string, platforms: string[], options?: {
    scheduledTime?: number;
    priority?: 'low' | 'normal' | 'high';
    metadata?: Record<string, any>;
  }): Promise<string> {
    return new Promise((resolve, reject) => {
      const jobId = this.generateJobId();
      
      webSocketService.send({
        type: 'start_publishing',
        payload: {
          jobId,
          contentId,
          platforms,
          options
        }
      });

      // Wait for job creation confirmation
      const timeout = setTimeout(() => {
        reject(new Error('Publishing job creation timeout'));
      }, 10000);

      const onJobCreated = (job: PublishingJob) => {
        if (job.id === jobId) {
          clearTimeout(timeout);
          this.off('jobUpdated', onJobCreated as any);
          resolve(jobId);
        }
      };

      this.on('jobUpdated', onJobCreated);
    });
  }

  cancelPublishing(jobId: string): void {
    webSocketService.send({
      type: 'cancel_publishing',
      payload: { jobId }
    });
  }

  retryPublishing(jobId: string, platforms?: string[]): void {
    webSocketService.send({
      type: 'retry_publishing',
      payload: { 
        jobId,
        platforms // If specified, retry only these platforms
      }
    });
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

  subscribeToJob(jobId: string): void {
    webSocketService.subscribe(`publishing:${jobId}`);
  }

  unsubscribeFromJob(jobId: string): void {
    webSocketService.unsubscribe(`publishing:${jobId}`);
  }

  subscribeToContent(contentId: string): void {
    webSocketService.subscribe(`publishing:content:${contentId}`);
  }

  unsubscribeFromContent(contentId: string): void {
    webSocketService.unsubscribe(`publishing:content:${contentId}`);
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