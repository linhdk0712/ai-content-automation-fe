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
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Divider,
  Button,
  Badge,
  Tooltip
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Create as CreateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Publish as PublishIcon,
  Schedule as ScheduleIcon,
  Comment as CommentIcon,
  ThumbUp as LikeIcon,
  Share as ShareIcon,
  Person as PersonIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useActivityFeed } from '../../hooks/useActivityFeed';

interface Activity {
  id: string;
  type: 'content_created' | 'content_updated' | 'content_published' | 'content_scheduled' | 
        'comment_added' | 'member_joined' | 'member_left' | 'approval_requested' | 
        'content_approved' | 'content_rejected';
  actor: {
    id: string;
    name: string;
    avatar: string;
  };
  target?: {
    id: string;
    name: string;
    type: 'content' | 'user' | 'workspace';
  };
  metadata?: {
    [key: string]: any;
  };
  timestamp: string;
  isRead: boolean;
}

const ActivityFeed: React.FC = () => {
  const { activities, markAsRead, markAllAsRead, refreshFeed, loading } = useActivityFeed();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);

  const activityTypes = [
    { value: 'content_created', label: 'Content Created', icon: <CreateIcon /> },
    { value: 'content_updated', label: 'Content Updated', icon: <EditIcon /> },
    { value: 'content_published', label: 'Content Published', icon: <PublishIcon /> },
    { value: 'content_scheduled', label: 'Content Scheduled', icon: <ScheduleIcon /> },
    { value: 'comment_added', label: 'Comment Added', icon: <CommentIcon /> },
    { value: 'member_joined', label: 'Member Joined', icon: <PersonIcon /> },
    { value: 'member_left', label: 'Member Left', icon: <PersonIcon /> },
    { value: 'approval_requested', label: 'Approval Requested', icon: <LikeIcon /> },
    { value: 'content_approved', label: 'Content Approved', icon: <LikeIcon /> },
    { value: 'content_rejected', label: 'Content Rejected', icon: <DeleteIcon /> }
  ];

  useEffect(() => {
    let filtered = activities || [];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.actor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.target?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(activity => 
        selectedFilters.includes(activity.type)
      );
    }

    setFilteredActivities(filtered);
  }, [activities, searchTerm, selectedFilters]);

  const handleFilterToggle = (filterType: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterType)
        ? prev.filter(f => f !== filterType)
        : [...prev, filterType]
    );
  };

  const getActivityIcon = (type: string) => {
    const activityType = activityTypes.find(at => at.value === type);
    return activityType?.icon || <CreateIcon />;
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'content_created': return 'primary';
      case 'content_updated': return 'info';
      case 'content_published': return 'success';
      case 'content_scheduled': return 'warning';
      case 'comment_added': return 'secondary';
      case 'member_joined': return 'success';
      case 'member_left': return 'error';
      case 'approval_requested': return 'warning';
      case 'content_approved': return 'success';
      case 'content_rejected': return 'error';
      default: return 'default';
    }
  };

  const formatActivityMessage = (activity: Activity) => {
    const actorName = activity.actor.name;
    const targetName = activity.target?.name || '';

    switch (activity.type) {
      case 'content_created':
        return `${actorName} created "${targetName}"`;
      case 'content_updated':
        return `${actorName} updated "${targetName}"`;
      case 'content_published':
        return `${actorName} published "${targetName}"`;
      case 'content_scheduled':
        return `${actorName} scheduled "${targetName}" for ${activity.metadata?.scheduledTime}`;
      case 'comment_added':
        return `${actorName} commented on "${targetName}"`;
      case 'member_joined':
        return `${actorName} joined the workspace`;
      case 'member_left':
        return `${actorName} left the workspace`;
      case 'approval_requested':
        return `${actorName} requested approval for "${targetName}"`;
      case 'content_approved':
        return `${actorName} approved "${targetName}"`;
      case 'content_rejected':
        return `${actorName} rejected "${targetName}"`;
      default:
        return `${actorName} performed an action`;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return activityTime.toLocaleDateString();
  };

  const unreadCount = activities?.filter(a => !a.isRead).length || 0;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Activity Feed
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error" sx={{ ml: 1 }} />
            )}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={refreshFeed} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Filter">
              <IconButton onClick={(e) => setFilterAnchorEl(e.currentTarget)}>
                <FilterIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <TextField
          placeholder="Search activities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          fullWidth
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {selectedFilters.length > 0 && (
          <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {selectedFilters.map(filter => {
              const activityType = activityTypes.find(at => at.value === filter);
              return (
                <Chip
                  key={filter}
                  label={activityType?.label}
                  onDelete={() => handleFilterToggle(filter)}
                  size="small"
                />
              );
            })}
          </Box>
        )}

        {unreadCount > 0 && (
          <Box sx={{ mb: 2 }}>
            <Button size="small" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          </Box>
        )}

        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {filteredActivities.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <ListItem
                sx={{
                  backgroundColor: activity.isRead ? 'transparent' : 'action.hover',
                  borderRadius: 1,
                  mb: 1
                }}
                onClick={() => !activity.isRead && markAsRead(activity.id)}
              >
                <ListItemAvatar>
                  <Avatar src={activity.actor.avatar}>
                    {activity.actor.name[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getActivityIcon(activity.type)}
                      <Typography variant="body2">
                        {formatActivityMessage(activity)}
                      </Typography>
                      {!activity.isRead && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: 'primary.main'
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={activityTypes.find(at => at.value === activity.type)?.label}
                        size="small"
                        color={getActivityColor(activity.type)}
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(activity.timestamp)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < filteredActivities.length - 1 && <Divider />}
            </React.Fragment>
          ))}
          
          {filteredActivities.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No activities found"
                secondary="Try adjusting your search or filters"
                sx={{ textAlign: 'center' }}
              />
            </ListItem>
          )}
        </List>

        {/* Filter Menu */}
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={() => setFilterAnchorEl(null)}
        >
          <MenuItem disabled>
            <Typography variant="subtitle2">Filter by activity type</Typography>
          </MenuItem>
          <Divider />
          {activityTypes.map(activityType => (
            <MenuItem
              key={activityType.value}
              onClick={() => handleFilterToggle(activityType.value)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {activityType.icon}
                <Typography variant="body2">{activityType.label}</Typography>
                {selectedFilters.includes(activityType.value) && (
                  <Chip size="small" label="✓" />
                )}
              </Box>
            </MenuItem>
          ))}
        </Menu>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;