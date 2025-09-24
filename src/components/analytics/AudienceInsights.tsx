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
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import {
  Clock,
  Download,
  Eye,
  Globe,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useAnalytics } from '../../hooks/useAnalytics';

interface AudienceInsightsProps {
  userId: number;
  filters: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const AudienceInsights: React.FC<AudienceInsightsProps> = ({
  userId}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [insightType, setInsightType] = useState<'demographics' | 'behavior' | 'growth'>('demographics');

  const {
    audienceData,
    loading,
    fetchAudienceInsights
  } = useAnalytics();

  useEffect(() => {
    fetchAudienceInsights(userId);
  }, [userId, fetchAudienceInsights]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };



  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Box>
      {/* Header Controls */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">
          Audience Insights
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Platform</InputLabel>
            <Select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
            >
              <MenuItem value="all">All Platforms</MenuItem>
              <MenuItem value="facebook">Facebook</MenuItem>
              <MenuItem value="instagram">Instagram</MenuItem>
              <MenuItem value="tiktok">TikTok</MenuItem>
              <MenuItem value="youtube">YouTube</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<Download />}
            size="small"
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Insight Type Tabs */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Button
          variant={insightType === 'demographics' ? 'contained' : 'text'}
          onClick={() => setInsightType('demographics')}
          sx={{ mr: 1 }}
        >
          Demographics
        </Button>
        <Button
          variant={insightType === 'behavior' ? 'contained' : 'text'}
          onClick={() => setInsightType('behavior')}
          sx={{ mr: 1 }}
        >
          Behavior Patterns
        </Button>
        <Button
          variant={insightType === 'growth' ? 'contained' : 'text'}
          onClick={() => setInsightType('growth')}
        >
          Growth Tracking
        </Button>
      </Box>

      {/* Demographics View */}
      {insightType === 'demographics' && (
        <Grid container spacing={3}>
          {/* Age Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Age Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={audienceData?.demographics?.ageGroups || [
                        { age: '18-24', percentage: 25 },
                        { age: '25-34', percentage: 35 },
                        { age: '35-44', percentage: 20 },
                        { age: '45-54', percentage: 15 },
                        { age: '55+', percentage: 5 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {(audienceData?.demographics?.ageGroups || []).map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="20%" 
                    outerRadius="90%" 
                    data={audienceData?.demographics?.genderDistribution || [
                      { gender: 'Female', percentage: 60, fill: '#FF8042' },
                      { gender: 'Male', percentage: 35, fill: '#0088FE' },
                      { gender: 'Other', percentage: 5, fill: '#00C49F' }
                    ]}
                  >
                    <RadialBar dataKey="percentage" cornerRadius={10} fill="#8884d8" />
                    <Legend />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Geographic Distribution */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Geographic Distribution
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart 
                        data={audienceData?.demographics?.locationDistribution || [
                          { location: 'United States', percentage: 35 },
                          { location: 'United Kingdom', percentage: 20 },
                          { location: 'Canada', percentage: 15 },
                          { location: 'Australia', percentage: 12 },
                          { location: 'Germany', percentage: 10 },
                          { location: 'Others', percentage: 8 }
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="location" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `${value}%`} />
                        <Bar dataKey="percentage" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" gutterBottom>
                      Top Locations
                    </Typography>
                    <List dense>
                      {(audienceData?.demographics?.locationDistribution || []).slice(0, 5).map((location: any, index: number) => (
                        <ListItem key={location.location}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: COLORS[index % COLORS.length], width: 32, height: 32 }}>
                              {index + 1}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={location.location}
                            secondary={`${location.percentage}% of audience`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Behavior Patterns View */}
      {insightType === 'behavior' && (
        <Grid container spacing={3}>
          {/* Peak Engagement Hours */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Peak Engagement Hours
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart 
                    data={audienceData?.behaviorPatterns?.peakEngagementHours || [
                      { hour: 0, engagementRate: 0.02 },
                      { hour: 6, engagementRate: 0.05 },
                      { hour: 9, engagementRate: 0.15 },
                      { hour: 12, engagementRate: 0.25 },
                      { hour: 15, engagementRate: 0.20 },
                      { hour: 18, engagementRate: 0.30 },
                      { hour: 21, engagementRate: 0.35 },
                      { hour: 23, engagementRate: 0.10 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(hour) => `${hour}:00`}
                    />
                    <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                    <Tooltip 
                      labelFormatter={(hour) => `${hour}:00`}
                      formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Engagement Rate']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="engagementRate" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Content Preferences */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Content Preferences
                </Typography>
                <Box>
                  {(audienceData?.behaviorPatterns?.contentPreferences || [
                    { type: 'Video', preference: 85 },
                    { type: 'Images', preference: 70 },
                    { type: 'Text', preference: 45 },
                    { type: 'Stories', preference: 60 },
                    { type: 'Live', preference: 30 }
                  ]).map((item: any) => (
                    <Box key={item.type} sx={{ mb: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2">{item.type}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {item.preference}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={item.preference} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Engagement Actions */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Engagement Action Breakdown
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2}>
                      <Eye size={40} color="#1976d2" />
                      <Typography variant="h4" sx={{ mt: 1 }}>
                        {formatNumber(125000)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Views
                      </Typography>
                      <Chip 
                        label="+12.5%" 
                        size="small" 
                        color="success" 
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2}>
                      <Heart size={40} color="#f44336" />
                      <Typography variant="h4" sx={{ mt: 1 }}>
                        {formatNumber(8500)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Likes
                      </Typography>
                      <Chip 
                        label="+8.3%" 
                        size="small" 
                        color="success" 
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2}>
                      <Share2 size={40} color="#ff9800" />
                      <Typography variant="h4" sx={{ mt: 1 }}>
                        {formatNumber(1200)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Shares
                      </Typography>
                      <Chip 
                        label="-2.1%" 
                        size="small" 
                        color="error" 
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2}>
                      <MessageCircle size={40} color="#9c27b0" />
                      <Typography variant="h4" sx={{ mt: 1 }}>
                        {formatNumber(3400)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Comments
                      </Typography>
                      <Chip 
                        label="+15.7%" 
                        size="small" 
                        color="success" 
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Growth Tracking View */}
      {insightType === 'growth' && (
        <Grid container spacing={3}>
          {/* Follower Growth */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Follower Growth Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart 
                    data={audienceData?.growthMetrics?.followerGrowth || [
                      { date: '2024-01-01', followers: 10000 },
                      { date: '2024-01-15', followers: 10500 },
                      { date: '2024-02-01', followers: 11200 },
                      { date: '2024-02-15', followers: 12000 },
                      { date: '2024-03-01', followers: 12800 },
                      { date: '2024-03-15', followers: 13500 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={formatNumber} />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      formatter={(value: number) => [formatNumber(value), 'Followers']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="followers" 
                      stroke="#8884d8" 
                      strokeWidth={3}
                      dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Engagement Growth */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Engagement Rate Growth
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart 
                    data={audienceData?.growthMetrics?.engagementGrowth || [
                      { date: '2024-01-01', engagementRate: 0.045 },
                      { date: '2024-01-15', engagementRate: 0.052 },
                      { date: '2024-02-01', engagementRate: 0.048 },
                      { date: '2024-02-15', engagementRate: 0.055 },
                      { date: '2024-03-01', engagementRate: 0.062 },
                      { date: '2024-03-15', engagementRate: 0.058 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `${(value * 100).toFixed(1)}%`} />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, 'Engagement Rate']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="engagementRate" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Growth Summary Cards */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          New Followers
                        </Typography>
                        <Typography variant="h5">
                          +{formatNumber(3500)}
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          +35% this month
                        </Typography>
                      </Box>
                      <Users size={40} color="#1976d2" />
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
                          Avg. Engagement
                        </Typography>
                        <Typography variant="h5">
                          5.8%
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          +0.8% this month
                        </Typography>
                      </Box>
                      <TrendingUp size={40} color="#4caf50" />
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
                          Reach Growth
                        </Typography>
                        <Typography variant="h5">
                          +28%
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          vs last month
                        </Typography>
                      </Box>
                      <Globe size={40} color="#ff9800" />
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
                          Best Time
                        </Typography>
                        <Typography variant="h5">
                          9 PM
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Peak engagement
                        </Typography>
                      </Box>
                      <Clock size={40} color="#9c27b0" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}

      {!audienceData && !loading && (
        <Alert severity="info">
          No audience data available for the selected filters. Try adjusting your time range or platform selection.
        </Alert>
      )}
    </Box>
  );
};