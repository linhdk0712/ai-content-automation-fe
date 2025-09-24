import { useContent } from '@/hooks/useContent';
import {
  Analytics,
  ArrowBack,
  CheckCircle,
  CompareArrows,
  Download,
  Error,
  PieChart,
  Refresh,
  Share,
  ThumbUp,
  TrendingDown,
  TrendingUp,
  Visibility,
  Warning
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
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
import { useNavigate, useParams } from 'react-router-dom';
import {
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts';
import { useAnalytics } from '../../hooks/useAnalytics';


const ContentAnalytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    dashboardData,
    loading,
    error,
    fetchDashboard,
    exportEngagementData
  } = useAnalytics();
  const { content, loadContent } = useContent();

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState('30d');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['views', 'engagement']);
  const [refreshing, setRefreshing] = useState(false);

  // Load data on mount
  useEffect(() => {
    if (id) {
      loadContent(parseInt(id));
      loadAnalyticsData();
    }
  }, [id, dateRange]);

  const loadAnalyticsData = async () => {
    if (id) {
      await fetchDashboard(parseInt(id), {
        startDate: new Date(Date.now() - (dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        platforms: [],
        timeGranularity: 'DAY',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const handleExport = async () => {
    if (id) {
      await exportEngagementData({
        userId: parseInt(id),
        contentId: parseInt(id),
        platform: 'all',
        startDate: new Date(Date.now() - (dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        format: 'pdf'
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle color="success" />;
    if (score >= 60) return <Warning color="warning" />;
    return <Error color="error" />;
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp color="success" />;
    if (current < previous) return <TrendingDown color="error" />;
    return <TrendingUp color="disabled" />;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Key Metrics Cards */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Views
                    </Typography>
                    <Typography variant="h4">
                      {formatNumber(dashboardData?.engagementOverview?.totalViews || 0)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {getTrendIcon(dashboardData?.engagementOverview?.totalViews || 0, 0)}
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
                      Engagement Rate
                    </Typography>
                    <Typography variant="h4">
                      {(dashboardData?.engagementOverview?.averageEngagementRate || 0).toFixed(1)}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {getTrendIcon(dashboardData?.engagementOverview?.averageEngagementRate || 0, 0)}
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
                      Total Shares
                    </Typography>
                    <Typography variant="h4">
                      {formatNumber(dashboardData?.engagementOverview?.totalShares || 0)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {getTrendIcon(dashboardData?.engagementOverview?.totalShares || 0, 0)}
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
                      Conversion Rate
                    </Typography>
                    <Typography variant="h4">
                      {(dashboardData?.engagementOverview?.averageEngagementRate || 0).toFixed(1)}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {getTrendIcon(dashboardData?.engagementOverview?.averageEngagementRate || 0, 0)}
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

      {/* Performance Scores */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Scores
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              {[
                { label: 'Engagement Rate', score: (dashboardData?.engagementOverview?.averageEngagementRate || 0) * 100 },
                { label: 'Total Views', score: Math.min((dashboardData?.engagementOverview?.totalViews || 0) / 1000, 100) },
                { label: 'Total Shares', score: Math.min((dashboardData?.engagementOverview?.totalShares || 0) / 100, 100) },
                { label: 'Total Likes', score: Math.min((dashboardData?.engagementOverview?.totalLikes || 0) / 500, 100) },
                { label: 'Total Comments', score: Math.min((dashboardData?.engagementOverview?.totalComments || 0) / 50, 100) }
              ].map((item) => (
                <Box key={item.label} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">{item.label}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getScoreIcon(item.score)}
                      <Typography variant="body2" fontWeight="bold">
                        {item.score}/100
                      </Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={item.score}
                    color={getScoreColor(item.score) as any}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Platform Performance */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Platform Performance
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Platform</TableCell>
                    <TableCell align="right">Views</TableCell>
                    <TableCell align="right">Engagement</TableCell>
                    <TableCell align="right">Reach</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.platformComparison.map((platform) => (
                    <TableRow key={platform.platform}>
                      <TableCell>
                        <Chip label={platform.platform} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(platform.totalViews)}
                      </TableCell>
                      <TableCell align="right">
                        {platform.engagementRate.toFixed(1)}%
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(platform.totalEngagements)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Timeline Chart */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Timeline
            </Typography>
            
            <Box sx={{ height: 300, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData?.performanceTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="totalViews" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Views"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalEngagements" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Engagements"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="engagementRate" 
                    stroke="#ffc658" 
                    strokeWidth={2}
                    name="Engagement Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderDemographicsTab = () => (
    <Grid container spacing={3}>
      {/* Age Groups */}
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
                    data={[]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="percentage"
                  >
                    {[].map((entry, index) => (
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
                <RechartsBarChart data={[]}>
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

      {/* Top Locations */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Locations
            </Typography>
            
            <List>
              {([] as any[]).slice(0, 10).map((location, index) => (
                <ListItem key={location.location} divider>
                  <ListItemText
                    primary={location.location}
                    secondary={`${location.percentage.toFixed(1)}% of audience`}
                  />
                  <Typography variant="body2" color="text.secondary">
                    #{index + 1}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Device Types */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Device Usage
            </Typography>
            
            <Box sx={{ height: 300, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <RechartsTooltip />
                  <Legend />
                  <RechartsPieChart
                    data={[]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="percentage"
                  >
                    {[].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 120}, 70%, 60%)`} />
                    ))}
                  </RechartsPieChart>
                </RechartsPieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderRecommendationsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Optimization Recommendations
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          AI-powered suggestions to improve your content performance
        </Typography>
      </Grid>

      {([] as any[]).map((recommendation, index) => (
        <Grid item xs={12} md={6} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {recommendation.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip 
                      label={`${recommendation.impact} impact`}
                      color={recommendation.impact === 'high' ? 'error' : recommendation.impact === 'medium' ? 'warning' : 'success'}
                      size="small"
                    />
                    <Chip 
                      label={`${recommendation.effort} effort`}
                      variant="outlined"
                      size="small"
                    />
                    <Chip 
                      label={recommendation.type}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                {recommendation.description}
              </Typography>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button size="small" variant="outlined">
                  Apply Suggestion
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
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
        <Button onClick={() => navigate(`/content/edit/${id}`)}>
          Back to Content
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <IconButton onClick={() => navigate(`/content/edit/${id}`)}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4">
              Content Analytics
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            {content?.title || 'Untitled Content'}
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

      {/* Content Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {content?.title?.charAt(0) || 'C'}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">{content?.title}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip label={content?.status} size="small" />
                <Chip label={content?.contentType} size="small" variant="outlined" />
                {content?.publishedAt && (
                  <Chip 
                    label={`Published ${new Date(content.publishedAt).toLocaleDateString()}`}
                    size="small" 
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" icon={<Analytics />} />
          <Tab label="Demographics" icon={<PieChart />} />
          <Tab label="Recommendations" icon={<TrendingUp />} />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && renderOverviewTab()}
      {activeTab === 1 && renderDemographicsTab()}
      {activeTab === 2 && renderRecommendationsTab()}
    </Box>
  );
};

export default ContentAnalytics;

