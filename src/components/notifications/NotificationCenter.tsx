import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Badge,
  Tabs,
  Tab,
  Button,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  FilterList as FilterIcon,
  Circle as CircleIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Group as GroupIcon,
  Article as ContentIcon
} from '@mui/icons-material';
import { useNotifications } from '../../hooks/useNotifications';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'content' | 'team' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionText?: string;
  actor?: {
    id: string;
    name: string;
    avatar: string;
  };
  metadata?: {
    [key: string]: any;
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
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const NotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    preferences,
    loading
  } = useNotifications();

  const [tabValue, setTabValue] = useState(0);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);

  const notificationTypes = [
    { value: 'content', label: 'Content Updates', icon: <ContentIcon /> },
    { value: 'team', label: 'Team Activity', icon: <GroupIcon /> },
    { value: 'system', label: 'System Alerts', icon: <InfoIcon /> },
    { value: 'success', label: 'Success', icon: <CheckCircleIcon /> },
    { value: 'warning', label: 'Warnings', icon: <WarningIcon /> },
    { value: 'error', label: 'Errors', icon: <ErrorIcon /> }
  ];

  useEffect(() => {
    let filtered = notifications || [];

    // Apply tab filter
    if (tabValue === 1) {
      filtered = filtered.filter(n => !n.isRead);
    } else if (tabValue === 2) {
      filtered = filtered.filter(n => n.isRead);
    }

    // Apply type filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(n => selectedFilters.includes(n.type));
    }

    setFilteredNotifications(filtered);
  }, [notifications, tabValue, selectedFilters]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleFilterToggle = (filterType: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterType)
        ? prev.filter(f => f !== filterType)
        : [...prev, filterType]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircleIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'content': return <ContentIcon color="primary" />;
      case 'team': return <GroupIcon color="secondary" />;
      case 'system': return <InfoIcon color="info" />;
      default: return <InfoIcon />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return notificationTime.toLocaleDateString();
  };

  const renderNotificationItem = (notification: Notification) => (
    <ListItem
      key={notification.id}
      sx={{
        backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
        borderRadius: 1,
        mb: 1,
        border: notification.priority === 'high' ? '1px solid' : 'none',
        borderColor: notification.priority === 'high' ? 'error.main' : 'transparent'
      }}
    >
      <ListItemAvatar>
        {notification.actor ? (
          <Avatar src={notification.actor.avatar}>
            {notification.actor.name[0]}
          </Avatar>
        ) : (
          <Avatar>{getNotificationIcon(notification.type)}</Avatar>
        )}
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2">{notification.title}</Typography>
            {!notification.isRead && (
              <CircleIcon sx={{ fontSize: 8, color: 'primary.main' }} />
            )}
            <Chip
              label={notification.priority}
              size="small"
              color={getPriorityColor(notification.priority)}
              variant="outlined"
            />
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              {notification.message}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTimestamp(notification.timestamp)}
            </Typography>
            {notification.actionUrl && (
              <Button
                size="small"
                sx={{ ml: 1 }}
                onClick={() => window.open(notification.actionUrl, '_blank')}
              >
                {notification.actionText || 'View'}
              </Button>
            )}
          </Box>
        }
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {!notification.isRead && (
          <Tooltip title="Mark as read">
            <IconButton
              size="small"
              onClick={() => handleMarkAsRead(notification.id)}
            >
              <MarkReadIcon />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={() => handleDeleteNotification(notification.id)}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </ListItem>
  );

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Notifications
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error" sx={{ ml: 1 }} />
            )}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Filter">
              <IconButton onClick={(e) => setFilterAnchorEl(e.currentTarget)}>
                <FilterIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton onClick={() => setSettingsDialogOpen(true)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            {unreadCount > 0 && (
              <Button size="small" onClick={handleMarkAllAsRead}>
                Mark all read
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab
              label={
                <Badge badgeContent={notifications?.length || 0} color="default">
                  All
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={unreadCount} color="error">
                  Unread
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={(notifications?.length || 0) - unreadCount} color="success">
                  Read
                </Badge>
              }
            />
          </Tabs>
        </Box>

        {selectedFilters.length > 0 && (
          <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {selectedFilters.map(filter => {
              const type = notificationTypes.find(t => t.value === filter);
              return (
                <Chip
                  key={filter}
                  label={type?.label}
                  onDelete={() => handleFilterToggle(filter)}
                  size="small"
                />
              );
            })}
          </Box>
        )}

        <TabPanel value={tabValue} index={0}>
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredNotifications.map(renderNotificationItem)}
            {filteredNotifications.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No notifications"
                  secondary="You're all caught up!"
                  sx={{ textAlign: 'center' }}
                />
              </ListItem>
            )}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredNotifications.map(renderNotificationItem)}
            {filteredNotifications.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No unread notifications"
                  secondary="You're all caught up!"
                  sx={{ textAlign: 'center' }}
                />
              </ListItem>
            )}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredNotifications.map(renderNotificationItem)}
            {filteredNotifications.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No read notifications"
                  secondary="Read notifications will appear here"
                  sx={{ textAlign: 'center' }}
                />
              </ListItem>
            )}
          </List>
        </TabPanel>

        {/* Filter Menu */}
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={() => setFilterAnchorEl(null)}
        >
          <MenuItem disabled>
            <Typography variant="subtitle2">Filter by type</Typography>
          </MenuItem>
          <Divider />
          {notificationTypes.map(type => (
            <MenuItem
              key={type.value}
              onClick={() => handleFilterToggle(type.value)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {type.icon}
                <Typography variant="body2">{type.label}</Typography>
                {selectedFilters.includes(type.value) && (
                  <Chip size="small" label="✓" />
                )}
              </Box>
            </MenuItem>
          ))}
        </Menu>

        {/* Settings Dialog */}
        <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Notification Settings</DialogTitle>
          <DialogContent>
            <Typography variant="subtitle2" gutterBottom>
              Notification Preferences
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Email Notifications"
                  secondary="Receive notifications via email"
                />
                <Switch
                  checked={preferences?.email || false}
                  onChange={(e) => updatePreferences({ ...(preferences as any), email: e.target.checked })}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Push Notifications"
                  secondary="Receive browser push notifications"
                />
                <Switch
                  checked={preferences?.push || false}
                  onChange={(e) => updatePreferences({ ...(preferences as any), push: e.target.checked })}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Sound Notifications"
                  secondary="Play sound for new notifications"
                />
                <Switch
                  checked={preferences?.sound || false}
                  onChange={(e) => updatePreferences({ ...(preferences as any), sound: e.target.checked })}
                />
              </ListItem>
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Notification Types
            </Typography>
            <List>
              {notificationTypes.map(type => (
                <ListItem key={type.value}>
                  <ListItemText
                    primary={type.label}
                    secondary={`Receive ${type.label.toLowerCase()} notifications`}
                  />
                  <Switch
                    checked={preferences?.types?.[type.value] !== false}
                    onChange={(e) => updatePreferences({
                      ...(preferences as any),
                      types: {
                        ...(preferences?.types || {}),
                        [type.value]: e.target.checked
                      }
                    })}
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSettingsDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;