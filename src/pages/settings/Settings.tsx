import {
  AccessibilityNew as AccessibilityIcon,
  Edit as EditIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';

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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { settings, updateSettings, loading } = useSettings();
  const [tabValue, setTabValue] = useState(0);
  const [localSettings, setLocalSettings] = useState<UserSettings | null>(null);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSave = async () => {
    if (!localSettings) return;
    
    try {
      await updateSettings(localSettings);
      setSnackbar({ open: true, message: 'Settings saved successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
    }
  };

  const handleSettingChange = (section: keyof UserSettings, field: string, value: any) => {
    if (!localSettings) return;
    
    setLocalSettings({
      ...localSettings,
      [section]: {
        ...localSettings[section],
        [field]: value
      }
    });
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you'd upload the file to a server
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        handleSettingChange('profile', 'avatar', result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!localSettings) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Profile" icon={<EditIcon />} />
            <Tab label="Notifications" icon={<NotificationsIcon />} />
            <Tab label="Privacy" icon={<SecurityIcon />} />
            <Tab label="Appearance" icon={<PaletteIcon />} />
            <Tab label="Accessibility" icon={<AccessibilityIcon />} />
            <Tab label="Security" icon={<SecurityIcon />} />
          </Tabs>
        </Box>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={localSettings.profile.avatar}
                  sx={{ width: 120, height: 120 }}
                >
                  {localSettings.profile.name[0]}
                </Avatar>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="avatar-upload"
                  type="file"
                  onChange={handleAvatarUpload}
                  aria-label="Upload avatar image"
                />
                <label htmlFor="avatar-upload">
                  <IconButton color="primary" component="span">
                    <PhotoCameraIcon />
                  </IconButton>
                </label>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Full Name"
                  value={localSettings.profile.name}
                  onChange={(e) => handleSettingChange('profile', 'name', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Email"
                  value={localSettings.profile.email}
                  onChange={(e) => handleSettingChange('profile', 'email', e.target.value)}
                  fullWidth
                  disabled
                />
                <TextField
                  label="Bio"
                  value={localSettings.profile.bio}
                  onChange={(e) => handleSettingChange('profile', 'bio', e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={localSettings.profile.timezone}
                    onChange={(e) => handleSettingChange('profile', 'timezone', e.target.value)}
                    label="Timezone"
                  >
                    <MenuItem value="UTC">UTC</MenuItem>
                    <MenuItem value="America/New_York">Eastern Time</MenuItem>
                    <MenuItem value="America/Chicago">Central Time</MenuItem>
                    <MenuItem value="America/Denver">Mountain Time</MenuItem>
                    <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                    <MenuItem value="Asia/Ho_Chi_Minh">Vietnam Time</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={localSettings.profile.language}
                    onChange={(e) => handleSettingChange('profile', 'language', e.target.value)}
                    label="Language"
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="vi">Tiếng Việt</MenuItem>
                    <MenuItem value="zh">中文</MenuItem>
                    <MenuItem value="ja">日本語</MenuItem>
                    <MenuItem value="ko">한국어</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Notification Preferences
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Email Notifications"
                secondary="Receive notifications via email"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={localSettings.notifications.emailNotifications}
                  onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Push Notifications"
                secondary="Receive browser push notifications"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={localSettings.notifications.pushNotifications}
                  onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText
                primary="SMS Notifications"
                secondary="Receive notifications via SMS"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={localSettings.notifications.smsNotifications}
                  onChange={(e) => handleSettingChange('notifications', 'smsNotifications', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Content Updates"
                secondary="Notifications about content changes and approvals"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={localSettings.notifications.contentUpdates}
                  onChange={(e) => handleSettingChange('notifications', 'contentUpdates', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Team Activity"
                secondary="Notifications about team member activities"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={localSettings.notifications.teamActivity}
                  onChange={(e) => handleSettingChange('notifications', 'teamActivity', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText
                primary="System Alerts"
                secondary="Important system notifications and updates"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={localSettings.notifications.systemAlerts}
                  onChange={(e) => handleSettingChange('notifications', 'systemAlerts', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Marketing Emails"
                secondary="Product updates and promotional content"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={localSettings.notifications.marketingEmails}
                  onChange={(e) => handleSettingChange('notifications', 'marketingEmails', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </TabPanel>

        {/* Privacy Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Privacy Settings
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Profile Visibility</InputLabel>
              <Select
                value={localSettings.privacy.profileVisibility}
                onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                label="Profile Visibility"
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="team">Team Only</MenuItem>
                <MenuItem value="private">Private</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.privacy.showOnlineStatus}
                  onChange={(e) => handleSettingChange('privacy', 'showOnlineStatus', e.target.checked)}
                />
              }
              label="Show online status to team members"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.privacy.allowMentions}
                  onChange={(e) => handleSettingChange('privacy', 'allowMentions', e.target.checked)}
                />
              }
              label="Allow others to mention me in comments"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.privacy.dataCollection}
                  onChange={(e) => handleSettingChange('privacy', 'dataCollection', e.target.checked)}
                />
              }
              label="Allow data collection for analytics and improvements"
            />
          </Box>
        </TabPanel>

        {/* Appearance Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Appearance Settings
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Theme</InputLabel>
              <Select
                value={localSettings.appearance.theme}
                onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                label="Theme"
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="auto">Auto (System)</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Color Scheme</InputLabel>
              <Select
                value={localSettings.appearance.colorScheme}
                onChange={(e) => handleSettingChange('appearance', 'colorScheme', e.target.value)}
                label="Color Scheme"
              >
                <MenuItem value="default">Default</MenuItem>
                <MenuItem value="blue">Blue</MenuItem>
                <MenuItem value="green">Green</MenuItem>
                <MenuItem value="purple">Purple</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Font Size</InputLabel>
              <Select
                value={localSettings.appearance.fontSize}
                onChange={(e) => handleSettingChange('appearance', 'fontSize', e.target.value)}
                label="Font Size"
              >
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="large">Large</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.appearance.compactMode}
                  onChange={(e) => handleSettingChange('appearance', 'compactMode', e.target.checked)}
                />
              }
              label="Compact mode (reduce spacing and padding)"
            />
          </Box>
        </TabPanel>

        {/* Accessibility Tab */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Accessibility Settings
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="High Contrast"
                secondary="Increase contrast for better visibility"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={localSettings.accessibility.highContrast}
                  onChange={(e) => handleSettingChange('accessibility', 'highContrast', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Reduced Motion"
                secondary="Minimize animations and transitions"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={localSettings.accessibility.reducedMotion}
                  onChange={(e) => handleSettingChange('accessibility', 'reducedMotion', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Screen Reader Support"
                secondary="Optimize for screen reader compatibility"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={localSettings.accessibility.screenReader}
                  onChange={(e) => handleSettingChange('accessibility', 'screenReader', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Enhanced Keyboard Navigation"
                secondary="Improve keyboard-only navigation"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={localSettings.accessibility.keyboardNavigation}
                  onChange={(e) => handleSettingChange('accessibility', 'keyboardNavigation', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Focus Indicators"
                secondary="Enhanced visual focus indicators"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={localSettings.accessibility.focusIndicators}
                  onChange={(e) => handleSettingChange('accessibility', 'focusIndicators', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={5}>
          <Typography variant="h6" gutterBottom>
            Security Settings
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Two-Factor Authentication"
                secondary="Add an extra layer of security to your account"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={localSettings.security.twoFactorEnabled}
                  onChange={(e) => handleSettingChange('security', 'twoFactorEnabled', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Login Alerts"
                secondary="Get notified of new login attempts"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={localSettings.security.loginAlerts}
                  onChange={(e) => handleSettingChange('security', 'loginAlerts', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
          
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Session Timeout (minutes)</InputLabel>
              <Select
                value={localSettings.security.sessionTimeout}
                onChange={(e) => handleSettingChange('security', 'sessionTimeout', e.target.value)}
                label="Session Timeout (minutes)"
              >
                <MenuItem value={15}>15 minutes</MenuItem>
                <MenuItem value={30}>30 minutes</MenuItem>
                <MenuItem value={60}>1 hour</MenuItem>
                <MenuItem value={240}>4 hours</MenuItem>
                <MenuItem value={480}>8 hours</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </TabPanel>

        <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={() => setLocalSettings(settings)}>
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={loading}
          >
            Save Settings
          </Button>
        </Box>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;