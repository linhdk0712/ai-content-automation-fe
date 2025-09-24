import { api } from './api';

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

class SettingsService {
  async getSettings(): Promise<UserSettings> {
    const response = await api.get('/settings');
    return response.data;
  }

  async updateSettings(settings: UserSettings): Promise<UserSettings> {
    const response = await api.put('/settings', settings);
    return response.data;
  }

  async resetSettings(): Promise<UserSettings> {
    const response = await api.post('/settings/reset');
    return response.data;
  }

  async exportSettings(): Promise<Blob> {
    const response = await api.get('/settings/export', {
      responseType: 'blob'
    });
    return response.data;
  }

  async importSettings(file: File): Promise<UserSettings> {
    const formData = new FormData();
    formData.append('settings', file);
    
    const response = await api.post('/settings/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateProfileSettings(profileSettings: UserSettings['profile']): Promise<void> {
    await api.put('/settings/profile', profileSettings);
  }

  async updateNotificationSettings(notificationSettings: UserSettings['notifications']): Promise<void> {
    await api.put('/settings/notifications', notificationSettings);
  }

  async updatePrivacySettings(privacySettings: UserSettings['privacy']): Promise<void> {
    await api.put('/settings/privacy', privacySettings);
  }

  async updateAppearanceSettings(appearanceSettings: UserSettings['appearance']): Promise<void> {
    await api.put('/settings/appearance', appearanceSettings);
  }

  async updateAccessibilitySettings(accessibilitySettings: UserSettings['accessibility']): Promise<void> {
    await api.put('/settings/accessibility', accessibilitySettings);
  }

  async updateSecuritySettings(securitySettings: UserSettings['security']): Promise<void> {
    await api.put('/settings/security', securitySettings);
  }

  async enable2FA(): Promise<{ qrCode: string; backupCodes: string[] }> {
    const response = await api.post('/settings/security/2fa/enable');
    return response.data;
  }

  async disable2FA(code: string): Promise<void> {
    await api.post('/settings/security/2fa/disable', { code });
  }

  async verify2FA(code: string): Promise<void> {
    await api.post('/settings/security/2fa/verify', { code });
  }

  async getConnectedDevices(): Promise<Array<{
    id: string;
    name: string;
    type: string;
    lastActive: string;
    location: string;
    current: boolean;
  }>> {
    const response = await api.get('/settings/security/devices');
    return response.data;
  }

  async revokeDevice(deviceId: string): Promise<void> {
    await api.delete(`/settings/security/devices/${deviceId}`);
  }

  async getLoginHistory(): Promise<Array<{
    id: string;
    timestamp: string;
    ipAddress: string;
    location: string;
    device: string;
    success: boolean;
  }>> {
    const response = await api.get('/settings/security/login-history');
    return response.data;
  }
}

export const settingsService = new SettingsService();