import { useEffect, useState } from 'react';

// Mock onboarding service until actual service is implemented
const onboardingService = {
  getProgress: async () => ({
    currentStep: 0,
    totalSteps: 5,
    completedSteps: [],
    progress: 0
  }),
  updateProfile: async (profile: any) => {
    console.log('Updating profile:', profile);
  },
  completeStep: async (stepId: string) => ({
    currentStep: 1,
    totalSteps: 5,
    completedSteps: [stepId],
    progress: 20
  }),
  skipOnboarding: async () => {
    console.log('Skipping onboarding');
  },
  resetOnboarding: async () => ({
    currentStep: 0,
    totalSteps: 5,
    completedSteps: [],
    progress: 0
  })
};

interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  progress: number;
}

interface UseOnboardingReturn {
  currentStep: number;
  totalSteps: number;
  progress: number;
  completedSteps: string[];
  loading: boolean;
  error: string | null;
  updateProfile: (profile: any) => Promise<void>;
  completeStep: (stepId: string) => Promise<void>;
  skipOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

export const useOnboarding = (): UseOnboardingReturn => {
  const [onboardingData, setOnboardingData] = useState<OnboardingProgress>({
    currentStep: 0,
    totalSteps: 5,
    completedSteps: [],
    progress: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOnboardingProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await onboardingService.getProgress();
      setOnboardingData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch onboarding progress');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profile: any) => {
    try {
      setLoading(true);
      await onboardingService.updateProfile(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const completeStep = async (stepId: string) => {
    try {
      setLoading(true);
      const updatedProgress = await onboardingService.completeStep(stepId);
      setOnboardingData(updatedProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete step');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const skipOnboarding = async () => {
    try {
      setLoading(true);
      await onboardingService.skipOnboarding();
      // Redirect to main app
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip onboarding');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetOnboarding = async () => {
    try {
      setLoading(true);
      const resetProgress = await onboardingService.resetOnboarding();
      setOnboardingData(resetProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset onboarding');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboardingProgress();
  }, []);

  return {
    currentStep: onboardingData.currentStep,
    totalSteps: onboardingData.totalSteps,
    progress: onboardingData.progress,
    completedSteps: onboardingData.completedSteps,
    loading,
    error,
    updateProfile,
    completeStep,
    skipOnboarding,
    resetOnboarding
  };
};