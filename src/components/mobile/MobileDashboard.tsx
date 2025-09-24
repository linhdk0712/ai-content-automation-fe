import {
  Add as AddIcon,
  Analytics as AnalyticsIcon,
  ContentCopy as ContentIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  SwipeLeft as SwipeIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Fab,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  SwipeableDrawer,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SwipeEventData, useSwipeable } from 'react-swipeable';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useAuth } from '../../hooks/useAuth';
import { useContentGeneration } from '../../hooks/useContentGeneration';

interface DashboardCard {
  id: string;
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactElement;
  color: string;
  action?: () => void;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactElement;
  action: () => void;
  color: string;
}

const MobileDashboard: React.FC = () => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dashboardData } = useAnalytics();
  const analytics = {
    totalContent: 0,
    engagementRate: Math.round(((dashboardData?.engagementOverview?.averageEngagementRate ?? 0) * 100)),
    scheduledPosts: 0,
    totalViews: dashboardData?.engagementOverview?.totalViews ?? 0,
  };
  useContentGeneration();

  const cardContainerRef = useRef<HTMLDivElement>(null);

  const dashboardCards: DashboardCard[] = [
    {
      id: 'content-generated',
      title: 'Content Generated',
      value: analytics?.totalContent || 0,
      change: '+12%',
      icon: <ContentIcon />,
      color: theme.palette.primary.main,
      action: () => navigate('/content/library'),
    },
    {
      id: 'engagement-rate',
      title: 'Engagement Rate',
      value: `${analytics?.engagementRate || 0}%`,
      change: '+5.2%',
      icon: <TrendingUpIcon />,
      color: theme.palette.success.main,
      action: () => navigate('/analytics'),
    },
    {
      id: 'scheduled-posts',
      title: 'Scheduled Posts',
      value: analytics?.scheduledPosts || 0,
      change: '3 today',
      icon: <ScheduleIcon />,
      color: theme.palette.warning.main,
      action: () => navigate('/scheduling'),
    },
    {
      id: 'total-views',
      title: 'Total Views',
      value: analytics?.totalViews ? `${(analytics.totalViews / 1000).toFixed(1)}K` : '0',
      change: '+18%',
      icon: <AnalyticsIcon />,
      color: theme.palette.info.main,
      action: () => navigate('/analytics'),
    },
  ];

  const quickActions: QuickAction[] = [
    {
      id: 'create-content',
      label: 'Create Content',
      icon: <ContentIcon />,
      action: () => navigate('/content/creator'),
      color: theme.palette.primary.main,
    },
    {
      id: 'schedule-post',
      label: 'Schedule Post',
      icon: <ScheduleIcon />,
      action: () => navigate('/scheduling/new'),
      color: theme.palette.secondary.main,
    },
    {
      id: 'view-analytics',
      label: 'View Analytics',
      icon: <AnalyticsIcon />,
      action: () => navigate('/analytics'),
      color: theme.palette.success.main,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <NotificationsIcon />,
      action: () => navigate('/notifications'),
      color: theme.palette.warning.main,
    },
  ];

  // Swipe handlers for card navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentCardIndex < dashboardCards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      }
    },
    onSwipedRight: () => {
      if (currentCardIndex > 0) {
        setCurrentCardIndex(currentCardIndex - 1);
      }
    },
    trackMouse: true,
    trackTouch: true,
  });

  // Pull to refresh
  const pullToRefreshHandlers = useSwipeable({
    onSwipedDown: (eventData: SwipeEventData) => {
      if (eventData.deltaY > 100 && window.scrollY === 0) {
        handleRefresh();
      }
    },
    trackTouch: true,
  });

  useEffect(() => {
    // Load recent activity
    loadRecentActivity();
  }, []);

  const loadRecentActivity = async () => {
    try {
      // Simulate loading recent activity
      const activity = [
        {
          id: 1,
          type: 'content_created',
          title: 'New blog post created',
          time: '2 minutes ago',
          icon: <ContentIcon />,
        },
        {
          id: 2,
          type: 'post_scheduled',
          title: 'Instagram post scheduled',
          time: '15 minutes ago',
          icon: <ScheduleIcon />,
        },
        {
          id: 3,
          type: 'analytics_update',
          title: 'Weekly report available',
          time: '1 hour ago',
          icon: <AnalyticsIcon />,
        },
      ];
      setRecentActivity(activity);
    } catch (error) {
      console.error('Failed to load recent activity:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadRecentActivity(),
        // Refresh analytics data
        // Refresh content data
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCardTap = (card: DashboardCard) => {
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    if (card.action) {
      card.action();
    }
  };

  const renderWelcomeSection = () => (
    <Box sx={{ mb: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Avatar
          src={user?.profilePictureUrl || ''}
          alt={user?.username}
          sx={{ width: 48, height: 48 }}
        >
          {(user?.firstName || user?.username || '').charAt(0)}
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Welcome back, {(user?.firstName || user?.username || '').split(' ')[0]}!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Typography>
        </Box>
      </Box>
      
      {isRefreshing && (
        <LinearProgress sx={{ borderRadius: 1, height: 3 }} />
      )}
    </Box>
  );

  const renderSwipeableCards = () => (
    <Box sx={{ mb: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          Overview
        </Typography>
        <Box display="flex" alignItems="center" gap={0.5}>
          <SwipeIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            Swipe to navigate
          </Typography>
        </Box>
      </Box>

      <Box
        {...swipeHandlers}
        ref={cardContainerRef}
        sx={{
          position: 'relative',
          height: 140,
          overflow: 'hidden',
          borderRadius: 2,
        }}
      >
        {dashboardCards.map((card, index) => (
          <Card
            key={card.id}
            onClick={() => handleCardTap(card)}
            sx={{
              position: 'absolute',
              top: 0,
              left: `${(index - currentCardIndex) * 100}%`,
              width: '100%',
              height: '100%',
              transition: 'left 0.3s ease-in-out',
              cursor: 'pointer',
              background: `linear-gradient(135deg, ${card.color}15, ${card.color}05)`,
              border: `1px solid ${card.color}30`,
              '&:active': {
                transform: 'scale(0.98)',
              },
            }}
          >
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: `${card.color}20`,
                    color: card.color,
                  }}
                >
                  {card.icon}
                </Box>
                {card.change && (
                  <Chip
                    label={card.change}
                    size="small"
                    sx={{
                      backgroundColor: theme.palette.success.light,
                      color: theme.palette.success.contrastText,
                      fontSize: '0.75rem',
                    }}
                  />
                )}
              </Box>
              
              <Typography variant="h4" fontWeight="bold" color={card.color}>
                {card.value}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" mt="auto">
                {card.title}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Card indicators */}
      <Box display="flex" justifyContent="center" gap={1} mt={2}>
        {dashboardCards.map((_, index) => (
          <Box
            key={index}
            onClick={() => setCurrentCardIndex(index)}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: index === currentCardIndex 
                ? theme.palette.primary.main 
                : theme.palette.grey[300],
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          />
        ))}
      </Box>
    </Box>
  );

  const renderRecentActivity = () => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Recent Activity
      </Typography>
      
      <Card>
        <List>
          {recentActivity.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <ListItem>
                <ListItemIcon>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: theme.palette.primary.light,
                      color: theme.palette.primary.contrastText,
                    }}
                  >
                    {activity.icon}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={activity.title}
                  secondary={activity.time}
                />
              </ListItem>
              {index < recentActivity.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Card>
    </Box>
  );

  const renderQuickActions = () => (
    <SwipeableDrawer
      anchor="bottom"
      open={quickActionsOpen}
      onClose={() => setQuickActionsOpen(false)}
      onOpen={() => setQuickActionsOpen(true)}
      disableSwipeToOpen={false}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '50vh',
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
        
        <Typography variant="h6" fontWeight="bold" mb={2} textAlign="center">
          Quick Actions
        </Typography>
        
        <Grid container spacing={2}>
          {quickActions.map((action) => (
            <Grid item xs={6} key={action.id}>
              <Card
                onClick={() => {
                  action.action();
                  setQuickActionsOpen(false);
                }}
                sx={{
                  cursor: 'pointer',
                  textAlign: 'center',
                  p: 2,
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: `${action.color}20`,
                    color: action.color,
                    display: 'inline-flex',
                    mb: 1,
                  }}
                >
                  {action.icon}
                </Box>
                <Typography variant="body2" fontWeight="medium">
                  {action.label}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </SwipeableDrawer>
  );

  return (
    <Box
      {...pullToRefreshHandlers}
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        pb: 10, // Space for FAB
      }}
    >
      <Box sx={{ p: 2 }}>
        {renderWelcomeSection()}
        {renderSwipeableCards()}
        {renderRecentActivity()}
      </Box>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="quick actions"
        onClick={() => setQuickActionsOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <AddIcon />
      </Fab>

      {renderQuickActions()}
    </Box>
  );
};

export default MobileDashboard;