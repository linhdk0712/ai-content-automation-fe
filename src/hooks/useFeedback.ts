import { useState } from 'react';

// Mock feedback service until actual service is implemented
const feedbackService = {
  submitFeedback: async (data: any) => {
    console.log('Submitting feedback:', data);
    // Mock implementation
  },
  getFeedbackHistory: async () => {
    console.log('Getting feedback history');
    return [];
  }
};

interface FeedbackData {
  rating: number;
  feedbackType: string;
  message: string;
  tags: string[];
  feature?: string;
  userAgent: string;
  url: string;
}

export const useFeedback = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const submitFeedback = async (feedbackData: FeedbackData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await feedbackService.submitFeedback(feedbackData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getFeedbackHistory = async () => {
    try {
      return await feedbackService.getFeedbackHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feedback history');
      throw err;
    }
  };
  
  return {
    submitFeedback,
    getFeedbackHistory,
    isSubmitting,
    error
  };
};