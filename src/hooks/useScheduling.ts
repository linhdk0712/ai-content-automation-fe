import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { schedulingService } from '../services/scheduling.service';
import {
  ConflictResolution,
  RecurringPattern,
  ScheduledPost,
  SchedulingConflict
} from '../types/scheduling';

export const useScheduling = () => {
  const queryClient = useQueryClient();

  // Fetch scheduled posts
  const { data: scheduledPosts = [], isLoading } = useQuery({
    queryKey: ['scheduledPosts'],
    queryFn: schedulingService.getScheduledPosts,
  });

  // Create scheduled post
  const createScheduledPostMutation = useMutation({
    mutationFn: schedulingService.createScheduledPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledPosts'] });
    },
  });

  // Update scheduled post
  const updateScheduledPostMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ScheduledPost> }) =>
      schedulingService.updateScheduledPost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledPosts'] });
    },
  });

  // Delete scheduled post
  const deleteScheduledPostMutation = useMutation({
    mutationFn: schedulingService.deleteScheduledPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledPosts'] });
    },
  });

  // Bulk schedule posts
  const bulkScheduleMutation = useMutation({
    mutationFn: schedulingService.bulkSchedulePosts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledPosts'] });
    },
  });

  return {
    scheduledPosts,
    isLoading,
    createScheduledPost: createScheduledPostMutation.mutate,
    updateScheduledPost: updateScheduledPostMutation.mutate,
    deleteScheduledPost: deleteScheduledPostMutation.mutate,
    bulkSchedule: bulkScheduleMutation.mutate,
    isCreating: createScheduledPostMutation.isPending,
    isUpdating: updateScheduledPostMutation.isPending,
    isDeleting: deleteScheduledPostMutation.isPending,
    isBulkScheduling: bulkScheduleMutation.isPending,
  };
};

export const useOptimalTimes = (platforms: string[]) => {
  return useQuery({
    queryKey: ['optimalTimes', platforms],
    queryFn: () => schedulingService.getOptimalTimes(platforms),
    enabled: platforms.length > 0,
  });
};

export const useAudienceInsights = (platforms: string[]) => {
  return useQuery({
    queryKey: ['audienceInsights', platforms],
    queryFn: () => schedulingService.getAudienceInsights(platforms),
    enabled: platforms.length > 0,
  });
};

export const useConflictDetection = () => {
  const [conflicts, setConflicts] = useState<SchedulingConflict[]>([]);

  const detectConflicts = useCallback(async (newPost: Partial<ScheduledPost>) => {
    try {
      const detectedConflicts = await schedulingService.detectConflicts(newPost);
      setConflicts(detectedConflicts);
      return detectedConflicts;
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      return [];
    }
  }, []);

  const resolveConflict = useMutation({
    mutationFn: ({ conflictId, resolution }: { conflictId: string; resolution: ConflictResolution }) =>
      schedulingService.resolveConflict(conflictId, resolution),
    onSuccess: () => {
      setConflicts([]);
    },
  });

  return {
    conflicts,
    detectConflicts,
    resolveConflict: resolveConflict.mutate,
    isResolving: resolveConflict.isPending,
  };
};

export const useRecurringPosts = () => {
  const queryClient = useQueryClient();

  const createRecurringPostMutation = useMutation({
    mutationFn: ({ post, pattern }: { post: Partial<ScheduledPost>; pattern: RecurringPattern }) =>
      schedulingService.createRecurringPost(post, pattern),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledPosts'] });
    },
  });

  const updateRecurringPatternMutation = useMutation({
    mutationFn: ({ id, pattern }: { id: string; pattern: RecurringPattern }) =>
      schedulingService.updateRecurringPattern(id, pattern),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledPosts'] });
    },
  });

  return {
    createRecurringPost: createRecurringPostMutation.mutate,
    updateRecurringPattern: updateRecurringPatternMutation.mutate,
    isCreating: createRecurringPostMutation.isPending,
    isUpdating: updateRecurringPatternMutation.isPending,
  };
};