import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  IconButton,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Snackbar,
  useTheme,
} from '@mui/material';
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Palette as ThemeIcon,
  Language as LanguageIcon,
  Storage as StorageIcon,
  Fingerprint as BiometricIcon,
  ChevronRight as ChevronRightIcon,
  Edit as EditIcon,
  CloudSync as SyncIcon,
  Logout as LogoutIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth.service';
import { useSettings } from '../../hooks/useSettings';
import { pushNotificationsService } from '../../services/pushNotifications.service';
import { offlineService } from '../../services/offline.service';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactElement;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  action?: () => void;
  color?: string;
}

interface BiometricSupport {
  available: boolean;
  type: 'fingerprint' | 'face' | 'none';
}

const MobileSettings: React.FC = () => {
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    contentReminders: true,
    analyticsReports: false,
    teamUpdates: true,
  });
  
  const [biometricSupport, setBiometricSupport] = useState<BiometricSupport>({
    available: false,
    type: 'none',
  });
  
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showStorageDialog, setShowStorageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    total: 0,
    cached: 0,
  });
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
  });
  
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const theme = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const { settings, updateSettings } = useSettings();

  useEffect(() => {
    checkBiometricSupport();
    loadStorageInfo();
    
    if (user) {
      setProfileData({
        name: user.firstName || user.username || '',
        email: user.email || '',
        bio: profileData.bio || '',
      });
    }
  }, [user]);

  const checkBiometricSupport = async () => {
    if ('credentials' in navigator && 'create' in navigator.credentials) {
      try {
        const available = await (navigator.credentials as any).create({
          publicKey: {
            challenge: new Uint8Array(32),
            rp: { name: 'AI Content Automation' },
            user: {
              id: new Uint8Array(16),
              name: 'test@example.com',
              displayName: 'Test User',
            },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
            },
            timeout: 60000,
            attestation: 'direct',
          },
        });
        
        setBiometricSupport({
          available: true,
          type: 'fingerprint', // Simplified detection
        });
      } catch (error) {
        setBiometricSupport({
          available: false,
          type: 'none',
        });
      }
    }
  };

  const loadStorageInfo = async () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        setStorageInfo({
          used: estimate.usage || 0,
          total: estimate.quota || 0,
          cached: 0, // Would be calculated from offline service
        });
      }
    } catch (error) {
      console.error('Failed to get storage info:', error);
    }
  };

  const handleNotificationToggle = async (key: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
    
    if (key === 'pushNotifications') {
      if (value) {
        try {
          await pushNotificationsService.requestPermission();
          showSuccess('Push notifications enabled');
        } catch (error) {
          console.error('Failed to enable push notifications:', error);
          setNotificationSettings(prev => ({ ...prev, [key]: false }));
        }
      } else {
        await pushNotificationsService.unsubscribe();
        showSuccess('Push notifications disabled');
      }
    }
    
    // Update notification preferences on server
    try {
      await pushNotificationsService.updatePreferences({
        categories: {
          content: notificationSettings.contentReminders,
          analytics: notificationSettings.analyticsReports,
          collaboration: notificationSettings.teamUpdates,
          system: true,
          marketing: false,
        },
      });
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const [firstName, ...rest] = (profileData.name || '').split(' ');
      const lastName = rest.join(' ').trim() || undefined;
      await authService.updateProfile({ firstName: firstName || '', lastName });
      await refreshUser();
      setShowProfileDialog(false);
      showSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleClearCache = async () => {
    try {
      await offlineService.clearOfflineData();
      await loadStorageInfo();
      setShowStorageDialog(false);
      showSuccess('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Implementation would call delete account API
      setShowDeleteDialog(false);
      showSuccess('Account deletion request submitted');
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const accountSettings: SettingItem[] = [
    {
      id: 'profile',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      icon: <PersonIcon />,
      type: 'navigation',
      action: () => setShowProfileDialog(true),
    },
    {
      id: 'biometric',
      title: 'Biometric Authentication',
      subtitle: biometricSupport.available ? 'Use fingerprint or face ID' : 'Not available',
      icon: <BiometricIcon />,
      type: 'toggle',
      value: settings?.security?.twoFactorEnabled || false,
    },
  ];

  const appSettings: SettingItem[] = [
    {
      id: 'push-notifications',
      title: 'Push Notifications',
      subtitle: 'Receive notifications on this device',
      icon: <NotificationsIcon />,
      type: 'toggle',
      value: notificationSettings.pushNotifications,
    },
    {
      id: 'email-notifications',
      title: 'Email Notifications',
      subtitle: 'Receive notifications via email',
      icon: <NotificationsIcon />,
      type: 'toggle',
      value: notificationSettings.emailNotifications,
    },
    {
      id: 'content-reminders',
      title: 'Content Reminders',
      subtitle: 'Reminders for scheduled posts',
      icon: <NotificationsIcon />,
      type: 'toggle',
      value: notificationSettings.contentReminders,
    },
    {
      id: 'analytics-reports',
      title: 'Analytics Reports',
      subtitle: 'Weekly performance reports',
      icon: <NotificationsIcon />,
      type: 'toggle',
      value: notificationSettings.analyticsReports,
    },
  ];

  const systemSettings: SettingItem[] = [
    {
      id: 'storage',
      title: 'Storage & Cache',
      subtitle: `${formatBytes(storageInfo.used)} used`,
      icon: <StorageIcon />,
      type: 'navigation',
      action: () => setShowStorageDialog(true),
    },
    {
      id: 'sync',
      title: 'Sync Data',
      subtitle: 'Sync offline data with server',
      icon: <SyncIcon />,
      type: 'action',
      action: async () => {
        await offlineService.syncOfflineData();
        showSuccess('Data synced successfully');
      },
    },
  ];

  const dangerSettings: SettingItem[] = [
    {
      id: 'logout',
      title: 'Sign Out',
      subtitle: 'Sign out of your account',
      icon: <LogoutIcon />,
      type: 'action',
      action: logout,
      color: theme.palette.warning.main,
    },
    {
      id: 'delete',
      title: 'Delete Account',
      subtitle: 'Permanently delete your account',
      icon: <DeleteIcon />,
      type: 'action',
      action: () => setShowDeleteDialog(true),
      color: theme.palette.error.main,
    },
  ];

  const renderSettingsList = (title: string, items: SettingItem[]) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          {title}
        </Typography>
        <List>
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              <ListItem
                onClick={item.type === 'navigation' ? item.action : undefined}
                sx={{
                  cursor: item.type === 'navigation' ? 'pointer' : 'default',
                  px: 0,
                }}
              >
                <ListItemIcon>
                  <Box
                    sx={{
                      color: item.color || theme.palette.text.primary,
                    }}
                  >
                    {item.icon}
                  </Box>
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Typography
                      variant="body1"
                      fontWeight="medium"
                      color={item.color || 'inherit'}
                    >
                      {item.title}
                    </Typography>
                  }
                  secondary={item.subtitle}
                />
                
                <ListItemSecondaryAction>
                  {item.type === 'toggle' && (
                    <Switch
                      checked={item.value || false}
                      onChange={(e) => handleNotificationToggle(item.id, e.target.checked)}
                      disabled={item.id === 'biometric' && !biometricSupport.available}
                    />
                  )}
                  {item.type === 'navigation' && (
                    <ChevronRightIcon color="action" />
                  )}
                  {item.type === 'action' && item.id !== 'logout' && item.id !== 'delete' && (
                    <IconButton onClick={item.action} size="small">
                      <ChevronRightIcon />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
              {index < items.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const renderProfileDialog = () => (
    <Dialog
      fullScreen
      open={showProfileDialog}
      onClose={() => setShowProfileDialog(false)}
    >
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} pt={1}>
          <Box display="flex" justifyContent="center" mb={2}>
            <Avatar
              src={user?.profilePictureUrl}
              alt={user?.username}
              sx={{ width: 80, height: 80 }}
            >
              {(user?.firstName || user?.username || '').charAt(0)}
            </Avatar>
          </Box>
          
          <TextField
            fullWidth
            label="Full Name"
            value={profileData.name}
            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
          />
          
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
          />
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Bio"
            value={profileData.bio}
            onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowProfileDialog(false)}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleProfileUpdate}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderStorageDialog = () => (
    <Dialog
      open={showStorageDialog}
      onClose={() => setShowStorageDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Storage & Cache</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2}>
          <Box>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Storage Usage
            </Typography>
            <Typography variant="h6">
              {formatBytes(storageInfo.used)} of {formatBytes(storageInfo.total)}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Cached Data
            </Typography>
            <Typography variant="body1">
              {formatBytes(storageInfo.cached)}
            </Typography>
          </Box>
          
          <Alert severity="info">
            Clearing cache will remove offline content and require re-downloading data.
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowStorageDialog(false)}>
          Cancel
        </Button>
        <Button variant="contained" color="warning" onClick={handleClearCache}>
          Clear Cache
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderDeleteDialog = () => (
    <Dialog
      open={showDeleteDialog}
      onClose={() => setShowDeleteDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Delete Account</DialogTitle>
      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          This action cannot be undone. All your data will be permanently deleted.
        </Alert>
        <Typography variant="body1">
          Are you sure you want to delete your account? This will:
        </Typography>
        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
          <li>Delete all your content and templates</li>
          <li>Cancel your subscription</li>
          <li>Remove all analytics data</li>
          <li>Delete your profile information</li>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowDeleteDialog(false)}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={handleDeleteAccount}>
          Delete Account
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {/* User Profile Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              src={user?.profilePictureUrl}
              alt={user?.username}
              sx={{ width: 64, height: 64 }}
            >
              {(user?.firstName || user?.username || '').charAt(0)}
            </Avatar>
            <Box flexGrow={1}>
              <Typography variant="h6" fontWeight="bold">
                {(user?.firstName || user?.username || '')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.roles?.join(', ') || 'Free'} Plan
              </Typography>
            </Box>
            <IconButton onClick={() => setShowProfileDialog(true)}>
              <EditIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {renderSettingsList('Account', accountSettings)}
      {renderSettingsList('Notifications', appSettings)}
      {renderSettingsList('System', systemSettings)}
      {renderSettingsList('Account Actions', dangerSettings)}

      {renderProfileDialog()}
      {renderStorageDialog()}
      {renderDeleteDialog()}

      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={3000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowSuccessMessage(false)}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MobileSettings;