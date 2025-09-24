import { useEffect, useState } from 'react';
import { authService, UserProfile } from '../services/auth.service';


interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useUserProfile = (): UseUserProfileReturn => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.getCurrentUser();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setLoading(true);
      const updatedProfile = await authService.updateProfile({
        firstName: updates.firstName || '',
        lastName: updates.lastName || '',
        phoneNumber: updates.phoneNumber || '',
        timezone: updates.timezone || '',
        language: updates.language || ''
      });
      setProfile(updatedProfile.data as UserProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      await authService.changePassword({ currentPassword, newPassword });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    updateProfile,
    changePassword,
    refreshProfile
  };
};