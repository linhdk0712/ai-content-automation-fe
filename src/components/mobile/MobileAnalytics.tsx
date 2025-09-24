import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Avatar,
  LinearProgress,
  useTheme,
  Tabs,
  Tab,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Visibility as ViewsIcon,
  Favorite as LikesIcon,
  Share as SharesIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSwipeable } from 'react-swipeable';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAnalytics } from '../../hooks/useAnalytics';
import { offlineService } from '../../services/offline.service';

interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactElement;
  color: string;
  data: any[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
  </div>
);

const MobileAnalytics: React.FC = () => {
  const [currentMetricIndex, setCurrentMetricIndex] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);
  const [timeRange, setTimeRange] = useState('7d');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [cachedData, setCachedData] = useState<any>(null);

  const theme = useTheme();
  const { dashboardData, engagementData, loading, refreshData } = useAnalytics();

  // Derive analytics-like shape from available hook data
  const analytics = {
    engagementRate: Math.round(((engagementData?.engagementRate ?? dashboardData?.engagementOverview?.averageEngagementRate ?? 0) * 100)),
    engagementData: (engagementData?.timeline ?? []).map(d => ({ value: d.engagementRate })),
    totalReach: engagementData?.totalViews ?? dashboardData?.engagementOverview?.totalViews ?? 0,
    reachData: (engagementData?.timeline ?? []).map(d => ({ value: d.views })),
    totalInteractions: engagementData?.totalEngagements ?? dashboardData?.engagementOverview?.totalEngagements ?? 0,
    interactionData: (engagementData?.timeline ?? []).map(d => ({ value: d.engagements })),
    followerGrowth: 0,
    growthData: (engagementData?.timeline ?? []).map(d => ({ value: d.engagements })),
    engagementTrend: (engagementData?.timeline ?? []).map(d => ({ date: d.timestamp, engagement: d.engagements }))
  };

  const refreshAnalytics = refreshData;

  const metricCards: MetricCard[] = [
    {
      id: 'engagement',
      title: 'Engagement Rate',
      value: `${analytics?.engagementRate || 0}%`,
      change: 5.2,
      icon: <TrendingUpIcon />,
      color: theme.palette.primary.main,
      data: analytics?.engagementData || [],
    },
    {
      id: 'reach',
      title: 'Total Reach',
      value: analytics?.totalReach ? `${(analytics.totalReach / 1000).toFixed(1)}K` : '0',
      change: 12.8,
      icon: <ViewsIcon />,
      color: theme.palette.success.main,
      data: analytics?.reachData || [],
    },
    {
      id: 'interactions',
      title: 'Interactions',
      value: analytics?.totalInteractions || 0,
      change: -2.1,
      icon: <LikesIcon />,
      color: theme.palette.warning.main,
      data: analytics?.interactionData || [],
    },
    {
      id: 'growth',
      title: 'Follower Growth',
      value: `+${analytics?.followerGrowth || 0}`,
      change: 8.5,
      icon: <SharesIcon />,
      color: theme.palette.info.main,
      data: analytics?.growthData || [],
    },
  ];

  const platformData = [
    { name: 'Instagram', value: 35, color: '#E4405F' },
    { name: 'Facebook', value: 28, color: '#1877F2' },
    { name: 'Twitter', value: 20, color: '#1DA1F2' },
    { name: 'TikTok', value: 17, color: '#000000' },
  ];

  const topPosts = [
    {
      id: 1,
      title: 'Summer Marketing Tips',
      platform: 'Instagram',
      engagement: '12.5K',
      reach: '45.2K',
      date: '2 days ago',
    },
    {
      id: 2,
      title: 'Product Launch Announcement',
      platform: 'Facebook',
      engagement: '8.9K',
      reach: '32.1K',
      date: '5 days ago',
    },
    {
      id: 3,
      title: 'Behind the Scenes Video',
      platform: 'TikTok',
      engagement: '15.7K',
      reach: '67.8K',
      date: '1 week ago',
    },
  ];

  useEffect(() => {
    // Load cached data when offline
    if (isOffline) {
      loadCachedData();
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      saveCachedData();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadCachedData = async () => {
    try {
      const cached = await offlineService.getSettingOffline('analytics_cache');
      if (cached) {
        setCachedData(cached);
      }
    } catch (error) {
      console.error('Failed to load cached analytics:', error);
    }
  };

  const saveCachedData = async () => {
    try {
      await offlineService.storeSettingOffline('analytics_cache', analytics);
    } catch (error) {
      console.error('Failed to cache analytics:', error);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentMetricIndex < metricCards.length - 1) {
        setCurrentMetricIndex(currentMetricIndex + 1);
      }
    },
    onSwipedRight: () => {
      if (currentMetricIndex > 0) {
        setCurrentMetricIndex(currentMetricIndex - 1);
      }
    },
    trackMouse: true,
    trackTouch: true,
  });

  const handleRefresh = async () => {
    if (!isOffline) {
      await refreshAnalytics();
      await saveCachedData();
    }
  };

  const formatChange = (change: number) => {
    const isPositive = change > 0;
    return (
      <Box display="flex" alignItems="center" gap={0.5}>
        {isPositive ? (
          <TrendingUpIcon fontSize="small" color="success" />
        ) : (
          <TrendingDownIcon fontSize="small" color="error" />
        )}
        <Typography
          variant="body2"
          color={isPositive ? 'success.main' : 'error.main'}
          fontWeight="medium"
        >
          {isPositive ? '+' : ''}{change}%
        </Typography>
      </Box>
    );
  };

  const renderMetricCards = () => (
    <Box sx={{ mb: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          Key Metrics
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          {isOffline && (
            <Chip
              label="Offline"
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
          <IconButton size="small" onClick={handleRefresh} disabled={isOffline}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Box
        {...swipeHandlers}
        sx={{
          position: 'relative',
          height: 180,
          overflow: 'hidden',
          borderRadius: 2,
        }}
      >
        {metricCards.map((metric, index) => (
          <Card
            key={metric.id}
            sx={{
              position: 'absolute',
              top: 0,
              left: `${(index - currentMetricIndex) * 100}%`,
              width: '100%',
              height: '100%',
              transition: 'left 0.3s ease-in-out',
              background: `linear-gradient(135deg, ${metric.color}15, ${metric.color}05)`,
              border: `1px solid ${metric.color}30`,
            }}
          >
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: `${metric.color}20`,
                    color: metric.color,
                  }}
                >
                  {metric.icon}
                </Box>
                {formatChange(metric.change)}
              </Box>
              
              <Typography variant="h4" fontWeight="bold" color={metric.color} mb={1}>
                {metric.value}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" mb={2}>
                {metric.title}
              </Typography>

              {/* Mini chart */}
              <Box sx={{ height: 40, mt: 'auto' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metric.data}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={metric.color}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Indicators */}
      <Box display="flex" justifyContent="center" gap={1} mt={2}>
        {metricCards.map((_, index) => (
          <Box
            key={index}
            onClick={() => setCurrentMetricIndex(index)}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: index === currentMetricIndex 
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

  const renderOverviewTab = () => (
    <Box>
      {/* Platform Distribution */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Platform Distribution
          </Typography>
          <Box sx={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Box>
          <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
            {platformData.map((platform) => (
              <Chip
                key={platform.name}
                label={`${platform.name} ${platform.value}%`}
                size="small"
                sx={{ backgroundColor: platform.color, color: 'white' }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Engagement Trend */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Engagement Trend (7 days)
          </Typography>
          <Box sx={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.engagementTrend || []}>
                <XAxis dataKey="date" />
                <YAxis />
                <Area
                  type="monotone"
                  dataKey="engagement"
                  stroke={theme.palette.primary.main}
                  fill={`${theme.palette.primary.main}20`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  const renderPerformanceTab = () => (
    <Box>
      {/* Top Performing Posts */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Top Performing Posts
          </Typography>
          <List>
            {topPosts.map((post, index) => (
              <React.Fragment key={post.id}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ backgroundColor: theme.palette.primary.main }}>
                      {index + 1}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={post.title}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {post.platform} • {post.date}
                        </Typography>
                        <Box display="flex" gap={2} mt={0.5}>
                          <Typography variant="caption">
                            👁 {post.reach}
                          </Typography>
                          <Typography variant="caption">
                            ❤️ {post.engagement}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {index < topPosts.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );

  const renderInsightsTab = () => (
    <Box>
      {/* Audience Insights */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Audience Demographics
          </Typography>
          
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Age Groups
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {[
                { label: '18-24', value: 35 },
                { label: '25-34', value: 42 },
                { label: '35-44', value: 18 },
                { label: '45+', value: 5 },
              ].map((group) => (
                <Box key={group.label} display="flex" alignItems="center" gap={2}>
                  <Typography variant="body2" sx={{ minWidth: 50 }}>
                    {group.label}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={group.value}
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {group.value}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Top Locations
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {['United States', 'Canada', 'United Kingdom', 'Australia'].map((location) => (
                <Chip key={location} label={location} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Best Times to Post */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Best Times to Post
          </Typography>
          <Grid container spacing={1}>
            {[
              { time: '9:00 AM', engagement: '85%' },
              { time: '1:00 PM', engagement: '92%' },
              { time: '6:00 PM', engagement: '78%' },
              { time: '9:00 PM', engagement: '65%' },
            ].map((slot) => (
              <Grid item xs={6} key={slot.time}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {slot.time}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {slot.engagement} engagement
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Box sx={{ pb: 2 }}>
      {renderMetricCards()}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="Overview" />
          <Tab label="Performance" />
          <Tab label="Insights" />
        </Tabs>
      </Box>

      <TabPanel value={selectedTab} index={0}>
        {renderOverviewTab()}
      </TabPanel>
      
      <TabPanel value={selectedTab} index={1}>
        {renderPerformanceTab()}
      </TabPanel>
      
      <TabPanel value={selectedTab} index={2}>
        {renderInsightsTab()}
      </TabPanel>
    </Box>
  );
};

export default MobileAnalytics;