import {
  AccessibilityNew as AccessibilityIcon,
  Edit as EditIcon,
  Facebook as FacebookIcon,
  Google as GoogleIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  YouTube as YouTubeIcon
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
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
import { UserSettingsData, userSettingsService } from '../../services/userSettings.service';
import styles from './UserSettings.module.css';




interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && (
        <Box className={styles.tabPanel}>
          {children}
        </Box>
      )}
    </div>
  );
};

const UserSettings: React.FC = () => {
  const { user } = useAuth();
  const { loading } = useSettings();
  const [tabValue, setTabValue] = useState(0);
  const [localSettings, setLocalSettings] = useState<UserSettingsData | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });



  useEffect(() => {
    loadUserSettings();
  }, []);



  const loadUserSettings = async () => {
    try {
      const userSettings = await userSettingsService.getUserSettings();
      // Ensure profile fields are never null
      if (userSettings.profile) {
        userSettings.profile.name = userSettings.profile.name || '';
        userSettings.profile.email = userSettings.profile.email || '';
        userSettings.profile.bio = userSettings.profile.bio || '';
        userSettings.profile.avatar = userSettings.profile.avatar || '';
        userSettings.profile.timezone = userSettings.profile.timezone || 'Asia/Ho_Chi_Minh';
        userSettings.profile.language = userSettings.profile.language || 'vi';
      }
      setLocalSettings(userSettings);
    } catch (error) {
      console.error('Failed to load user settings:', error);
      // Initialize with default settings if loading fails
      setLocalSettings({
        profile: {
          name: user?.firstName + ' ' + (user?.lastName || ''),
          email: user?.email || '',
          avatar: user?.profilePictureUrl || '',
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
      });
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSave = async () => {
    if (!localSettings) return;

    try {
      await userSettingsService.updateUserSettings(localSettings);
      setSnackbar({
        open: true,
        message: 'Settings saved successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save settings',
        severity: 'error'
      });
    }
  };

  const handleSettingChange = (section: keyof UserSettingsData, field: string, value: any) => {
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
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        handleSettingChange('profile', 'avatar', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConnectSocialAccount = async (platform: string) => {
    try {
      const authUrl = await userSettingsService.getSocialAuthUrl(platform);
      window.open(authUrl, '_blank', 'width=600,height=600');
    } catch (error) {
      console.error(`Failed to connect ${platform}:`, error);
      setSnackbar({
        open: true,
        message: `Failed to connect ${platform}`,
        severity: 'error'
      });
    }
  };

  const handleDisconnectSocialAccount = async (platform: string) => {
    try {
      await userSettingsService.disconnectSocialAccount(platform);
      handleSettingChange('socialAccounts', platform, { connected: false });
      setSnackbar({
        open: true,
        message: `${platform} disconnected successfully`,
        severity: 'success'
      });
    } catch (error) {
      console.error(`Failed to disconnect ${platform}:`, error);
      setSnackbar({
        open: true,
        message: `Failed to disconnect ${platform}`,
        severity: 'error'
      });
    }
  };



  if (!localSettings) {
    return <Box>Loading...</Box>;
  }

  return (
    <>
    <Card className={styles.settingsCard}>
        <Box className={styles.tabsContainer}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable" 
            scrollButtons="auto"
            sx={{
              width: '100%',
              '& .MuiTabs-flexContainer': {
                minWidth: 'fit-content'
              },
              '& .MuiTab-root': {
                minWidth: 120,
                maxWidth: 200
              }
            }}
          >
            <Tab label="Profile" icon={<EditIcon />} />
            <Tab label="Social Accounts" icon={<SettingsIcon />} />
            <Tab label="Notifications" icon={<NotificationsIcon />} />
            <Tab label="Privacy" icon={<SecurityIcon />} />
            <Tab label="Appearance" icon={<PaletteIcon />} />
            <Tab label="Accessibility" icon={<AccessibilityIcon />} />
            <Tab label="Security" icon={<SecurityIcon />} />
          </Tabs>
        </Box>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3} className={styles.gridContainer}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={localSettings.profile.avatar || undefined}
                  sx={{ width: 120, height: 120 }}
                >
                  {(localSettings.profile.name || 'U')[0]}
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
              <Box className={styles.formContainer}>
                <TextField
                  label="Full Name"
                  value={localSettings.profile.name || ''}
                  onChange={(e) => handleSettingChange('profile', 'name', e.target.value)}
                  fullWidth
                  sx={{ maxWidth: '100%' }}
                />
                <TextField
                  label="Email"
                  value={localSettings.profile.email || ''}
                  onChange={(e) => handleSettingChange('profile', 'email', e.target.value)}
                  fullWidth
                  disabled
                  sx={{ maxWidth: '100%' }}
                />
                <TextField
                  label="Bio"
                  value={localSettings.profile.bio || ''}
                  onChange={(e) => handleSettingChange('profile', 'bio', e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  sx={{ maxWidth: '100%' }}
                />
                <FormControl fullWidth sx={{ maxWidth: '100%' }}>
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
                <FormControl fullWidth sx={{ maxWidth: '100%' }}>
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

        {/* Social Accounts Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Connected Social Accounts
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Connect your social media accounts to enable content publishing and management.
          </Typography>

          <Grid container spacing={3} className={styles.socialAccountsGrid}>
            {/* TikTok */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader
                  avatar={<Box sx={{ width: 40, height: 40, bgcolor: 'black', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>TT</Box>}
                  title="TikTok"
                  subheader={localSettings.socialAccounts.tiktok.connected ? `@${localSettings.socialAccounts.tiktok.username || 'Unknown'}` : 'Not connected'}
                />
                <CardContent>
                  {localSettings.socialAccounts.tiktok.connected ? (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDisconnectSocialAccount('tiktok')}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={() => handleConnectSocialAccount('tiktok')}
                    >
                      Connect TikTok
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* YouTube */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader
                  avatar={<YouTubeIcon sx={{ fontSize: 40, color: '#FF0000' }} />}
                  title="YouTube"
                  subheader={localSettings.socialAccounts.youtube.connected ? (localSettings.socialAccounts.youtube.channelName || 'Unknown Channel') : 'Not connected'}
                />
                <CardContent>
                  {localSettings.socialAccounts.youtube.connected ? (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDisconnectSocialAccount('youtube')}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={() => handleConnectSocialAccount('youtube')}
                    >
                      Connect YouTube
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Facebook */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader
                  avatar={<FacebookIcon sx={{ fontSize: 40, color: '#1877F2' }} />}
                  title="Facebook"
                  subheader={localSettings.socialAccounts.facebook.connected ? (localSettings.socialAccounts.facebook.pageName || 'Unknown Page') : 'Not connected'}
                />
                <CardContent>
                  {localSettings.socialAccounts.facebook.connected ? (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDisconnectSocialAccount('facebook')}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={() => handleConnectSocialAccount('facebook')}
                    >
                      Connect Facebook
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Google Drive */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader
                  avatar={<GoogleIcon sx={{ fontSize: 40, color: '#4285F4' }} />}
                  title="Google Drive"
                  subheader={localSettings.socialAccounts.googleDrive.connected ? (localSettings.socialAccounts.googleDrive.email || 'Unknown Email') : 'Not connected'}
                />
                <CardContent>
                  {localSettings.socialAccounts.googleDrive.connected ? (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDisconnectSocialAccount('googleDrive')}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={() => handleConnectSocialAccount('googleDrive')}
                    >
                      Connect Google Drive
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>



        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Notification Preferences
          </Typography>
          <Box className={styles.sectionContainer}>
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
          </Box>
        </TabPanel>

        {/* Privacy Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Privacy Settings
          </Typography>
          <Box className={styles.sectionContainer}>
            <FormControl fullWidth sx={{ maxWidth: '100%' }}>
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
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Appearance Settings
          </Typography>
          <Box className={styles.sectionContainer}>
            <FormControl fullWidth sx={{ maxWidth: '100%' }}>
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
        <TabPanel value={tabValue} index={5}>
          <Typography variant="h6" gutterBottom>
            Accessibility Settings
          </Typography>
          <Box className={styles.sectionContainer}>
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
          </Box>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={6}>
          <Typography variant="h6" gutterBottom>
            Security Settings
          </Typography>
          <Box className={styles.sectionContainer}>
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

          <Box sx={{ mt: 2, width: '100%', maxWidth: '500px' }}>
            <FormControl fullWidth sx={{ maxWidth: '100%' }}>
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
          </Box>
        </TabPanel>

        <Box className={styles.actionButtons}>
          <Button variant="outlined" onClick={loadUserSettings}>
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
    </>
  );
};



export default UserSettings;