import { useCallback, useEffect, useRef, useState } from 'react';
import { PublishingJob, PublishingQueue, publishingStatusService } from '../services/publishingStatus.service';

export interface UsePublishingStatusOptions {
  contentId?: string;
  autoSubscribe?: boolean;
  pollInterval?: number;
}

export interface PublishingStatusState {
  jobs: PublishingJob[];
  activeJobs: PublishingJob[];
  queueStatus: PublishingQueue;
  isLoading: boolean;
  error: Error | null;
}

export function usePublishingStatus(options: UsePublishingStatusOptions = {}) {
  const { contentId, autoSubscribe = true, pollInterval = 5000 } = options;
  
  const [state, setState] = useState<PublishingStatusState>({
    jobs: [],
    activeJobs: [],
    queueStatus: {
      total: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      estimatedWaitTime: 0
    },
    isLoading: false,
    error: null
  });

  const contentIdRef = useRef(contentId);
  contentIdRef.current = contentId;

  const startPublishing = useCallback(async (
    publishContentId: string,
    platforms: string[],
    options?: {
      scheduledTime?: number;
      priority?: 'low' | 'normal' | 'high';
      metadata?: Record<string, any>;
    }
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const jobId = await publishingStatusService.startPublishing(publishContentId, platforms, options);
      setState(prev => ({ ...prev, isLoading: false }));
      return jobId;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error as Error 
      }));
      throw error;
    }
  }, []);

  const cancelPublishing = useCallback((jobId: string) => {
    publishingStatusService.cancelPublishing(jobId);
  }, []);

  const retryPublishing = useCallback((jobId: string, platforms?: string[]) => {
    publishingStatusService.retryPublishing(jobId, platforms);
  }, []);

  const getJob = useCallback((jobId: string) => {
    return publishingStatusService.getJob(jobId);
  }, []);

  const getJobProgress = useCallback((jobId: string) => {
    return publishingStatusService.getJobProgress(jobId);
  }, []);

  const getLatestProgress = useCallback((jobId: string) => {
    return publishingStatusService.getLatestProgress(jobId);
  }, []);

  const getJobStatistics = useCallback((timeRange?: number) => {
    return publishingStatusService.getJobStatistics(timeRange);
  }, []);

  const subscribeToJob = useCallback((jobId: string) => {
    publishingStatusService.subscribeToJob(jobId);
  }, []);

  const unsubscribeFromJob = useCallback((jobId: string) => {
    publishingStatusService.unsubscribeFromJob(jobId);
  }, []);

  const refreshData = useCallback(() => {
    try {
      const jobs = contentId 
        ? publishingStatusService.getJobsByContent(contentId)
        : publishingStatusService.getJobs();
      
      const activeJobs = publishingStatusService.getActiveJobs();
      const queueStatus = publishingStatusService.getQueueStatus();

      setState(prev => ({
        ...prev,
        jobs,
        activeJobs,
        queueStatus,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error
      }));
    }
  }, [contentId]);

  useEffect(() => {
    const handleJobUpdated = (job: unknown) => {
      const publishingJob = job as PublishingJob;
      setState(prev => {
        const updatedJobs = prev.jobs.map(j => j.id === publishingJob.id ? publishingJob : j);
        
        // Add job if it doesn't exist and matches our filter
        if (!prev.jobs.find(j => j.id === publishingJob.id)) {
          if (!contentIdRef.current || publishingJob.contentId === contentIdRef.current) {
            updatedJobs.push(publishingJob);
          }
        }

        return {
          ...prev,
          jobs: updatedJobs
        };
      });
    };

    const handleJobStatusChanged = (job: unknown) => {  
      handleJobUpdated(job);
    };

    const handleJobProgress = (job: unknown) => {
      handleJobUpdated(job);
    };

    const handleJobStarted = (job: unknown) => {
      handleJobUpdated(job);
    };

    const handleJobCompleted = (job: unknown) => {
      handleJobUpdated(job);
    };

    const handleJobFailed = (job: unknown) => {
      handleJobUpdated(job);
    };

    const handleJobCancelled = (job: unknown) => {
      handleJobUpdated(job);
    };

    const handleProgressUpdate = () => {
      // Progress updates are handled through job updates
    };

    const handleQueueUpdated = (queue: unknown) => {
      const publishingQueue = queue as PublishingQueue;
      setState(prev => ({
        ...prev,
        queueStatus: publishingQueue
      }));
    };

    publishingStatusService.on('jobUpdated', handleJobUpdated);
    publishingStatusService.on('jobStatusChanged', handleJobStatusChanged);
    publishingStatusService.on('jobProgress', handleJobProgress);
    publishingStatusService.on('jobStarted', handleJobStarted);
    publishingStatusService.on('jobCompleted', handleJobCompleted);
    publishingStatusService.on('jobFailed', handleJobFailed);
    publishingStatusService.on('jobCancelled', handleJobCancelled);
    publishingStatusService.on('progressUpdate', handleProgressUpdate);
    publishingStatusService.on('queueUpdated', handleQueueUpdated);

    // Initial data load
    refreshData();

    // Auto-subscribe to content if specified
    if (autoSubscribe && contentId) {
      publishingStatusService.subscribeToContent(contentId);
    }

    return () => {
      publishingStatusService.off('jobUpdated', handleJobUpdated);
      publishingStatusService.off('jobStatusChanged', handleJobStatusChanged);
      publishingStatusService.off('jobProgress', handleJobProgress);
      publishingStatusService.off('jobStarted', handleJobStarted);
      publishingStatusService.off('jobCompleted', handleJobCompleted);
      publishingStatusService.off('jobFailed', handleJobFailed);
      publishingStatusService.off('jobCancelled', handleJobCancelled);
      publishingStatusService.off('progressUpdate', handleProgressUpdate);
      publishingStatusService.off('queueUpdated', handleQueueUpdated);
      
      // Unsubscribe on cleanup
      if (contentIdRef.current) {
        publishingStatusService.unsubscribeFromContent(contentIdRef.current);
      }
    };
  }, [autoSubscribe, contentId, refreshData]);

  // Set up polling for active jobs
  useEffect(() => {
    if (pollInterval > 0 && state.activeJobs.length > 0) {
      const interval = setInterval(refreshData, pollInterval);
      return () => clearInterval(interval);
    }
  }, [pollInterval, state.activeJobs.length, refreshData]);

  // Update data when contentId changes
  useEffect(() => {
    if (contentId !== contentIdRef.current) {
      refreshData();
      
      if (autoSubscribe) {
        if (contentIdRef.current) {
          publishingStatusService.unsubscribeFromContent(contentIdRef.current);
        }
        if (contentId) {
          publishingStatusService.subscribeToContent(contentId);
        }
      }
    }
  }, [contentId, autoSubscribe, refreshData]);

  return {
    ...state,
    startPublishing,
    cancelPublishing,
    retryPublishing,
    getJob,
    getJobProgress,
    getLatestProgress,
    getJobStatistics,
    subscribeToJob,
    unsubscribeFromJob,
    refreshData
  };
}