import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Eye, MessageCircle, Share, ThumbsUp, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useAnalytics } from '../../hooks/useAnalytics';
import { AudienceInsights } from './AudienceInsights.tsx';
import { ContentComparison } from './ContentComparison.tsx';
import { EngagementMetrics } from './EngagementMetrics.tsx';
import { ROICalculator } from './ROICalculator.tsx';
import { ReportGenerator } from './ReportGenerator.tsx';

interface PerformanceDashboardProps {
  userId: number;
  className?: string;
}

interface DashboardFilters {
  startDate: Date;
  endDate: Date;
  platforms: string[];
  timeGranularity: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
  timezone: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  userId,
  className
}) => {
  const [filters, setFilters] = useState<DashboardFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
    platforms: ['facebook', 'instagram', 'tiktok', 'youtube'],
    timeGranularity: 'DAY',
    timezone: 'UTC'
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'engagement' | 'comparison' | 'audience' | 'roi' | 'reports'>('overview');

  const {
    dashboardData,
    loading,
    error,
    fetchDashboard,
    refreshData
  } = useAnalytics();

  useEffect(() => {
    fetchDashboard(userId);
  }, [userId, fetchDashboard]);

  const handleFilterChange = (key: keyof DashboardFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return (num * 100).toFixed(2) + '%';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button onClick={() => refreshData()} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box className={className}>
      {/* Dashboard Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Performance Dashboard
        </Typography>
        
        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="Start Date"
              value={filters.startDate}
              onChange={(date: Date | null) => handleFilterChange('startDate', date)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="End Date"
              value={filters.endDate}
              onChange={(date: Date | null) => handleFilterChange('endDate', date)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Time Granularity</InputLabel>
              <Select
                value={filters.timeGranularity}
                onChange={(e) => handleFilterChange('timeGranularity', e.target.value)}
              >
                <MenuItem value="HOUR">Hour</MenuItem>
                <MenuItem value="DAY">Day</MenuItem>
                <MenuItem value="WEEK">Week</MenuItem>
                <MenuItem value="MONTH">Month</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Platforms</InputLabel>
              <Select
                multiple
                value={filters.platforms}
                onChange={(e) => handleFilterChange('platforms', e.target.value)}
              >
                <MenuItem value="facebook">Facebook</MenuItem>
                <MenuItem value="instagram">Instagram</MenuItem>
                <MenuItem value="tiktok">TikTok</MenuItem>
                <MenuItem value="youtube">YouTube</MenuItem>
                <MenuItem value="twitter">Twitter</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Button
            variant={activeTab === 'overview' ? 'contained' : 'text'}
            onClick={() => setActiveTab('overview')}
            sx={{ mr: 1 }}
          >
            Overview
          </Button>
          <Button
            variant={activeTab === 'engagement' ? 'contained' : 'text'}
            onClick={() => setActiveTab('engagement')}
            sx={{ mr: 1 }}
          >
            Engagement
          </Button>
          <Button
            variant={activeTab === 'comparison' ? 'contained' : 'text'}
            onClick={() => setActiveTab('comparison')}
            sx={{ mr: 1 }}
          >
            Comparison
          </Button>
          <Button
            variant={activeTab === 'audience' ? 'contained' : 'text'}
            onClick={() => setActiveTab('audience')}
            sx={{ mr: 1 }}
          >
            Audience
          </Button>
          <Button
            variant={activeTab === 'roi' ? 'contained' : 'text'}
            onClick={() => setActiveTab('roi')}
            sx={{ mr: 1 }}
          >
            ROI
          </Button>
          <Button
            variant={activeTab === 'reports' ? 'contained' : 'text'}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </Button>
        </Box>
      </Box>

      {/* Dashboard Content */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metrics Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Total Views
                      </Typography>
                      <Typography variant="h4">
                        {formatNumber(dashboardData?.engagementOverview?.totalViews || 0)}
                      </Typography>
                    </Box>
                    <Eye size={40} color="#1976d2" />
                  </Box>
                  <Box display="flex" alignItems="center" mt={1}>
                    <TrendingUp size={16} color="#4caf50" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      +12.5% from last period
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Total Likes
                      </Typography>
                      <Typography variant="h4">
                        {formatNumber(dashboardData?.engagementOverview?.totalLikes || 0)}
                      </Typography>
                    </Box>
                    <ThumbsUp size={40} color="#f44336" />
                  </Box>
                  <Box display="flex" alignItems="center" mt={1}>
                    <TrendingUp size={16} color="#4caf50" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      +8.3% from last period
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Total Shares
                      </Typography>
                      <Typography variant="h4">
                        {formatNumber(dashboardData?.engagementOverview?.totalShares || 0)}
                      </Typography>
                    </Box>
                    <Share size={40} color="#ff9800" />
                  </Box>
                  <Box display="flex" alignItems="center" mt={1}>
                    <TrendingDown size={16} color="#f44336" />
                    <Typography variant="body2" color="error.main" sx={{ ml: 0.5 }}>
                      -2.1% from last period
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Engagement Rate
                      </Typography>
                      <Typography variant="h4">
                        {formatPercentage(dashboardData?.engagementOverview?.averageEngagementRate || 0)}
                      </Typography>
                    </Box>
                    <MessageCircle size={40} color="#9c27b0" />
                  </Box>
                  <Box display="flex" alignItems="center" mt={1}>
                    <TrendingUp size={16} color="#4caf50" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      +5.7% from last period
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Performance Trends Chart */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={dashboardData?.performanceTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
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
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Platform Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={(dashboardData?.platformComparison || []) as any}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: any) => `${props.name} ${((props.percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="totalViews"
                      >
                        {(dashboardData?.platformComparison || []).map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Top Performing Content */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performing Content
              </Typography>
              <Grid container spacing={2}>
                {(dashboardData?.topPerformingContent || []).slice(0, 5).map((content: any, index: number) => (
                  <Grid item xs={12} key={content.contentId}>
                    <Box
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          #{index + 1} {content.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {content.platform} • {content.contentType}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="h6">
                          {formatNumber(content.views)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {formatPercentage(content.engagementRate)} engagement
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'engagement' && (
        <EngagementMetrics userId={userId} filters={filters} />
      )}

      {activeTab === 'comparison' && (
        <ContentComparison userId={userId} filters={filters} />
      )}

      {activeTab === 'audience' && (
        <AudienceInsights userId={userId} filters={filters} />
      )}

      {activeTab === 'roi' && (
        <ROICalculator userId={userId} filters={filters} />
      )}

      {activeTab === 'reports' && (
        <ReportGenerator userId={userId} />
      )}
    </Box>
  );
};