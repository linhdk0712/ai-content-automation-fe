// PWA Settings Component with Advanced Configuration
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  LinearProgress,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  CloudSync as SyncIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  GetApp as InstallIcon,
  Update as UpdateIcon,
  Delete as DeleteIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { usePWA } from '../../hooks/usePWA';
import { pushNotificationsService } from '../../services/pushNotifications.service';

export const PWASettings: React.FC = () => {
  const { status, actions } = usePWA();
  const [loading, setLoading] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState(
    pushNotificationsService.getPreferences()
  );

  const handleInstallApp = async () => {
    setLoading('install');
    try {
      await actions.installApp();
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleUpdateApp = async () => {
    setLoading('update');
    try {
      await actions.updateApp();
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleSyncNow = async () => {
    setLoading('sync');
    try {
      await actions.syncNow();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setLoading('notifications');
    try {
      if (enabled) {
        await actions.enableNotifications();
      } else {
        await actions.disableNotifications();
      }
    } catch (error) {
      console.error('Notification toggle failed:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleClearData = async () => {
    setLoading('clear');
    try {
      await actions.clearOfflineData();
      setShowClearDialog(false);
    } catch (error) {
      console.error('Clear data failed:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleExportData = async () => {
    setLoading('export');
    try {
      const data = await actions.exportOfflineData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-content-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading('import');
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await actions.importOfflineData(data);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setLoading(null);
      event.target.value = '';
    }
  };

  const handleUpdateNotificationPreferences = async (preferences: any) => {
    try {
      await pushNotificationsService.updatePreferences(preferences);
      setNotificationPreferences(preferences);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  };

  const getConnectionStatusColor = () => {
    if (status.isOnline) return 'success';
    return 'error';
  };

  const getStorageStatusColor = () => {
    if (status.storageUsage.percentage < 70) return 'success';
    if (status.storageUsage.percentage < 90) return 'warning';
    return 'error';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        PWA Settings
      </Typography>

      {/* App Status */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="App Status" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Chip
                  icon={status.isOnline ? <CheckIcon /> : <ErrorIcon />}
                  label={status.isOnline ? 'Online' : 'Offline'}
                  color={getConnectionStatusColor()}
                  size="small"
                />
                <Typography variant="body2">Connection Status</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Chip
                  icon={status.isInstalled ? <CheckIcon /> : <InfoIcon />}
                  label={status.isInstalled ? 'Installed' : 'Web Version'}
                  color={status.isInstalled ? 'success' : 'default'}
                  size="small"
                />
                <Typography variant="body2">Installation Status</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Chip
                  icon={status.notificationStatus.subscribed ? <CheckIcon /> : <InfoIcon />}
                  label={status.notificationStatus.subscribed ? 'Enabled' : 'Disabled'}
                  color={status.notificationStatus.subscribed ? 'success' : 'default'}
                  size="small"
                />
                <Typography variant="body2">Notifications</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Chip
                  icon={status.syncStatus.pendingTasks > 0 ? <WarningIcon /> : <CheckIcon />}
                  label={status.syncStatus.pendingTasks > 0 ? 
                    `${status.syncStatus.pendingTasks} Pending` : 'Synced'}
                  color={status.syncStatus.pendingTasks > 0 ? 'warning' : 'success'}
                  size="small"
                />
                <Typography variant="body2">Sync Status</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Installation */}
      {(status.isInstallable || status.hasUpdate) && (
        <Card sx={{ mb: 3 }}>
          <CardHeader title="App Installation" />
          <CardContent>
            <List>
              {status.isInstallable && (
                <ListItem>
                  <ListItemIcon>
                    <InstallIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Install App"
                    secondary="Install for better performance and offline access"
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="contained"
                      onClick={handleInstallApp}
                      disabled={loading === 'install'}
                      startIcon={loading === 'install' ? <CircularProgress size={16} /> : <InstallIcon />}
                    >
                      Install
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              )}

              {status.hasUpdate && (
                <ListItem>
                  <ListItemIcon>
                    <UpdateIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="App Update Available"
                    secondary="A new version is available with improvements and bug fixes"
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleUpdateApp}
                      disabled={loading === 'update'}
                      startIcon={loading === 'update' ? <CircularProgress size={16} /> : <UpdateIcon />}
                    >
                      Update
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Sync Settings */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Sync & Offline" />
        <CardContent>
          <List>
            <ListItem>
              <ListItemIcon>
                <SyncIcon />
              </ListItemIcon>
              <ListItemText
                primary="Sync Now"
                secondary={`${status.syncStatus.pendingTasks} tasks pending sync`}
              />
              <ListItemSecondaryAction>
                <Button
                  variant="outlined"
                  onClick={handleSyncNow}
                  disabled={!status.isOnline || loading === 'sync' || status.syncStatus.isProcessing}
                  startIcon={loading === 'sync' || status.syncStatus.isProcessing ? 
                    <CircularProgress size={16} /> : <SyncIcon />}
                >
                  {status.syncStatus.isProcessing ? 'Syncing...' : 'Sync Now'}
                </Button>
              </ListItemSecondaryAction>
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemIcon>
                <StorageIcon />
              </ListItemIcon>
              <ListItemText
                primary="Storage Usage"
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {formatBytes(status.storageUsage.used)} of {formatBytes(status.storageUsage.quota)} used
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={status.storageUsage.percentage}
                      color={getStorageStatusColor()}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                }
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Notifications" />
        <CardContent>
          <List>
            <ListItem>
              <ListItemIcon>
                <NotificationsIcon />
              </ListItemIcon>
              <ListItemText
                primary="Push Notifications"
                secondary="Receive updates about your content and team activities"
              />
              <ListItemSecondaryAction>
                <FormControlLabel
                  control={
                    <Switch
                      checked={status.notificationStatus.subscribed}
                      onChange={(e) => handleToggleNotifications(e.target.checked)}
                      disabled={!status.notificationStatus.supported || loading === 'notifications'}
                    />
                  }
                  label=""
                />
              </ListItemSecondaryAction>
            </ListItem>

            {status.notificationStatus.subscribed && (
              <>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Notification Categories"
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        {Object.entries(notificationPreferences.categories).map(([key, enabled]) => (
                          <FormControlLabel
                            key={key}
                            control={
                              <Switch
                                checked={enabled}
                                onChange={(e) => handleUpdateNotificationPreferences({
                                  ...notificationPreferences,
                                  categories: {
                                    ...notificationPreferences.categories,
                                    [key]: e.target.checked
                                  }
                                })}
                                size="small"
                              />
                            }
                            label={key.charAt(0).toUpperCase() + key.slice(1)}
                            sx={{ display: 'block', mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    }
                  />
                </ListItem>
              </>
            )}
          </List>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Data Management" />
        <CardContent>
          <List>
            <ListItem>
              <ListItemIcon>
                <ExportIcon />
              </ListItemIcon>
              <ListItemText
                primary="Export Data"
                secondary="Download your offline data as a backup file"
              />
              <ListItemSecondaryAction>
                <Button
                  variant="outlined"
                  onClick={() => setShowExportDialog(true)}
                  disabled={loading === 'export'}
                  startIcon={loading === 'export' ? <CircularProgress size={16} /> : <ExportIcon />}
                >
                  Export
                </Button>
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <ImportIcon />
              </ListItemIcon>
              <ListItemText
                primary="Import Data"
                secondary="Restore data from a backup file"
              />
              <ListItemSecondaryAction>
                <Button
                  variant="outlined"
                  component="label"
                  disabled={loading === 'import'}
                  startIcon={loading === 'import' ? <CircularProgress size={16} /> : <ImportIcon />}
                >
                  Import
                  <input
                    type="file"
                    accept=".json"
                    hidden
                    onChange={handleImportData}
                  />
                </Button>
              </ListItemSecondaryAction>
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemIcon>
                <DeleteIcon color="error" />
              </ListItemIcon>
              <ListItemText
                primary="Clear Offline Data"
                secondary="Remove all cached data and reset the app"
              />
              <ListItemSecondaryAction>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setShowClearDialog(true)}
                  disabled={loading === 'clear'}
                  startIcon={loading === 'clear' ? <CircularProgress size={16} /> : <DeleteIcon />}
                >
                  Clear Data
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={showClearDialog} onClose={() => setShowClearDialog(false)}>
        <DialogTitle>Clear Offline Data</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will permanently delete all your offline content, drafts, and cached data. 
            This action cannot be undone.
          </Alert>
          <Typography>
            Are you sure you want to clear all offline data?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClearDialog(false)}>Cancel</Button>
          <Button onClick={handleClearData} color="error" variant="contained">
            Clear Data
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Data Confirmation Dialog */}
      <Dialog open={showExportDialog} onClose={() => setShowExportDialog(false)}>
        <DialogTitle>Export Offline Data</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            This will download a JSON file containing all your offline data including:
          </Typography>
          <List dense>
            <ListItem>• Content drafts and saved work</ListItem>
            <ListItem>• Cached analytics data</ListItem>
            <ListItem>• Pending sync tasks</ListItem>
            <ListItem>• Performance metrics</ListItem>
          </List>
          <Alert severity="info" sx={{ mt: 2 }}>
            The exported file can be used to restore your data later using the Import function.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
          <Button onClick={handleExportData} variant="contained">
            Export Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};