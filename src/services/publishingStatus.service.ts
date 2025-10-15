import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';
import { socketService, SocketEventData } from './socket.service';

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
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    // Connect to Socket.IO for real-time publishing updates
    socketService.connect({
      onConnection: () => {
        console.log('Publishing status service connected to Socket.IO');
        this.loadActiveJobs();
      },
      onWorkflowUpdate: (data: SocketEventData) => {
        this.handleWorkflowUpdate(data);
      },
      onExecutionUpdate: (data: SocketEventData) => {
        this.handleExecutionUpdate(data);
      },
      onContentUpdate: (data: SocketEventData) => {
        this.handleContentUpdate(data);
      },
      onError: (error: Error) => {
        console.error('Publishing status Socket.IO error:', error);
      },
      onDisconnect: () => {
        console.warn('Publishing status Socket.IO disconnected');
      }
    });
  }

  private handleWorkflowUpdate(data: SocketEventData): void {
    // Handle workflow-level updates
    if (data.type === 'node_update' && data.contentId) {
      this.handlePublishingStatusUpdate({
        id: data.executionId,
        contentId: data.contentId,
        status: this.mapWorkflowStatusToJobStatus(data.status),
        nodeName: data.nodeName,
        nodeType: data.nodeType,
        result: data.result,
        updatedAt: data.timestamp
      });
    }
  }

  private handleExecutionUpdate(data: SocketEventData): void {
    // Handle execution-specific updates
    this.handlePublishingStatusUpdate({
      id: data.executionId,
      contentId: data.contentId,
      status: this.mapWorkflowStatusToJobStatus(data.status),
      nodeName: data.nodeName,
      nodeType: data.nodeType,
      result: data.result,
      updatedAt: data.timestamp
    });
  }

  private handleContentUpdate(data: SocketEventData): void {
    // Handle content-specific updates
    if (data.contentId) {
      this.handlePublishingStatusUpdate({
        id: data.executionId,
        contentId: data.contentId,
        status: this.mapWorkflowStatusToJobStatus(data.status),
        nodeName: data.nodeName,
        nodeType: data.nodeType,
        result: data.result,
        updatedAt: data.timestamp
      });
    }
  }

  private mapWorkflowStatusToJobStatus(workflowStatus: string): string {
    // Map N8N workflow status to publishing job status
    switch (workflowStatus.toLowerCase()) {
      case 'running':
      case 'waiting':
        return 'processing';
      case 'success':
      case 'completed':
        return 'completed';
      case 'error':
      case 'failed':
        return 'failed';
      case 'canceled':
      case 'cancelled':
        return 'cancelled';
      default:
        return 'processing';
    }
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
      // TODO: Replace with API call to backend
      // const jobs = await api.get('/publishing/jobs?status=processing');
      // jobs.forEach(job => this.handlePublishingStatusUpdate(job));
      console.warn('loadActiveJobs: API integration needed');
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
        metadata: options?.metadata || {}
      };

      // TODO: Replace with API call to backend
      // const job = await api.post('/publishing/jobs', jobData);
      const job = { id: Date.now().toString() }; // Temporary mock
      return job.id;
    } catch (error) {
      console.error('Failed to start publishing:', error);
      throw error;
    }
  }

  async cancelPublishing(jobId: string): Promise<void> {
    try {
      // TODO: Replace with API call to backend
      // await api.patch(`/publishing/jobs/${jobId}`, {
      //   status: 'cancelled',
      //   completed_at: new Date().toISOString()
      // });
      console.warn('cancelPublishing: API integration needed');
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

      // TODO: Replace with API call to backend
      // await api.patch(`/publishing/jobs/${jobId}`, updateData);
      console.warn('retryPublishing: API integration needed');
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

  // Real-time subscriptions using Socket.IO
  subscribeToJob(jobId: string): string | null {
    if (socketService.isConnected()) {
      socketService.joinExecutionRoom(jobId);
      return `execution_${jobId}`;
    }
    console.warn('Socket.IO not connected, cannot subscribe to job');
    return null;
  }

  unsubscribeFromJob(channelName: string): void {
    if (socketService.isConnected()) {
      socketService.leaveRoom(channelName);
    }
  }

  subscribeToContent(contentId: string): string | null {
    if (socketService.isConnected()) {
      socketService.joinContentRoom(contentId);
      return `content_${contentId}`;
    }
    console.warn('Socket.IO not connected, cannot subscribe to content');
    return null;
  }

  unsubscribeFromContent(channelName: string): void {
    if (socketService.isConnected()) {
      socketService.leaveRoom(channelName);
    }
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