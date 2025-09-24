import { useSocialAnalytics } from '@/hooks/useSocialAnalytics';
import {
  Analytics,
  BarChart,
  CompareArrows,
  Download,
  Facebook,
  Instagram,
  LinkedIn,
  MusicNote,
  PieChart,
  Refresh,
  Share,
  ThumbUp,
  TrendingDown,
  TrendingUp,
  Twitter,
  Visibility,
  YouTube
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts';




const SocialAnalytics: React.FC = () => {
  const {
    platformMetrics,
    timeSeriesData,
    topContent,
    audienceInsights,
    loading,
    error,
    loadAnalytics,
    exportReport  } = useSocialAnalytics();

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['all']);
  const [metricType, setMetricType] = useState('engagement');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Platform configurations
  const platformConfigs = {
    facebook: { name: 'Facebook', icon: <Facebook />, color: '#1877F2' },
    twitter: { name: 'Twitter', icon: <Twitter />, color: '#1DA1F2' },
    instagram: { name: 'Instagram', icon: <Instagram />, color: '#E4405F' },
    youtube: { name: 'YouTube', icon: <YouTube />, color: '#FF0000' },
    linkedin: { name: 'LinkedIn', icon: <LinkedIn />, color: '#0A66C2' },
    tiktok: { name: 'TikTok', icon: <MusicNote />, color: '#000000' }
  };

  // Load analytics data on mount and when filters change
  useEffect(() => {
    loadAnalytics({
      dateRange,
      platforms: selectedPlatforms,
      includeComparison: comparisonMode
    });
  }, [dateRange, selectedPlatforms, comparisonMode]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics({
      dateRange,
      platforms: selectedPlatforms,
      includeComparison: comparisonMode
    });
    setRefreshing(false);
  };

  const handleExport = async () => {
    await exportReport({
      dateRange,
      platforms: selectedPlatforms,
      format: 'pdf',
      includeCharts: true
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp color="success" fontSize="small" />;
    if (change < 0) return <TrendingDown color="error" fontSize="small" />;
    return <TrendingUp color="disabled" fontSize="small" />;
  };

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Key Metrics Cards */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          {platformMetrics.map((platform) => {
            const config = platformConfigs[platform.platform];
            return (
              <Grid item xs={12} sm={6} md={4} lg={2} key={platform.platform}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Avatar sx={{ bgcolor: config.color, color: 'white' }}>
                        {config.icon}
                      </Avatar>
                      <Typography variant="h6">
                        {formatNumber(platform.followers)}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {platform.accountName}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getTrendIcon(platform.followersChange)}
                      <Typography 
                        variant="caption" 
                        color={platform.followersChange >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatPercentage(platform.followersChange)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Grid>

      {/* Summary Metrics */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Reach
                    </Typography>
                    <Typography variant="h4">
                      {formatNumber(platformMetrics.reduce((sum, p) => sum + p.reach, 0))}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {getTrendIcon(platformMetrics.reduce((sum, p) => sum + p.reachChange, 0) / platformMetrics.length)}
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                        vs last period
                      </Typography>
                    </Box>
                  </Box>
                  <Visibility color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Engagement
                    </Typography>
                    <Typography variant="h4">
                      {formatNumber(platformMetrics.reduce((sum, p) => sum + p.engagement, 0))}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {getTrendIcon(platformMetrics.reduce((sum, p) => sum + p.engagementChange, 0) / platformMetrics.length)}
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                        vs last period
                      </Typography>
                    </Box>
                  </Box>
                  <ThumbUp color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Posts
                    </Typography>
                    <Typography variant="h4">
                      {formatNumber(platformMetrics.reduce((sum, p) => sum + p.posts, 0))}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {getTrendIcon(platformMetrics.reduce((sum, p) => sum + p.postsChange, 0) / platformMetrics.length)}
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                        vs last period
                      </Typography>
                    </Box>
                  </Box>
                  <Share color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Revenue
                    </Typography>
                    <Typography variant="h4">
                      ${formatNumber(platformMetrics.reduce((sum, p) => sum + p.revenue, 0))}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {getTrendIcon(platformMetrics.reduce((sum, p) => sum + p.revenueChange, 0) / platformMetrics.length)}
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                        vs last period
                      </Typography>
                    </Box>
                  </Box>
                  <Analytics color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Performance Chart */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Timeline
            </Typography>
            
            <Box sx={{ height: 400, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  
                  {Object.entries(platformConfigs).map(([key, config]) => (
                    <Line 
                      key={key}
                      type="monotone" 
                      dataKey={key} 
                      stroke={config.color} 
                      strokeWidth={2}
                      name={config.name}
                    />
                  ))}
                  
                  <Bar dataKey="total" fill="#8884d8" name="Total" opacity={0.3} />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Platform Comparison */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Platform Performance Comparison
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Platform</TableCell>
                    <TableCell align="right">Reach</TableCell>
                    <TableCell align="right">Engagement</TableCell>
                    <TableCell align="right">Posts</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {platformMetrics.map((platform) => {
                    const config = platformConfigs[platform.platform];
                    return (
                      <TableRow key={platform.platform}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ bgcolor: config.color, width: 24, height: 24 }}>
                              {config.icon}
                            </Avatar>
                            {config.name}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Box>
                            <Typography variant="body2">
                              {formatNumber(platform.reach)}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color={platform.reachChange >= 0 ? 'success.main' : 'error.main'}
                            >
                              {formatPercentage(platform.reachChange)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Box>
                            <Typography variant="body2">
                              {formatNumber(platform.engagement)}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color={platform.engagementChange >= 0 ? 'success.main' : 'error.main'}
                            >
                              {formatPercentage(platform.engagementChange)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Box>
                            <Typography variant="body2">
                              {platform.posts}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color={platform.postsChange >= 0 ? 'success.main' : 'error.main'}
                            >
                              {formatPercentage(platform.postsChange)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Box>
                            <Typography variant="body2">
                              ${formatNumber(platform.revenue)}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color={platform.revenueChange >= 0 ? 'success.main' : 'error.main'}
                            >
                              {formatPercentage(platform.revenueChange)}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Performing Content */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Performing Content
            </Typography>
            
            <List>
              {topContent.slice(0, 5).map((content, index) => {
                const config = platformConfigs[content.platform as keyof typeof platformConfigs];
                return (
                  <ListItem key={content.id} divider>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: config.color }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={content.title}
                      secondary={
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            {config.icon}
                            <Typography variant="caption">
                              {config.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(content.publishedAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Typography variant="caption">
                              {formatNumber(content.views)} views
                            </Typography>
                            <Typography variant="caption">
                              {formatNumber(content.likes)} likes
                            </Typography>
                            <Typography variant="caption">
                              {content.engagementRate.toFixed(1)}% engagement
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderAudienceTab = () => (
    <Grid container spacing={3}>
      {/* Audience Demographics */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Age Distribution
            </Typography>
            
            <Box sx={{ height: 300, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <RechartsTooltip />
                  <Legend />
                  <RechartsPieChart
                    data={audienceInsights?.ageGroups || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="percentage"
                  >
                    {audienceInsights?.ageGroups.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                    ))}
                  </RechartsPieChart>
                </RechartsPieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Gender Distribution */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Gender Distribution
            </Typography>
            
            <Box sx={{ height: 300, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={audienceInsights?.genders || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="gender" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="percentage" fill="#8884d8" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Geographic Distribution */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Locations
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Country</TableCell>
                    <TableCell align="right">Followers</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                    <TableCell align="right">Engagement Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {audienceInsights?.locations.slice(0, 10).map((location) => (
                    <TableRow key={location.country}>
                      <TableCell>{location.country}</TableCell>
                      <TableCell align="right">{formatNumber(location.followers)}</TableCell>
                      <TableCell align="right">{location.percentage.toFixed(1)}%</TableCell>
                      <TableCell align="right">{location.engagementRate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderContentTab = () => (
    <Grid container spacing={3}>
      {/* Content Performance */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Content Performance Analysis
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Content</TableCell>
                    <TableCell>Platform</TableCell>
                    <TableCell align="right">Views</TableCell>
                    <TableCell align="right">Likes</TableCell>
                    <TableCell align="right">Shares</TableCell>
                    <TableCell align="right">Comments</TableCell>
                    <TableCell align="right">Engagement Rate</TableCell>
                    <TableCell align="right">Reach</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topContent.map((content) => {
                    const config = platformConfigs[content.platform as keyof typeof platformConfigs];
                    return (
                      <TableRow key={content.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {content.thumbnail && (
                              <Avatar src={content.thumbnail} variant="rounded" />
                            )}
                            <Box>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                {content.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(content.publishedAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ bgcolor: config.color, width: 24, height: 24 }}>
                              {config.icon}
                            </Avatar>
                            {config.name}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatNumber(content.views)}</TableCell>
                        <TableCell align="right">{formatNumber(content.likes)}</TableCell>
                        <TableCell align="right">{formatNumber(content.shares)}</TableCell>
                        <TableCell align="right">{formatNumber(content.comments)}</TableCell>
                        <TableCell align="right">{content.engagementRate.toFixed(1)}%</TableCell>
                        <TableCell align="right">{formatNumber(content.reach)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading analytics data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => loadAnalytics({
          dateRange,
          platforms: selectedPlatforms,
          includeComparison: comparisonMode
        })}>
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
            Social Media Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track performance across all your social media platforms
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              label="Date Range"
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <Refresh />
            </IconButton>
          </Tooltip>

          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Export
          </Button>

          <Button
            variant="outlined"
            startIcon={<CompareArrows />}
            onClick={() => setComparisonMode(!comparisonMode)}
          >
            Compare
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" icon={<Analytics />} />
          <Tab label="Audience" icon={<PieChart />} />
          <Tab label="Content" icon={<BarChart />} />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && renderOverviewTab()}
      {activeTab === 1 && renderAudienceTab()}
      {activeTab === 2 && renderContentTab()}
    </Box>
  );
};

export default SocialAnalytics;