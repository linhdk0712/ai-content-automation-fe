import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import {
  Add,
  Analytics,
  CheckCircle,
  CloudSync,
  ExpandMore,
  Facebook,
  Instagram,
  Link,
  LinkedIn,
  MoreVert,
  MusicNote,
  Refresh,
  Settings,
  Twitter,
  YouTube
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  ListItemIcon,
  Menu,
  MenuItem as MenuItemComponent,
  MenuList,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface SocialAccount {
  id: number;
  platform: 'facebook' | 'twitter' | 'instagram' | 'youtube' | 'linkedin' | 'tiktok';
  accountName: string;
  username: string;
  profilePicture?: string;
  followerCount: number;
  isConnected: boolean;
  isActive: boolean;
  lastSync: string;
  tokenExpiry: string;
  permissions: string[];
  healthStatus: 'healthy' | 'warning' | 'error';
  healthMessage?: string;
  metadata: {
    accountId: string;
    accountType: 'personal' | 'business' | 'creator';
    verificationStatus: boolean;
    country: string;
    language: string;
    timezone: string;
  };
  settings: {
    autoPost: boolean;
    notifications: boolean;
    analytics: boolean;
    scheduling: boolean;
  };
  stats: {
    postsThisMonth: number;
    engagementRate: number;
    reachThisMonth: number;
    lastPostDate?: string;
  };
}

const SocialAccounts: React.FC = () => {
  const { user } = useAuth();
  const {
    accounts,
    loading,
    error,
    loadAccounts,
    connectAccount,
    disconnectAccount,
    syncAccount,
    refreshToken,
    updateSettings  } = useSocialAccounts();

  // State management
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [refreshing, setRefreshing] = useState<number[]>([]);

  // Platform configurations
  const platformConfigs = {
    facebook: {
      name: 'Facebook',
      icon: <Facebook />,
      color: '#1877F2',
      description: 'Connect your Facebook Page or Profile',
      permissions: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
      features: ['Post Publishing', 'Analytics', 'Scheduling', 'Comments Management']
    },
    instagram: {
      name: 'Instagram',
      icon: <Instagram />,
      color: '#E4405F',
      description: 'Connect your Instagram Business Account',
      permissions: ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement'],
      features: ['Photo/Video Publishing', 'Stories', 'Analytics', 'Hashtag Suggestions']
    },
    twitter: {
      name: 'Twitter',
      icon: <Twitter />,
      color: '#1DA1F2',
      description: 'Connect your Twitter Account',
      permissions: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      features: ['Tweet Publishing', 'Thread Creation', 'Analytics', 'Engagement Tracking']
    },
    youtube: {
      name: 'YouTube',
      icon: <YouTube />,
      color: '#FF0000',
      description: 'Connect your YouTube Channel',
      permissions: ['youtube.upload', 'youtube.readonly', 'youtube.force-ssl'],
      features: ['Video Upload', 'Thumbnail Management', 'Analytics', 'Community Posts']
    },
    linkedin: {
      name: 'LinkedIn',
      icon: <LinkedIn />,
      color: '#0A66C2',
      description: 'Connect your LinkedIn Profile or Company Page',
      permissions: ['w_member_social', 'r_liteprofile', 'r_emailaddress'],
      features: ['Post Publishing', 'Article Publishing', 'Analytics', 'Professional Network']
    },
    tiktok: {
      name: 'TikTok',
      icon: <MusicNote />,
      color: '#000000',
      description: 'Connect your TikTok Account',
      permissions: ['video.upload', 'user.info.basic', 'video.list'],
      features: ['Video Upload', 'Analytics', 'Trending Hashtags', 'Content Discovery']
    }
  };

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const handleConnectAccount = async (platform: string) => {
    try {
      // This would typically redirect to OAuth flow
      const authUrl = await connectAccount(platform);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to connect account:', error);
    }
  };

  const handleDisconnectAccount = async (accountId: number) => {
    if (confirm('Are you sure you want to disconnect this account? This will stop all scheduled posts and remove access to analytics.')) {
      try {
        await disconnectAccount(accountId);
        loadAccounts();
      } catch (error) {
        console.error('Failed to disconnect account:', error);
      }
    }
  };

  const handleRefreshToken = async (accountId: number) => {
    setRefreshing(prev => [...prev, accountId]);
    try {
      await refreshToken(accountId);
      loadAccounts();
    } catch (error) {
      console.error('Failed to refresh token:', error);
    } finally {
      setRefreshing(prev => prev.filter(id => id !== accountId));
    }
  };

  const handleSyncAccount = async (accountId: number) => {
    setRefreshing(prev => [...prev, accountId]);
    try {
      await syncAccount(accountId);
      loadAccounts();
    } catch (error) {
      console.error('Failed to sync account:', error);
    } finally {
      setRefreshing(prev => prev.filter(id => id !== accountId));
    }
  };

  const handleUpdateSettings = async (accountId: number, settings: any) => {
    try {
      await updateSettings(accountId, settings);
      setSettingsDialogOpen(false);
      setSelectedAccount(null);
      loadAccounts();
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, account: SocialAccount) => {
    setAnchorEl(event.currentTarget);
    setSelectedAccount(account);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAccount(null);
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };


  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const renderConnectedAccount = (account: SocialAccount) => {
    const platform = platformConfigs[account.platform];
    const isRefreshing = refreshing.includes(account.id);

    return (
      <Card key={account.id} sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
              <Badge
                color={getHealthStatusColor(account.healthStatus) as any}
                variant="dot"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              >
                <Avatar
                  src={account.profilePicture}
                  sx={{ 
                    width: 56, 
                    height: 56,
                    bgcolor: platform.color,
                    color: 'white'
                  }}
                >
                  {platform.icon}
                </Avatar>
              </Badge>

              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="h6">
                    {account.accountName}
                  </Typography>
                  <Chip 
                    label={platform.name} 
                    size="small" 
                    sx={{ bgcolor: platform.color, color: 'white' }}
                  />
                  {account.metadata.verificationStatus && (
                    <CheckCircle color="primary" fontSize="small" />
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  @{account.username} • {formatNumber(account.followerCount)} followers
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip 
                    label={account.metadata.accountType} 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={account.isActive ? 'Active' : 'Inactive'} 
                    size="small"
                    color={account.isActive ? 'success' : 'default'}
                  />
                  <Chip 
                    label={account.healthStatus} 
                    size="small"
                    color={getHealthStatusColor(account.healthStatus) as any}
                  />
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {account.stats.postsThisMonth}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Posts This Month
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {account.stats.engagementRate.toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Engagement Rate
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {formatNumber(account.stats.reachThisMonth)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Reach This Month
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {account.stats.lastPostDate 
                          ? new Date(account.stats.lastPostDate).toLocaleDateString()
                          : 'Never'
                        }
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Last Post
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {account.healthMessage && (
                  <Alert 
                    severity={account.healthStatus === 'healthy' ? 'success' : account.healthStatus as any}
                    sx={{ mb: 2 }}
                  >
                    {account.healthMessage}
                  </Alert>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Last sync: {new Date(account.lastSync).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Token expires: {new Date(account.tokenExpiry).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <IconButton
                onClick={(e) => handleMenuOpen(e, account)}
                disabled={isRefreshing}
              >
                <MoreVert />
              </IconButton>

              <Tooltip title="Refresh Data">
                <IconButton
                  onClick={() => handleSyncAccount(account.id)}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? <LinearProgress /> : <Refresh />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Account Settings">
                <IconButton
                  onClick={() => {
                    setSelectedAccount(account);
                    setSettingsDialogOpen(true);
                  }}
                >
                  <Settings />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderAvailablePlatforms = () => (
    <Grid container spacing={2}>
      {Object.entries(platformConfigs).map(([key, platform]) => {
        const isConnected = accounts.some(account => account.platform === key);
        
        return (
          <Grid item xs={12} sm={6} md={4} key={key}>
            <Card 
              sx={{ 
                cursor: isConnected ? 'default' : 'pointer',
                opacity: isConnected ? 0.7 : 1,
                '&:hover': isConnected ? {} : { boxShadow: 4 }
              }}
              onClick={() => !isConnected && handleConnectAccount(key)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: platform.color, color: 'white' }}>
                    {platform.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {platform.name}
                    </Typography>
                    {isConnected && (
                      <Chip label="Connected" size="small" color="success" />
                    )}
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {platform.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Features:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {platform.features.slice(0, 2).map((feature) => (
                      <Chip key={feature} label={feature} size="small" variant="outlined" />
                    ))}
                    {platform.features.length > 2 && (
                      <Chip 
                        label={`+${platform.features.length - 2}`} 
                        size="small" 
                        variant="outlined" 
                      />
                    )}
                  </Box>
                </Box>

                {!isConnected && (
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Link />}
                    sx={{ bgcolor: platform.color, '&:hover': { bgcolor: platform.color } }}
                  >
                    Connect {platform.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading social accounts...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => loadAccounts()}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Social Media Accounts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Connect and manage your social media accounts for automated posting
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setConnectDialogOpen(true)}
        >
          Connect Account
        </Button>
      </Box>

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Connected Accounts ({accounts.length})
          </Typography>
          {accounts.map(renderConnectedAccount)}
        </Box>
      )}

      {/* Available Platforms */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Available Platforms
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Connect your social media accounts to start automating your content publishing
        </Typography>
        {renderAvailablePlatforms()}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuList>
          <MenuItemComponent onClick={() => {/* Handle view analytics */}}>
            <ListItemIcon>
              <Analytics fontSize="small" />
            </ListItemIcon>
            View Analytics
          </MenuItemComponent>
          
          <MenuItemComponent onClick={() => selectedAccount && handleRefreshToken(selectedAccount.id)}>
            <ListItemIcon>
              <CloudSync fontSize="small" />
            </ListItemIcon>
            Refresh Token
          </MenuItemComponent>
          
          <MenuItemComponent onClick={() => {
            if (selectedAccount) {
              setSettingsDialogOpen(true);
            }
            handleMenuClose();
          }}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            Account Settings
          </MenuItemComponent>
          
          <Divider />
          
          <MenuItemComponent 
            onClick={() => {
              if (selectedAccount) {
                handleDisconnectAccount(selectedAccount.id);
              }
              handleMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <Link fontSize="small" color="error" />
            </ListItemIcon>
            Disconnect Account
          </MenuItemComponent>
        </MenuList>
      </Menu>

      {/* Connect Account Dialog */}
      <Dialog 
        open={connectDialogOpen} 
        onClose={() => setConnectDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Connect Social Media Account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose a platform to connect. You'll be redirected to authenticate with the platform.
          </Typography>
          {renderAvailablePlatforms()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConnectDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Account Settings Dialog */}
      <Dialog 
        open={settingsDialogOpen} 
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Account Settings - {selectedAccount?.accountName}
        </DialogTitle>
        <DialogContent>
          {selectedAccount && (
            <Box sx={{ mt: 2 }}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Publishing Settings</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedAccount.settings.autoPost}
                        onChange={(e) => setSelectedAccount({
                          ...selectedAccount,
                          settings: { ...selectedAccount.settings, autoPost: e.target.checked }
                        })}
                      />
                    }
                    label="Enable automatic posting"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedAccount.settings.scheduling}
                        onChange={(e) => setSelectedAccount({
                          ...selectedAccount,
                          settings: { ...selectedAccount.settings, scheduling: e.target.checked }
                        })}
                      />
                    }
                    label="Enable post scheduling"
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Notifications</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedAccount.settings.notifications}
                        onChange={(e) => setSelectedAccount({
                          ...selectedAccount,
                          settings: { ...selectedAccount.settings, notifications: e.target.checked }
                        })}
                      />
                    }
                    label="Email notifications"
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Analytics</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedAccount.settings.analytics}
                        onChange={(e) => setSelectedAccount({
                          ...selectedAccount,
                          settings: { ...selectedAccount.settings, analytics: e.target.checked }
                        })}
                      />
                    }
                    label="Collect analytics data"
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Account Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Account ID</TableCell>
                          <TableCell>{selectedAccount.metadata.accountId}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Account Type</TableCell>
                          <TableCell>{selectedAccount.metadata.accountType}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Country</TableCell>
                          <TableCell>{selectedAccount.metadata.country}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Language</TableCell>
                          <TableCell>{selectedAccount.metadata.language}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Timezone</TableCell>
                          <TableCell>{selectedAccount.metadata.timezone}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Permissions</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selectedAccount.permissions.map((permission) => (
                                <Chip key={permission} label={permission} size="small" variant="outlined" />
                              ))}
                            </Box>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => selectedAccount && handleUpdateSettings(selectedAccount.id, selectedAccount.settings)}
            variant="contained"
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SocialAccounts;