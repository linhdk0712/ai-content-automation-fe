import {
  EmojiEvents as AchievementIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/useUserProfile';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  role: string;
  joinedAt: string;
  lastActive: string;
  stats: {
    contentCreated: number;
    templatesShared: number;
    collaborations: number;
    totalViews: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
  skills: Array<{
    name: string;
    level: number;
  }>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const { profile, updateProfile, changePassword, loading } = useUserProfile();
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    if (profile) {
      setEditedProfile(profile);
    }
  }, [profile]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditToggle = () => {
    if (editMode) {
      setEditedProfile(profile || {});
    }
    setEditMode(!editMode);
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editedProfile);
      setEditMode(false);
      setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update profile', severity: 'error' });
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setEditedProfile({ ...editedProfile, avatar: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSnackbar({ open: true, message: 'Passwords do not match', severity: 'error' });
      return;
    }

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordDialogOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSnackbar({ open: true, message: 'Password changed successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to change password', severity: 'error' });
    }
  };


  if (!profile) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={editMode ? editedProfile.avatar : profile.profilePictureUrl}
                    sx={{ width: 120, height: 120 }}
                  >
                    {(editMode ? editedProfile.name : profile.firstName)?.[0]}
                  </Avatar>
                  {editMode && (
                    <>
                      <input
                        accept="image/*"
                        id="avatar-upload"
                        type="file"
                        onChange={handleAvatarUpload}
                        aria-label="Upload avatar image"
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="avatar-upload">
                        <IconButton
                          component="span"
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            backgroundColor: 'primary.main',
                            color: 'white',
                            '&:hover': { backgroundColor: 'primary.dark' }
                          }}
                        >
                          <PhotoCameraIcon />
                        </IconButton>
                      </label>
                    </>
                  )}
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  {editMode ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        label="Full Name"
                        value={editedProfile.name || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                        fullWidth
                      />
                      <TextField
                        label="Bio"
                        value={editedProfile.bio || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                        multiline
                        rows={2}
                        fullWidth
                      />
                    </Box>
                  ) : (
                    <>
                      <Typography variant="h4" gutterBottom>
                        {profile.firstName}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" gutterBottom>
                        {profile.firstName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip label={profile.roles} color="primary" />
                        <Typography variant="body2" color="text.secondary">
                          Joined {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Last active {profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString() : 'Unknown'}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {editMode ? (
                    <>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveProfile}
                        disabled={loading}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={handleEditToggle}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={handleEditToggle}
                      >
                        Edit Profile
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<SecurityIcon />}
                        onClick={() => setPasswordDialogOpen(true)}
                      >
                        Change Password
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Content Created
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="secondary">
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Templates Shared
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Collaborations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Views
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Detailed Information */}
        <Grid item xs={12}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Activity" icon={<HistoryIcon />} />
                <Tab label="Achievements" icon={<AchievementIcon />} />
                <Tab label="Skills" icon={<TrendingUpIcon />} />
              </Tabs>
            </Box>

            {/* Activity Tab */}
            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <HistoryIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="No recent activity"
                    secondary="Activity will appear here"
                  />
                </ListItem>
              </List>
            </TabPanel>

            {/* Achievements Tab */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Achievements
              </Typography>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No achievements yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Achievements will appear here as you use the platform
                </Typography>
              </Box>
            </TabPanel>

            {/* Skills Tab */}
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>
                Skills & Expertise
              </Typography>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No skills listed
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Skills will appear here when added to your profile
                </Typography>
              </Box>
            </TabPanel>
          </Card>
        </Grid>
      </Grid>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Current Password"
              type={showPasswords.current ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  >
                    {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
            <TextField
              label="New Password"
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  >
                    {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
            <TextField
              label="Confirm New Password"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  >
                    {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePasswordChange} variant="contained">
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

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

export default UserProfile;