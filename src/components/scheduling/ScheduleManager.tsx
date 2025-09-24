import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Alert,
} from '@mui/material';
import {
  CalendarMonth,
  Timeline,
  Add,
  Upload,
  Analytics,
  AutoAwesome,
} from '@mui/icons-material';
import { useScheduling, useOptimalTimes } from '../../hooks/useScheduling';
import CalendarView from './CalendarView';
import BulkScheduler from './BulkScheduler';
import OptimalTimeAnalyzer from './OptimalTimeAnalyzer';
import RecurringPostManager from './RecurringPostManager';
import SchedulingConflictResolver from './SchedulingConflictResolver';
import { ScheduledPost } from '../../types/scheduling';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`schedule-tabpanel-${index}`}
      aria-labelledby={`schedule-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ScheduleManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showBulkScheduler, setShowBulkScheduler] = useState(false);
  const [showOptimalAnalyzer, setShowOptimalAnalyzer] = useState(false);
  const [showRecurringManager, setShowRecurringManager] = useState(false);
  const [selectedPlatforms] = useState(['facebook', 'instagram', 'twitter']);

  const { 
    scheduledPosts, 
    isLoading, 
    createScheduledPost,
    updateScheduledPost,
    deleteScheduledPost,
    isCreating 
  } = useScheduling();

  const { data: optimalTimes } = useOptimalTimes(selectedPlatforms);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCreatePost = (postData: Partial<ScheduledPost>) => {
    createScheduledPost(postData);
  };

  const handleUpdatePost = (id: string, data: Partial<ScheduledPost>) => {
    updateScheduledPost({ id, data });
  };

  const handleDeletePost = (id: string) => {
    deleteScheduledPost(id);
  };

  const upcomingPosts = useMemo(() => {
    const now = new Date();
    return scheduledPosts
      .filter(post => new Date(post.scheduledTime) > now && post.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
      .slice(0, 5);
  }, [scheduledPosts]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      total: scheduledPosts.length,
      today: scheduledPosts.filter(post => {
        const postDate = new Date(post.scheduledTime);
        return postDate >= today && postDate < tomorrow && post.status === 'scheduled';
      }).length,
      thisWeek: scheduledPosts.filter(post => {
        const postDate = new Date(post.scheduledTime);
        return postDate >= today && postDate < nextWeek && post.status === 'scheduled';
      }).length,
      published: scheduledPosts.filter(post => post.status === 'published').length,
      failed: scheduledPosts.filter(post => post.status === 'failed').length,
    };
  }, [scheduledPosts]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading schedule...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Paper sx={{ mb: 3, p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            Schedule Manager
          </Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Bulk Schedule">
              <IconButton onClick={() => setShowBulkScheduler(true)}>
                <Upload />
              </IconButton>
            </Tooltip>
            <Tooltip title="Optimal Times">
              <IconButton onClick={() => setShowOptimalAnalyzer(true)}>
                <Analytics />
              </IconButton>
            </Tooltip>
            <Tooltip title="Recurring Posts">
              <IconButton onClick={() => setShowRecurringManager(true)}>
                <AutoAwesome />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleCreatePost({
                title: 'New Post',
                content: '',
                scheduledTime: new Date(),
                platforms: selectedPlatforms,
                status: 'scheduled',
                userId: 'current-user', // This should come from auth context
              })}
              disabled={isCreating}
            >
              Schedule Post
            </Button>
          </Stack>
        </Box>

        {/* Stats */}
        <Stack direction="row" spacing={2}>
          <Chip label={`Total: ${stats.total}`} variant="outlined" />
          <Chip label={`Today: ${stats.today}`} color="primary" />
          <Chip label={`This Week: ${stats.thisWeek}`} color="secondary" />
          <Chip label={`Published: ${stats.published}`} color="success" />
          {stats.failed > 0 && (
            <Chip label={`Failed: ${stats.failed}`} color="error" />
          )}
        </Stack>

        {/* Upcoming Posts Alert */}
        {upcomingPosts.length > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Next {upcomingPosts.length} posts scheduled:
            </Typography>
            {upcomingPosts.map(post => (
              <Typography key={post.id} variant="body2">
                • {post.title} - {new Date(post.scheduledTime).toLocaleString()}
              </Typography>
            ))}
          </Alert>
        )}
      </Paper>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="schedule tabs">
            <Tab
              icon={<CalendarMonth />}
              label="Calendar View"
              id="schedule-tab-0"
              aria-controls="schedule-tabpanel-0"
            />
            <Tab
              icon={<Timeline />}
              label="Timeline View"
              id="schedule-tab-1"
              aria-controls="schedule-tabpanel-1"
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <CalendarView
            scheduledPosts={scheduledPosts}
            onCreatePost={handleCreatePost}
            onUpdatePost={handleUpdatePost}
            onDeletePost={handleDeletePost}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Timeline View
            </Typography>
            <Typography color="text.secondary">
              Timeline view implementation coming soon...
            </Typography>
          </Box>
        </TabPanel>
      </Paper>

      {/* Modals */}
      <BulkScheduler
        open={showBulkScheduler}
        onClose={() => setShowBulkScheduler(false)}
      />

      <OptimalTimeAnalyzer
        open={showOptimalAnalyzer}
        onClose={() => setShowOptimalAnalyzer(false)}
        platforms={selectedPlatforms}
      />

      <RecurringPostManager
        open={showRecurringManager}
        onClose={() => setShowRecurringManager(false)}
      />

      <SchedulingConflictResolver />
    </Box>
  );
};

export default ScheduleManager;