import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import {
  Add,
  Delete,
  Edit,
  ExpandMore,
  Facebook,
  Instagram,
  LinkedIn,
  MusicNote,
  Refresh,
  Save,
  Twitter,
  YouTube
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Slider,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface PlatformSetting {
  platform: 'facebook' | 'twitter' | 'instagram' | 'youtube' | 'linkedin' | 'tiktok';
  accountId: number;
  accountName: string;
  isActive: boolean;
  settings: {
    // Publishing Settings
    autoPost: boolean;
    requireApproval: boolean;
    defaultVisibility: 'public' | 'private' | 'friends' | 'followers';
    allowComments: boolean;
    allowSharing: boolean;
    
    // Content Settings
    autoHashtags: boolean;
    maxHashtags: number;
    defaultHashtags: string[];
    autoMentions: boolean;
    watermark: boolean;
    
    // Scheduling Settings
    optimalTiming: boolean;
    timezoneAware: boolean;
    batchPosting: boolean;
    retryFailedPosts: boolean;
    maxRetries: number;
    
    // Analytics Settings
    trackEngagement: boolean;
    trackConversions: boolean;
    trackRevenue: boolean;
    reportFrequency: 'daily' | 'weekly' | 'monthly';
    
    // Notification Settings
    emailNotifications: boolean;
    pushNotifications: boolean;
    notifyOnSuccess: boolean;
    notifyOnFailure: boolean;
    notifyOnMilestones: boolean;
    
    // AI Settings
    aiOptimization: boolean;
    aiHashtagSuggestions: boolean;
    aiContentEnhancement: boolean;
    aiTimingOptimization: boolean;
    
    // Platform-specific settings
    platformSpecific: Record<string, any>;
  };
}

interface PostingRule {
  id: number;
  name: string;
  condition: string;
  action: string;
  isActive: boolean;
  priority: number;
}

const PlatformSettings: React.FC = () => {
  const {
    platformSettings,
    postingRules,
    loading,
    error,
    loadSettings,
    updateSettings,
    createRule,
    updateRule,
    deleteRule  } = usePlatformSettings();

  // State management
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [settings, setSettings] = useState<PlatformSetting | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PostingRule | null>(null);
  const [newRule, setNewRule] = useState({
    name: '',
    condition: '',
    action: '',
    priority: 1
  });

  // Platform configurations
  const platformConfigs = {
    facebook: {
      name: 'Facebook',
      icon: <Facebook />,
      color: '#1877F2',
      features: ['Pages', 'Groups', 'Stories', 'Events'],
      limits: { textLength: 63206, images: 10, videos: 1 }
    },
    twitter: {
      name: 'Twitter',
      icon: <Twitter />,
      color: '#1DA1F2',
      features: ['Tweets', 'Threads', 'Spaces', 'Fleets'],
      limits: { textLength: 280, images: 4, videos: 1 }
    },
    instagram: {
      name: 'Instagram',
      icon: <Instagram />,
      color: '#E4405F',
      features: ['Posts', 'Stories', 'Reels', 'IGTV'],
      limits: { textLength: 2200, images: 10, videos: 1 }
    },
    youtube: {
      name: 'YouTube',
      icon: <YouTube />,
      color: '#FF0000',
      features: ['Videos', 'Shorts', 'Community', 'Live'],
      limits: { textLength: 5000, images: 1, videos: 1 }
    },
    linkedin: {
      name: 'LinkedIn',
      icon: <LinkedIn />,
      color: '#0A66C2',
      features: ['Posts', 'Articles', 'Stories', 'Events'],
      limits: { textLength: 3000, images: 9, videos: 1 }
    },
    tiktok: {
      name: 'TikTok',
      icon: <MusicNote />,
      color: '#000000',
      features: ['Videos', 'Live', 'Stories'],
      limits: { textLength: 150, images: 0, videos: 1 }
    }
  };

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Set selected platform when settings load
  useEffect(() => {
    if (platformSettings.length > 0 && !selectedPlatform) {
      setSelectedPlatform(platformSettings[0].platform);
    }
  }, [platformSettings]);

  // Update settings when platform changes
  useEffect(() => {
    if (selectedPlatform) {
      const platformSetting = platformSettings.find(p => p.platform === selectedPlatform);
      setSettings(platformSetting || null);
      setHasChanges(false);
    }
  }, [selectedPlatform, platformSettings]);

  const handleSettingChange = (path: string, value: any) => {
    if (!settings) return;

    const pathArray = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;

    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    current[pathArray[pathArray.length - 1]] = value;

    setSettings(newSettings);
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    if (!settings || !hasChanges) return;

    setSaving(true);
    try {
      await updateSettings(settings.platform, settings.settings);
      setHasChanges(false);
      loadSettings(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRule = async () => {
    try {
      await createRule({
        ...newRule,
        platform: selectedPlatform
      });
      setRuleDialogOpen(false);
      setNewRule({ name: '', condition: '', action: '', priority: 1 });
      loadSettings();
    } catch (error) {
      console.error('Failed to create rule:', error);
    }
  };

  const handleUpdateRule = async (rule: PostingRule) => {
    try {
      await updateRule(rule.id, rule);
      loadSettings();
    } catch (error) {
      console.error('Failed to update rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      try {
        await deleteRule(ruleId);
        loadSettings();
      } catch (error) {
        console.error('Failed to delete rule:', error);
      }
    }
  };

  const renderPlatformSelector = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Select Platform
        </Typography>
        <Grid container spacing={2}>
          {platformSettings.map((platform) => {
            const config = platformConfigs[platform.platform];
            return (
              <Grid item xs={12} sm={6} md={4} key={platform.platform}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedPlatform === platform.platform ? 2 : 1,
                    borderColor: selectedPlatform === platform.platform ? 'primary.main' : 'divider',
                    '&:hover': { boxShadow: 4 }
                  }}
                  onClick={() => setSelectedPlatform(platform.platform)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: config.color, color: 'white' }}>
                        {config.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {config.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {platform.accountName}
                        </Typography>
                        <Chip 
                          label={platform.isActive ? 'Active' : 'Inactive'} 
                          size="small"
                          color={platform.isActive ? 'success' : 'default'}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderPublishingSettings = () => (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="h6">Publishing Settings</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.settings.autoPost || false}
                  onChange={(e) => handleSettingChange('settings.autoPost', e.target.checked)}
                />
              }
              label="Enable automatic posting"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.settings.requireApproval || false}
                  onChange={(e) => handleSettingChange('settings.requireApproval', e.target.checked)}
                />
              }
              label="Require approval before posting"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Default Visibility</InputLabel>
              <Select
                value={settings?.settings.defaultVisibility || 'public'}
                onChange={(e) => handleSettingChange('settings.defaultVisibility', e.target.value)}
                label="Default Visibility"
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="private">Private</MenuItem>
                <MenuItem value="friends">Friends Only</MenuItem>
                <MenuItem value="followers">Followers Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.settings.allowComments || false}
                  onChange={(e) => handleSettingChange('settings.allowComments', e.target.checked)}
                />
              }
              label="Allow comments"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.settings.allowSharing || false}
                  onChange={(e) => handleSettingChange('settings.allowSharing', e.target.checked)}
                />
              }
              label="Allow sharing"
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  const renderContentSettings = () => (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="h6">Content Settings</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.settings.autoHashtags || false}
                  onChange={(e) => handleSettingChange('settings.autoHashtags', e.target.checked)}
                />
              }
              label="Auto-generate hashtags"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography gutterBottom>
                Max Hashtags: {settings?.settings.maxHashtags || 5}
              </Typography>
              <Slider
                value={settings?.settings.maxHashtags || 5}
                onChange={(_, value) => handleSettingChange('settings.maxHashtags', value)}
                min={0}
                max={30}
                marks={[
                  { value: 0, label: '0' },
                  { value: 10, label: '10' },
                  { value: 20, label: '20' },
                  { value: 30, label: '30' }
                ]}
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Default Hashtags (comma separated)"
              value={settings?.settings.defaultHashtags?.join(', ') || ''}
              onChange={(e) => handleSettingChange('settings.defaultHashtags', e.target.value.split(',').map(tag => tag.trim()))}
              placeholder="#marketing, #socialmedia, #content"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.settings.autoMentions || false}
                  onChange={(e) => handleSettingChange('settings.autoMentions', e.target.checked)}
                />
              }
              label="Auto-detect mentions"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.settings.watermark || false}
                  onChange={(e) => handleSettingChange('settings.watermark', e.target.checked)}
                />
              }
              label="Add watermark to images"
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  const renderSchedulingSettings = () => (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="h6">Scheduling Settings</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.settings.optimalTiming || false}
                  onChange={(e) => handleSettingChange('settings.optimalTiming', e.target.checked)}
                />
              }
              label="Use optimal posting times"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.settings.timezoneAware || false}
                  onChange={(e) => handleSettingChange('settings.timezoneAware', e.target.checked)}
                />
              }
              label="Timezone-aware scheduling"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.settings.batchPosting || false}
                  onChange={(e) => handleSettingChange('settings.batchPosting', e.target.checked)}
                />
              }
              label="Enable batch posting"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.settings.retryFailedPosts || false}
                  onChange={(e) => handleSettingChange('settings.retryFailedPosts', e.target.checked)}
                />
              }
              label="Retry failed posts"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Max Retry Attempts"
              value={settings?.settings.maxRetries || 3}
              onChange={(e) => handleSettingChange('settings.maxRetries', parseInt(e.target.value))}
              inputProps={{ min: 1, max: 10 }}
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  const renderAISettings = () => (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="h6">AI Enhancement Settings</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.settings.aiOptimization || false}
                  onChange={(e) => handleSettingChange('settings.aiOptimization', e.target.checked)}
                />
              }
              label="AI content optimization"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.settings.aiHashtagSuggestions || false}
                  onChange={(e) => handleSettingChange('settings.aiHashtagSuggestions', e.target.checked)}
                />
              }
              label="AI hashtag suggestions"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.settings.aiContentEnhancement || false}
                  onChange={(e) => handleSettingChange('settings.aiContentEnhancement', e.target.checked)}
                />
              }
              label="AI content enhancement"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.settings.aiTimingOptimization || false}
                  onChange={(e) => handleSettingChange('settings.aiTimingOptimization', e.target.checked)}
                />
              }
              label="AI timing optimization"
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  const renderPostingRules = () => (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Posting Rules
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setRuleDialogOpen(true)}
          >
            Add Rule
          </Button>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {postingRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>{rule.name}</TableCell>
                  <TableCell>{rule.condition}</TableCell>
                  <TableCell>{rule.action}</TableCell>
                  <TableCell>{rule.priority}</TableCell>
                  <TableCell>
                    <Chip 
                      label={rule.isActive ? 'Active' : 'Inactive'}
                      color={rule.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => {
                      setEditingRule(rule);
                      setRuleDialogOpen(true);
                    }}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteRule(rule.id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading platform settings...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => loadSettings()}>
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
            Platform Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure posting preferences and automation rules for each platform
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => loadSettings()}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveSettings}
            disabled={!hasChanges || saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      {/* Platform Selector */}
      {renderPlatformSelector()}

      {/* Settings Panels */}
      {settings && (
        <Box>
          {/* Platform Info */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: platformConfigs[settings.platform].color, color: 'white' }}>
                  {platformConfigs[settings.platform].icon}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {platformConfigs[settings.platform].name} Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {settings.accountName}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Features
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {platformConfigs[settings.platform].features.map((feature) => (
                      <Chip key={feature} label={feature} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Text Limit
                  </Typography>
                  <Typography variant="body2">
                    {platformConfigs[settings.platform].limits.textLength} characters
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Image Limit
                  </Typography>
                  <Typography variant="body2">
                    {platformConfigs[settings.platform].limits.images} images
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Video Limit
                  </Typography>
                  <Typography variant="body2">
                    {platformConfigs[settings.platform].limits.videos} video
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Settings Accordions */}
          {renderPublishingSettings()}
          {renderContentSettings()}
          {renderSchedulingSettings()}
          {renderAISettings()}

          {/* Posting Rules */}
          {renderPostingRules()}
        </Box>
      )}

      {/* Rule Dialog */}
      <Dialog 
        open={ruleDialogOpen} 
        onClose={() => {
          setRuleDialogOpen(false);
          setEditingRule(null);
          setNewRule({ name: '', condition: '', action: '', priority: 1 });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingRule ? 'Edit Posting Rule' : 'Create Posting Rule'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rule Name"
                value={editingRule ? editingRule.name : newRule.name}
                onChange={(e) => {
                  if (editingRule) {
                    setEditingRule({ ...editingRule, name: e.target.value });
                  } else {
                    setNewRule({ ...newRule, name: e.target.value });
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Condition"
                placeholder="e.g., content contains 'urgent'"
                value={editingRule ? editingRule.condition : newRule.condition}
                onChange={(e) => {
                  if (editingRule) {
                    setEditingRule({ ...editingRule, condition: e.target.value });
                  } else {
                    setNewRule({ ...newRule, condition: e.target.value });
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Action"
                placeholder="e.g., set priority to high"
                value={editingRule ? editingRule.action : newRule.action}
                onChange={(e) => {
                  if (editingRule) {
                    setEditingRule({ ...editingRule, action: e.target.value });
                  } else {
                    setNewRule({ ...newRule, action: e.target.value });
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Priority"
                value={editingRule ? editingRule.priority : newRule.priority}
                onChange={(e) => {
                  const priority = parseInt(e.target.value);
                  if (editingRule) {
                    setEditingRule({ ...editingRule, priority });
                  } else {
                    setNewRule({ ...newRule, priority });
                  }
                }}
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setRuleDialogOpen(false);
            setEditingRule(null);
            setNewRule({ name: '', condition: '', action: '', priority: 1 });
          }}>
            Cancel
          </Button>
          <Button 
            onClick={editingRule ? () => handleUpdateRule(editingRule) : handleCreateRule}
            variant="contained"
          >
            {editingRule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlatformSettings;