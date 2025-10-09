import { api } from './api';

export interface UserSettingsData {
  profile: {
    name: string | null;
    email: string | null;
    avatar: string | null;
    bio: string | null;
    timezone: string | null;
    language: string | null;
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
  socialAccounts: {
    tiktok: {
      connected: boolean;
      username?: string | null;
      accessToken?: string | null;
    };
    youtube: {
      connected: boolean;
      channelName?: string | null;
      accessToken?: string | null;
    };
    facebook: {
      connected: boolean;
      pageName?: string | null;
      accessToken?: string | null;
    };
    googleDrive: {
      connected: boolean;
      email?: string | null;
      accessToken?: string | null;
    };
  };
}

export interface UserListOfValue {
  id?: number;
  listOfValueId: number;
  enabled: boolean;
  listOfValue: {
    id: number;
    category: string;
    value: string;
    label: string;
    displayLabel: string;
    description?: string;
    sortOrder: number;
    active: boolean;
    language: string;
  };
}

class UserSettingsService {
  // User Settings Management
  async getUserSettings(): Promise<UserSettingsData> {
    const response = await api.get('/user/settings');
    return response.data.data || response.data;
  }

  async updateUserSettings(settings: UserSettingsData): Promise<UserSettingsData> {
    const response = await api.put('/user/settings', settings);
    return response.data.data || response.data;
  }

  // Social Account Management
  async getSocialAuthUrl(platform: string): Promise<string> {
    const response = await api.get(`/user/social/${platform}/auth-url`);
    return response.data.data || response.data;
  }

  async connectSocialAccount(platform: string, authCode: string): Promise<void> {
    await api.post(`/user/social/${platform}/connect`, { authCode });
  }

  async disconnectSocialAccount(platform: string): Promise<void> {
    await api.delete(`/user/social/${platform}/disconnect`);
  }

  async getSocialAccounts(): Promise<any> {
    const response = await api.get('/user/social/accounts');
    return response.data.data || response.data;
  }

  // User-specific List of Values
  async getUserListOfValues(category: string, language: string = 'vi'): Promise<UserListOfValue[]> {
    const response = await api.get(`/user/list-of-values/${category}?language=${language}`);
    return response.data.data || response.data;
  }

  async toggleUserListOfValue(listOfValueId: number, enabled: boolean): Promise<UserListOfValue> {
    const response = await api.put(`/user/list-of-values/${listOfValueId}/toggle`, { enabled });
    return response.data.data || response.data;
  }

  async getUserListOfValueCategories(): Promise<string[]> {
    const response = await api.get('/user/list-of-values/categories');
    return response.data.data || response.data;
  }

  // Profile Management
  async updateProfile(profile: UserSettingsData['profile']): Promise<void> {
    await api.put('/user/settings/profile', profile);
  }

  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/user/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data || response.data;
  }

  // Notification Settings
  async updateNotificationSettings(notifications: UserSettingsData['notifications']): Promise<void> {
    await api.put('/user/settings/notifications', notifications);
  }

  // Privacy Settings
  async updatePrivacySettings(privacy: UserSettingsData['privacy']): Promise<void> {
    await api.put('/user/settings/privacy', privacy);
  }

  // Appearance Settings
  async updateAppearanceSettings(appearance: UserSettingsData['appearance']): Promise<void> {
    await api.put('/user/settings/appearance', appearance);
  }

  // Accessibility Settings
  async updateAccessibilitySettings(accessibility: UserSettingsData['accessibility']): Promise<void> {
    await api.put('/user/settings/accessibility', accessibility);
  }

  // Security Settings
  async updateSecuritySettings(security: UserSettingsData['security']): Promise<void> {
    await api.put('/user/settings/security', security);
  }

  async enable2FA(): Promise<{ qrCode: string; backupCodes: string[] }> {
    const response = await api.post('/user/security/2fa/enable');
    return response.data.data || response.data;
  }

  async disable2FA(code: string): Promise<void> {
    await api.post('/user/security/2fa/disable', { code });
  }

  async verify2FA(code: string): Promise<void> {
    await api.post('/user/security/2fa/verify', { code });
  }

  // Data Export/Import
  async exportUserData(): Promise<Blob> {
    const response = await api.get('/user/data/export', {
      responseType: 'blob'
    });
    return response.data;
  }

  async importUserSettings(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('settings', file);

    await api.post('/user/settings/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Account Management
  async deleteAccount(): Promise<void> {
    await api.delete('/user/account');
  }

  async deactivateAccount(): Promise<void> {
    await api.post('/user/account/deactivate');
  }
}

export const userSettingsService = new UserSettingsService();