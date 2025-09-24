import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Chip,
  Button,
  SwipeableDrawer,
  useTheme,
  Badge,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  Analytics as AnalyticsIcon,
  Group as TeamIcon,
  Security as SecurityIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  DoneAll as ReadAllIcon,
} from '@mui/icons-material';
import { format, isToday, isYesterday } from 'date-fns';
import { useSwipeable } from 'react-swipeable';
import { useNotifications } from '../../hooks/useNotifications';
import { pushNotificationsService } from '../../services/pushNotifications.service';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'schedule' | 'analytics' | 'team' | 'security';
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  actions?: NotificationAction[];
  data?: any;
}

interface NotificationAction {
  id: string;
  label: string;
  action: () => void;
  primary?: boolean;
}

const MobileNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'today'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [notificationSettings, setNotificationSettings] = useState({
    pushEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '08:00',
  });

  const theme = useTheme();
  const { 
    notifications: hookNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification
  } = useNotifications();

  useEffect(() => {
    loadNotifications();
  }, [hookNotifications]);

  const loadNotifications = () => {
    // Mock notifications for demo
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Content Published Successfully',
        message: 'Your Instagram post "Summer Marketing Tips" has been published.',
        type: 'success',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        actionable: true,
        actions: [
          {
            id: 'view',
            label: 'View Post',
            action: () => console.log('View post'),
            primary: true,
          },
        ],
      },
      {
        id: '2',
        title: 'Scheduled Post Reminder',
        message: 'Your Facebook post is scheduled to publish in 15 minutes.',
        type: 'schedule',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
        actionable: true,
        actions: [
          {
            id: 'edit',
            label: 'Edit',
            action: () => console.log('Edit post'),
          },
          {
            id: 'cancel',
            label: 'Cancel',
            action: () => console.log('Cancel post'),
          },
        ],
      },
      {
        id: '3',
        title: 'Weekly Analytics Report',
        message: 'Your content performance report for this week is ready.',
        type: 'analytics',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true,
        actionable: true,
        actions: [
          {
            id: 'view-report',
            label: 'View Report',
            action: () => console.log('View report'),
            primary: true,
          },
        ],
      },
      {
        id: '4',
        title: 'Team Member Added',
        message: 'John Doe has been added to your workspace.',
        type: 'team',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        read: true,
        actionable: false,
      },
      {
        id: '5',
        title: 'Security Alert',
        message: 'New login detected from Chrome on Windows.',
        type: 'security',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        read: true,
        actionable: true,
        actions: [
          {
            id: 'review',
            label: 'Review',
            action: () => console.log('Review security'),
            primary: true,
          },
        ],
      },
    ];

    setNotifications(mockNotifications);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <SuccessIcon />;
      case 'warning': return <WarningIcon />;
      case 'error': return <ErrorIcon />;
      case 'schedule': return <ScheduleIcon />;
      case 'analytics': return <AnalyticsIcon />;
      case 'team': return <TeamIcon />;
      case 'security': return <SecurityIcon />;
      default: return <InfoIcon />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return theme.palette.success.main;
      case 'warning': return theme.palette.warning.main;
      case 'error': return theme.palette.error.main;
      case 'schedule': return theme.palette.primary.main;
      case 'analytics': return theme.palette.info.main;
      case 'team': return theme.palette.secondary.main;
      case 'security': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    if (isToday(timestamp)) {
      return format(timestamp, 'h:mm a');
    } else if (isYesterday(timestamp)) {
      return 'Yesterday';
    } else {
      return format(timestamp, 'MMM d');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'today':
        return isToday(notification.timestamp);
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationTap = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }
    
    if (notification.actionable) {
      setSelectedNotification(notification);
    }

    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleSwipeDelete = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    deleteNotification(notificationId);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    markAllAsRead();
  };

  const handleTestNotification = async () => {
    try {
      await pushNotificationsService.testNotification();
      setShowTestDialog(false);
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  const renderFilterChips = () => (
    <Box display="flex" gap={1} mb={2} overflow="auto" pb={1}>
      {[
        { key: 'all', label: 'All' },
        { key: 'unread', label: `Unread (${unreadCount})` },
        { key: 'today', label: 'Today' },
      ].map((filterOption) => (
        <Chip
          key={filterOption.key}
          label={filterOption.label}
          clickable
          color={filter === filterOption.key ? 'primary' : 'default'}
          onClick={() => setFilter(filterOption.key as any)}
          sx={{ minWidth: 'fit-content' }}
        />
      ))}
    </Box>
  );

  const renderNotificationItem = (notification: Notification) => {
    const swipeHandlers = useSwipeable({
      onSwipedLeft: () => handleSwipeDelete(notification.id),
      trackMouse: true,
      trackTouch: true,
    });

    return (
      <Card
        key={notification.id}
        sx={{
          mb: 1,
          backgroundColor: notification.read 
            ? theme.palette.background.paper 
            : theme.palette.action.hover,
        }}
        {...swipeHandlers}
      >
        <ListItem
          onClick={() => handleNotificationTap(notification)}
          sx={{ cursor: 'pointer' }}
        >
          <ListItemAvatar>
            <Avatar
              sx={{
                backgroundColor: `${getNotificationColor(notification.type)}20`,
                color: getNotificationColor(notification.type),
              }}
            >
              {getNotificationIcon(notification.type)}
            </Avatar>
          </ListItemAvatar>
          
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography
                  variant="body1"
                  fontWeight={notification.read ? 'normal' : 'bold'}
                >
                  {notification.title}
                </Typography>
                {!notification.read && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.primary.main,
                    }}
                  />
                )}
              </Box>
            }
            secondary={
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {notification.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatTimestamp(notification.timestamp)}
                </Typography>
              </Box>
            }
          />
          
          <ListItemSecondaryAction>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleSwipeDelete(notification.id);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      </Card>
    );
  };

  const renderNotificationActions = () => (
    <Dialog
      open={!!selectedNotification}
      onClose={() => setSelectedNotification(null)}
      maxWidth="sm"
      fullWidth
    >
      {selectedNotification && (
        <>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                sx={{
                  backgroundColor: `${getNotificationColor(selectedNotification.type)}20`,
                  color: getNotificationColor(selectedNotification.type),
                }}
              >
                {getNotificationIcon(selectedNotification.type)}
              </Avatar>
              <Typography variant="h6">
                {selectedNotification.title}
              </Typography>
            </Box>
          </DialogTitle>
          
          <DialogContent>
            <Typography variant="body1" mb={2}>
              {selectedNotification.message}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {format(selectedNotification.timestamp, 'PPpp')}
            </Typography>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setSelectedNotification(null)}>
              Close
            </Button>
            {selectedNotification.actions?.map((action) => (
              <Button
                key={action.id}
                variant={action.primary ? 'contained' : 'outlined'}
                onClick={() => {
                  action.action();
                  setSelectedNotification(null);
                }}
              >
                {action.label}
              </Button>
            ))}
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  const renderSettings = () => (
    <SwipeableDrawer
      anchor="bottom"
      open={showSettings}
      onClose={() => setShowSettings(false)}
      onOpen={() => setShowSettings(true)}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '70vh',
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
        
        <Box display="flex" flexDirection="column" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.pushEnabled}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  pushEnabled: e.target.checked
                }))}
              />
            }
            label="Push Notifications"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.soundEnabled}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  soundEnabled: e.target.checked
                }))}
              />
            }
            label="Sound"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.vibrationEnabled}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  vibrationEnabled: e.target.checked
                }))}
              />
            }
            label="Vibration"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.quietHours}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  quietHours: e.target.checked
                }))}
              />
            }
            label="Quiet Hours"
          />
          
          {notificationSettings.quietHours && (
            <Box display="flex" gap={2}>
              <TextField
                label="Start Time"
                type="time"
                value={notificationSettings.quietStart}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  quietStart: e.target.value
                }))}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
              <TextField
                label="End Time"
                type="time"
                value={notificationSettings.quietEnd}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  quietEnd: e.target.value
                }))}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Box>
          )}
          
          <Button
            variant="outlined"
            onClick={() => setShowTestDialog(true)}
            fullWidth
          >
            Send Test Notification
          </Button>
        </Box>
      </Box>
    </SwipeableDrawer>
  );

  const renderTestDialog = () => (
    <Dialog
      open={showTestDialog}
      onClose={() => setShowTestDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Test Notification</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          This will send a test push notification to your device to verify that notifications are working correctly.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowTestDialog(false)}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleTestNotification}>
          Send Test
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Notifications
        </Typography>
        <Box display="flex" gap={1}>
          {unreadCount > 0 && (
            <IconButton onClick={handleMarkAllRead}>
              <Badge badgeContent={unreadCount} color="primary">
                <ReadAllIcon />
              </Badge>
            </IconButton>
          )}
          <IconButton onClick={() => setShowSettings(true)}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      {renderFilterChips()}

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 4 }}>
          <NotificationsIcon sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            {filter === 'unread' 
              ? 'No unread notifications' 
              : filter === 'today'
              ? 'No notifications today'
              : 'No notifications'
            }
          </Typography>
        </Card>
      ) : (
        <List sx={{ p: 0 }}>
          {filteredNotifications.map(renderNotificationItem)}
        </List>
      )}

      {/* Settings FAB */}
      <Fab
        color="primary"
        aria-label="notification settings"
        onClick={() => setShowSettings(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <SettingsIcon />
      </Fab>

      {renderNotificationActions()}
      {renderSettings()}
      {renderTestDialog()}
    </Box>
  );
};

export default MobileNotifications;