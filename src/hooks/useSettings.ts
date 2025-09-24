import { useState, useEffect } from 'react';
import { settingsService } from '../services/settings.service';

interface UserSettings {
  profile: {
    name: string;
    email: string;
    avatar: string;
    bio: string;
    timezone: string;
    language: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    contentUpdates: boolean;
    teamActivity: boolean;
    systemAlerts: boolean;
    marketingEmails: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'team' | 'private';
    showOnlineStatus: boolean;
    allowMentions: boolean;
    dataCollection: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    colorScheme: 'default' | 'blue' | 'green' | 'purple';
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
    focusIndicators: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    loginAlerts: boolean;
    deviceManagement: boolean;
  };
}

interface UseSettingsReturn {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (settings: UserSettings) => Promise<void>;
  resetSettings: () => Promise<void>;
  exportSettings: () => Promise<Blob>;
  importSettings: (file: File) => Promise<void>;
}

export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: UserSettings) => {
    try {
      setLoading(true);
      const updatedSettings = await settingsService.updateSettings(newSettings);
      setSettings(updatedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = async () => {
    try {
      setLoading(true);
      const defaultSettings = await settingsService.resetSettings();
      setSettings(defaultSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exportSettings = async (): Promise<Blob> => {
    try {
      return await settingsService.exportSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export settings');
      throw err;
    }
  };

  const importSettings = async (file: File) => {
    try {
      setLoading(true);
      const importedSettings = await settingsService.importSettings(file);
      setSettings(importedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings
  };
};