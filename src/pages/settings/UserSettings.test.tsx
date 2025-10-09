import React from 'react';
import { render, screen } from '@testing-library/react';
import UserSettings from './UserSettings';
import test from 'node:test';
import { describe } from 'node:test';

// Mock the hooks and services
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com'
    }
  })
}));

jest.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {},
    updateSettings: jest.fn(),
    loading: false
  })
}));

jest.mock('../../services/userSettings.service', () => ({
  userSettingsService: {
    getUserSettings: jest.fn().mockResolvedValue({
      profile: {
        name: 'Test User',
        email: 'test@example.com',
        avatar: '',
        bio: '',
        timezone: 'Asia/Ho_Chi_Minh',
        language: 'vi'
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        contentUpdates: true,
        teamActivity: true,
        systemAlerts: true,
        marketingEmails: false
      },
      privacy: {
        profileVisibility: 'team',
        showOnlineStatus: true,
        allowMentions: true,
        dataCollection: true
      },
      appearance: {
        theme: 'auto',
        colorScheme: 'default',
        fontSize: 'medium',
        compactMode: false
      },
      accessibility: {
        highContrast: false,
        reducedMotion: false,
        screenReader: false,
        keyboardNavigation: false,
        focusIndicators: false
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeout: 60,
        loginAlerts: true,
        deviceManagement: true
      },
      socialAccounts: {
        tiktok: { connected: false },
        youtube: { connected: false },
        facebook: { connected: false },
        googleDrive: { connected: false }
      }
    }),
    getUserListOfValues: jest.fn().mockResolvedValue([
      {
        id: 1,
        category: 'industry',
        value: 'technology',
        label: 'Technology',
        displayLabel: 'Công nghệ',
        description: 'Technology industry',
        sortOrder: 1,
        active: true,
        language: 'vi'
      }
    ]),
    createUserListOfValue: jest.fn(),
    updateUserListOfValue: jest.fn(),
    deleteUserListOfValue: jest.fn()
  }
}));

describe('UserSettings', () => {
  test('renders user settings tabs including List of Values', async () => {
    render(<UserSettings />);
    
    // Wait for component to load
    await screen.findByText('Profile');
    
    // Check if all tabs are present
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Social Accounts')).toBeInTheDocument();
    expect(screen.getByText('List of Values')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Accessibility')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
  });
});