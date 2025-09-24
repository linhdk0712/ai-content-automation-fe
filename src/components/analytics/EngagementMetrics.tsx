import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Download, TrendingUp, TrendingDown, Eye, Heart, Share2, MessageCircle } from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';

interface EngagementMetricsProps {
  userId: number;
  filters: any;
}

interface EngagementBreakdown {
  type: string;
  count: number;
  percentage: number;
  change: number;
  [key: string]: number | string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const EngagementMetrics: React.FC<EngagementMetricsProps> = ({
  userId,
  filters
}) => {
  const [selectedContent, setSelectedContent] = useState<number | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [viewType, setViewType] = useState<'timeline' | 'breakdown' | 'comparison'>('timeline');

  const {
    engagementData,
    loading,
    fetchEngagementMetrics,
    exportEngagementData
  } = useAnalytics();

  useEffect(() => {
    if (selectedContent) {
      fetchEngagementMetrics(selectedContent, selectedPlatform, filters.startDate, filters.endDate);
    }
  }, [selectedContent, selectedPlatform, filters, fetchEngagementMetrics]);

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

  const getEngagementBreakdown = (): EngagementBreakdown[] => {
    if (!engagementData) return [];

    const total = engagementData.totalEngagements;
    return [
      {
        type: 'Likes',
        count: engagementData.totalLikes,
        percentage: (engagementData.totalLikes / total) * 100,
        change: 12.5
      },
      {
        type: 'Shares',
        count: engagementData.totalShares,
        percentage: (engagementData.totalShares / total) * 100,
        change: -2.3
      },
      {
        type: 'Comments',
        count: engagementData.totalComments,
        percentage: (engagementData.totalComments / total) * 100,
        change: 8.7
      }
    ];
  };

  const handleExport = async () => {
    try {
      await exportEngagementData({
        userId,
        contentId: selectedContent,
        platform: selectedPlatform,
        startDate: filters.startDate,
        endDate: filters.endDate,
        format: 'excel'
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <Box>
      {/* Header Controls */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5">
          Engagement Metrics
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Content</InputLabel>
            <Select
              value={selectedContent || ''}
              onChange={(e) => setSelectedContent(e.target.value as number)}
            >
              <MenuItem value="">All Content</MenuItem>
              {/* Content options would be loaded dynamically */}
              <MenuItem value={1}>Sample Post 1</MenuItem>
              <MenuItem value={2}>Sample Post 2</MenuItem>
            </Select>
          </FormControl>

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
            <InputLabel>View</InputLabel>
            <Select
              value={viewType}
              onChange={(e) => setViewType(e.target.value as any)}
            >
              <MenuItem value="timeline">Timeline</MenuItem>
              <MenuItem value="breakdown">Breakdown</MenuItem>
              <MenuItem value="comparison">Comparison</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
            size="small"
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Engagement Overview Cards */}
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
                    {formatNumber(engagementData?.totalViews || 0)}
                  </Typography>
                </Box>
                <Eye size={32} color="#1976d2" />
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
                    {formatNumber(engagementData?.totalLikes || 0)}
                  </Typography>
                </Box>
                <Heart size={32} color="#f44336" />
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
                    {formatNumber(engagementData?.totalShares || 0)}
                  </Typography>
                </Box>
                <Share2 size={32} color="#ff9800" />
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
                    {formatPercentage(engagementData?.engagementRate || 0)}
                  </Typography>
                </Box>
                <MessageCircle size={32} color="#9c27b0" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Area */}
      {viewType === 'timeline' && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Engagement Timeline
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={engagementData?.timeline || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="engagements"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Total Engagements"
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stackId="2"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      name="Views"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Engagement Rate Trend
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={engagementData?.timeline || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line
                      type="monotone"
                      dataKey="engagementRate"
                      stroke="#ff7300"
                      strokeWidth={3}
                      dot={{ fill: '#ff7300' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {viewType === 'breakdown' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Engagement Type Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getEngagementBreakdown()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => `${props.type} ${Number(props.percentage).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {getEngagementBreakdown().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Engagement Details
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">Percentage</TableCell>
                        <TableCell align="right">Change</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getEngagementBreakdown().map((row) => (
                        <TableRow key={row.type}>
                          <TableCell component="th" scope="row">
                            {row.type}
                          </TableCell>
                          <TableCell align="right">
                            {formatNumber(row.count)}
                          </TableCell>
                          <TableCell align="right">
                            {row.percentage.toFixed(1)}%
                          </TableCell>
                          <TableCell align="right">
                            <Box display="flex" alignItems="center" justifyContent="flex-end">
                              {row.change > 0 ? (
                                <TrendingUp size={16} color="#4caf50" />
                              ) : (
                                <TrendingDown size={16} color="#f44336" />
                              )}
                              <Typography
                                variant="body2"
                                color={row.change > 0 ? 'success.main' : 'error.main'}
                                sx={{ ml: 0.5 }}
                              >
                                {Math.abs(row.change).toFixed(1)}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Audience Demographics */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Engagement by Demographics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" gutterBottom>
                      By Age Group
                    </Typography>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={[
                        { age: '18-24', engagements: 1200 },
                        { age: '25-34', engagements: 2100 },
                        { age: '35-44', engagements: 1800 },
                        { age: '45-54', engagements: 900 },
                        { age: '55+', engagements: 600 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="age" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="engagements" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" gutterBottom>
                      By Gender
                    </Typography>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Female', value: 60 },
                            { name: 'Male', value: 35 },
                            { name: 'Other', value: 5 }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name} ${value}%`}
                        >
                          {[0, 1, 2].map((index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" gutterBottom>
                      By Location
                    </Typography>
                    <Box>
                      {[
                        { location: 'United States', percentage: 35 },
                        { location: 'United Kingdom', percentage: 20 },
                        { location: 'Canada', percentage: 15 },
                        { location: 'Australia', percentage: 12 },
                        { location: 'Germany', percentage: 10 },
                        { location: 'Others', percentage: 8 }
                      ].map((item) => (
                        <Box key={item.location} sx={{ mb: 1 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">{item.location}</Typography>
                            <Typography variant="body2">{item.percentage}%</Typography>
                          </Box>
                          <Box
                            sx={{
                              width: '100%',
                              height: 8,
                              backgroundColor: '#e0e0e0',
                              borderRadius: 4,
                              overflow: 'hidden'
                            }}
                          >
                            <Box
                              sx={{
                                width: `${item.percentage}%`,
                                height: '100%',
                                backgroundColor: '#1976d2',
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {viewType === 'comparison' && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Platform Comparison
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={[
                { platform: 'Facebook', likes: 1200, shares: 300, comments: 150 },
                { platform: 'Instagram', likes: 2100, shares: 450, comments: 280 },
                { platform: 'TikTok', likes: 3200, shares: 800, comments: 420 },
                { platform: 'YouTube', likes: 1800, shares: 200, comments: 350 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="platform" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="likes" fill="#8884d8" name="Likes" />
                <Bar dataKey="shares" fill="#82ca9d" name="Shares" />
                <Bar dataKey="comments" fill="#ffc658" name="Comments" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};