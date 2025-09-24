import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  SwipeableDrawer,
  useTheme,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isToday, isTomorrow, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { useSwipeable } from 'react-swipeable';
import { useScheduling } from '../../hooks/useScheduling';
import { pushNotificationsService } from '../../services/pushNotifications.service';
import { ScheduledPost } from '../../types/scheduling';

// Use shared ScheduledPost type from ../../types/scheduling

interface CalendarDay {
  date: Date;
  posts: ScheduledPost[];
  isToday: boolean;
  isSelected: boolean;
}

const MobileScheduler: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [calendarWeek, setCalendarWeek] = useState<CalendarDay[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    scheduledTime: new Date(),
    platforms: [] as string[],
  });

  const theme = useTheme();
  const { createScheduledPost, scheduledPosts: hookScheduledPosts, updateScheduledPost, deleteScheduledPost } = useScheduling();

  useEffect(() => {
    loadScheduledPosts();
    generateCalendarWeek();
  }, [selectedDate, hookScheduledPosts]);

  const loadScheduledPosts = async () => {
    try {
      setScheduledPosts(hookScheduledPosts);
    } catch (error) {
      console.error('Failed to load scheduled posts:', error);
    }
  };

  const generateCalendarWeek = () => {
    const weekStart = startOfWeek(selectedDate);
    const weekEnd = endOfWeek(selectedDate);
    const days: CalendarDay[] = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dayPosts = scheduledPosts.filter(post => 
        format(post.scheduledTime, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );

      days.push({
        date,
        posts: dayPosts,
        isToday: isToday(date),
        isSelected: format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'),
      });
    }

    setCalendarWeek(days);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      setSelectedDate(prev => addDays(prev, 1));
    },
    onSwipedRight: () => {
      setSelectedDate(prev => addDays(prev, -1));
    },
    trackMouse: true,
    trackTouch: true,
  });

  const handleSchedulePost = async () => {
    try {
      createScheduledPost({
        ...newPost,
        scheduledTime: newPost.scheduledTime,
      });

      // Schedule notification reminder
      const reminderTime = new Date(newPost.scheduledTime.getTime() - 15 * 60 * 1000); // 15 minutes before
      if (reminderTime > new Date()) {
        pushNotificationsService.sendTargetedNotification({
          title: 'Scheduled Post Reminder',
          body: `Your post "${newPost.title}" will be published in 15 minutes`,
          tag: `reminder-${Date.now()}`,
        });
      }

      setShowNewPostDialog(false);
      setNewPost({
        title: '',
        content: '',
        scheduledTime: new Date(),
        platforms: [],
      });
      
      await loadScheduledPosts();
      
      // Add haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    } catch (error) {
      console.error('Failed to schedule post:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteScheduledPost(postId);
      await loadScheduledPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return theme.palette.primary.main;
      case 'published': return theme.palette.success.main;
      case 'failed': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getPlatformIcon = (platform: string) => {
    // Return appropriate platform icons
    return platform.charAt(0).toUpperCase();
  };

  const renderDateSelector = () => (
    <Box {...swipeHandlers} sx={{ mb: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          {getDateLabel(selectedDate)}
        </Typography>
        <IconButton onClick={() => setShowCalendarView(true)}>
          <CalendarIcon />
        </IconButton>
      </Box>

      <Box display="flex" gap={1} overflow="auto" pb={1}>
        {calendarWeek.map((day, index) => (
          <Card
            key={index}
            onClick={() => setSelectedDate(day.date)}
            sx={{
              minWidth: 60,
              cursor: 'pointer',
              backgroundColor: day.isSelected 
                ? theme.palette.primary.main 
                : day.isToday 
                ? theme.palette.primary.light 
                : 'transparent',
              color: day.isSelected || day.isToday 
                ? theme.palette.primary.contrastText 
                : 'inherit',
              '&:active': {
                transform: 'scale(0.95)',
              },
            }}
          >
            <CardContent sx={{ p: 1, textAlign: 'center' }}>
              <Typography variant="caption" display="block">
                {format(day.date, 'EEE')}
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {format(day.date, 'd')}
              </Typography>
              {day.posts.length > 0 && (
                <Badge
                  badgeContent={day.posts.length}
                  color="secondary"
                  sx={{ mt: 0.5 }}
                >
                  <Box />
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );

  const renderScheduledPosts = () => {
    const todaysPosts = scheduledPosts.filter(post => 
      format(post.scheduledTime, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
    );

    if (todaysPosts.length === 0) {
      return (
        <Card sx={{ textAlign: 'center', py: 4 }}>
          <ScheduleIcon sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            No posts scheduled for {getDateLabel(selectedDate)}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowNewPostDialog(true)}
            sx={{ mt: 2 }}
          >
            Schedule Post
          </Button>
        </Card>
      );
    }

    return (
      <List>
        {todaysPosts.map((post) => (
          <Card key={post.id} sx={{ mb: 1 }}>
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ backgroundColor: getStatusColor(post.status) }}>
                  <ScheduleIcon />
                </Avatar>
              </ListItemAvatar>
              
              <ListItemText
                primary={post.title}
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {format(post.scheduledTime, 'h:mm a')}
                    </Typography>
                    <Box display="flex" gap={0.5} mt={0.5}>
                      {post.platforms.map((platform) => (
                        <Chip
                          key={platform}
                          label={platform}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                }
              />
              
              <ListItemSecondaryAction>
                <Box display="flex" flexDirection="column" gap={0.5}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setNewPost({
                        title: post.title,
                        content: post.content,
                        scheduledTime: post.scheduledTime,
                        platforms: post.platforms,
                      });
                      setShowNewPostDialog(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeletePost(post.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
          </Card>
        ))}
      </List>
    );
  };

  const renderNewPostDialog = () => (
    <Dialog
      fullScreen
      open={showNewPostDialog}
      onClose={() => setShowNewPostDialog(false)}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Schedule New Post</Typography>
          <IconButton onClick={() => setShowNewPostDialog(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              fullWidth
              label="Post Title"
              value={newPost.title}
              onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Content"
              value={newPost.content}
              onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
            />

            <DatePicker
              label="Schedule Date"
              value={newPost.scheduledTime}
              onChange={(date) => date && setNewPost(prev => ({ ...prev, scheduledTime: date }))}
              format="yyyy-MM-dd"
              slotProps={{
                textField: {
                  fullWidth: true,
                  inputProps: { style: { fontSize: 16 } },
                },
              }}
            />

            <TimePicker
              label="Schedule Time"
              value={newPost.scheduledTime}
              onChange={(time) => time && setNewPost(prev => ({ ...prev, scheduledTime: time }))}
              format="HH:mm"
              slotProps={{
                textField: {
                  fullWidth: true,
                  inputProps: { style: { fontSize: 16 } },
                },
              }}
            />

            <Box>
              <Typography variant="body2" gutterBottom>
                Select Platforms
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok'].map((platform) => (
                  <Chip
                    key={platform}
                    label={platform}
                    clickable
                    color={newPost.platforms.includes(platform) ? 'primary' : 'default'}
                    onClick={() => {
                      setNewPost(prev => ({
                        ...prev,
                        platforms: prev.platforms.includes(platform)
                          ? prev.platforms.filter(p => p !== platform)
                          : [...prev.platforms, platform]
                      }));
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </LocalizationProvider>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => setShowNewPostDialog(false)}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSchedulePost}
          disabled={!newPost.title || !newPost.content || newPost.platforms.length === 0}
        >
          Schedule Post
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderNotificationSettings = () => (
    <SwipeableDrawer
      anchor="bottom"
      open={showNotificationSettings}
      onClose={() => setShowNotificationSettings(false)}
      onOpen={() => setShowNotificationSettings(true)}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '60vh',
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 4,
            backgroundColor: theme.palette.grey[300],
            borderRadius: 2,
            mx: 'auto',
            mb: 2,
          }}
        />
        
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Notification Settings
        </Typography>
        
        <List>
          <ListItem>
            <ListItemText
              primary="15 minutes before"
              secondary="Get notified 15 minutes before scheduled posts"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="1 hour before"
              secondary="Get notified 1 hour before scheduled posts"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Daily summary"
              secondary="Daily summary of scheduled posts"
            />
          </ListItem>
        </List>
      </Box>
    </SwipeableDrawer>
  );

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {renderDateSelector()}
      {renderScheduledPosts()}

      {/* Quick Schedule FAB */}
      <Fab
        color="primary"
        aria-label="schedule post"
        onClick={() => setShowNewPostDialog(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <AddIcon />
      </Fab>

      {/* Notification Settings FAB */}
      <Fab
        color="secondary"
        aria-label="notification settings"
        onClick={() => setShowNotificationSettings(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 88,
          zIndex: 1000,
        }}
        size="small"
      >
        <NotificationsIcon />
      </Fab>

      {renderNewPostDialog()}
      {renderNotificationSettings()}
    </Box>
  );
};

export default MobileScheduler;