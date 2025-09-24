import {
  CreditCard as CreditCardIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { WorkspaceSettings as WorkspaceSettingsType } from '../../services/workspace.service';

const WorkspaceSettings: React.FC = () => {
  const { workspace, updateWorkspace, deleteWorkspace, billingInfo, loading } = useWorkspace('default-workspace');
  const [settings, setSettings] = useState<WorkspaceSettingsType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    if (workspace) {
      setSettings(workspace);
    }
  }, [workspace]);

  const handleSave = async () => {
    if (!settings) return;
    
    try {
      await updateWorkspace(settings);
      setSnackbar({ open: true, message: 'Settings saved successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
    }
  };

  const handleDeleteWorkspace = async () => {
    try {
      await deleteWorkspace();
      setSnackbar({ open: true, message: 'Workspace deleted successfully', severity: 'success' });
      // Redirect to workspace selection or home
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete workspace', severity: 'error' });
    }
    setDeleteDialogOpen(false);
  };

  const handleInputChange = (field: keyof WorkspaceSettingsType, value: any) => {
    if (settings) {
      setSettings({ ...settings, [field]: value });
    }
  };

  if (!settings) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Workspace Settings
      </Typography>

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                General Settings
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Workspace Name"
                  value={settings.workspaceName}
                  onChange={(e) => handleInputChange('workspaceName', e.target.value)}
                  fullWidth
                />
                
                <TextField
                  label="Description"
                  value={settings.workspaceDescription}
                  onChange={(e) => handleInputChange('workspaceDescription', e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                />
                
                <TextField
                  label="Timezone"
                  value={settings.workspaceTimezone}
                  onChange={(e) => handleInputChange('workspaceTimezone', e.target.value)}
                  fullWidth
                />
                
                <TextField
                  label="Language"
                  value={settings.workspaceLanguage}
                  onChange={(e) => handleInputChange('workspaceLanguage', e.target.value)}
                  fullWidth
                />
              </Box>
            </CardContent>
          </Card>

          {/* Collaboration Settings */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Collaboration Settings
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowPublicTemplates}
                      onChange={(e) => handleInputChange('allowPublicTemplates', e.target.checked)}
                    />
                  }
                  label="Allow public template sharing"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.requireApproval}
                      onChange={(e) => handleInputChange('requireApproval', e.target.checked)}
                    />
                  }
                  label="Require approval for content publishing"
                />
                
                <TextField
                  label="Maximum Members"
                  type="number"
                  value={settings.maxMembers}
                  onChange={(e) => handleInputChange('maxMembers', parseInt(e.target.value))}
                  fullWidth
                />
              </Box>
            </CardContent>
          </Card>

          {/* Usage Limits */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Usage Limits
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Storage Limit (GB)"
                  type="number"
                  value={settings.storageLimit}
                  onChange={(e) => handleInputChange('storageLimit', parseInt(e.target.value))}
                  fullWidth
                />
                
                <TextField
                  label="AI Usage Limit (requests/month)"
                  type="number"
                  value={settings.aiUsageLimit}
                  onChange={(e) => handleInputChange('aiUsageLimit', parseInt(e.target.value))}
                  fullWidth
                />
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={loading}
            >
              Save Settings
            </Button>
          </Box>
        </Grid>

        {/* Billing & Subscription */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Billing & Subscription
              </Typography>
              
              {billingInfo && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Current Plan
                    </Typography>
                    <Chip label={billingInfo.subscription.planName} color="primary" />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip 
                      label={billingInfo.subscription.status} 
                      color={billingInfo.subscription.status === 'active' ? 'success' : 'warning'} 
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Next Billing Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(billingInfo.subscription.currentPeriodEnd).toLocaleDateString()}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Amount
                    </Typography>
                    <Typography variant="body1">
                      {billingInfo.amount} {billingInfo.currency}
                    </Typography>
                  </Box>
                  
                  <Button
                    variant="outlined"
                    startIcon={<CreditCardIcon />}
                    fullWidth
                  >
                    Manage Billing
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card sx={{ mt: 3, border: '1px solid', borderColor: 'error.main' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error">
                Danger Zone
              </Typography>
              
              <Alert severity="warning" sx={{ mb: 2 }}>
                Deleting a workspace is permanent and cannot be undone.
              </Alert>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
                fullWidth
              >
                Delete Workspace
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="error" />
            Delete Workspace
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this workspace? This action cannot be undone and will:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• Delete all content and media files" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Remove all team members" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Cancel active subscriptions" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Permanently delete all data" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteWorkspace} color="error" variant="contained">
            Delete Workspace
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

export default WorkspaceSettings;