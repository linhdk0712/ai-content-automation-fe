import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  PolarRadiusAxis
} from 'recharts';
import { Star, Award, Target, Download, TrendingUp } from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';

interface ContentComparisonProps {
  userId: number;
  filters: any;
}

interface ContentItem {
  id: number;
  title: string;
  platform: string;
  contentType: string;
  publishedAt: string;
  thumbnailUrl?: string;
  metrics: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    engagementRate: number;
    roi: number;
  };
  rank: number;
  score: number;
}

const METRICS_OPTIONS = [
  { value: 'views', label: 'Views' },
  { value: 'engagementRate', label: 'Engagement Rate' },
  { value: 'likes', label: 'Likes' },
  { value: 'shares', label: 'Shares' },
  { value: 'comments', label: 'Comments' },
  { value: 'roi', label: 'ROI' }
];

export const ContentComparison: React.FC<ContentComparisonProps> = ({
  userId,
  filters
}) => {
  const [selectedContent, setSelectedContent] = useState<number[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['views', 'engagementRate']);
  const [comparisonType, setComparisonType] = useState<'absolute' | 'percentage' | 'normalized'>('absolute');
  const [viewMode, setViewMode] = useState<'table' | 'chart' | 'radar'>('table');

  const {
    contentList,
    comparisonData,
    loading,
    fetchContentList,
    compareContent
  } = useAnalytics();

  useEffect(() => {
    fetchContentList(userId, filters);
  }, [userId, filters, fetchContentList]);

  useEffect(() => {
    if (selectedContent.length > 1) {
      compareContent({
        contentIds: selectedContent,
        platforms: filters.platforms,
        startDate: filters.startDate,
        endDate: filters.endDate,
        metrics: selectedMetrics,
        comparisonType
      });
    }
  }, [selectedContent, selectedMetrics, comparisonType, compareContent]);

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

  const getPerformanceColor = (rank: number, total: number): string => {
    const percentile = (total - rank + 1) / total;
    if (percentile >= 0.8) return '#4caf50'; // Green for top 20%
    if (percentile >= 0.6) return '#ff9800'; // Orange for top 40%
    return '#f44336'; // Red for bottom 60%
  };

  const getRadarData = () => {
    if (!comparisonData?.contentPerformances) return [];

    return selectedMetrics.map(metric => {
      const data: any = { metric: METRICS_OPTIONS.find(m => m.value === metric)?.label || metric };
      
      comparisonData.contentPerformances.forEach((content: any, index: number) => {
        data[`content${index}`] = content.metrics[metric] || 0;
      });
      
      return data;
    });
  };

  const getScatterData = () => {
    if (!comparisonData?.contentPerformances) return [];

    return comparisonData.contentPerformances.map((content: any) => ({
      x: content.metrics.views || 0,
      y: content.metrics.engagementRate || 0,
      z: content.metrics.roi || 0,
      name: content.contentTitle
    }));
  };

  const handleContentSelection = (contentId: number) => {
    if (selectedContent.includes(contentId)) {
      setSelectedContent(prev => prev.filter(id => id !== contentId));
    } else if (selectedContent.length < 5) {
      setSelectedContent(prev => [...prev, contentId]);
    }
  };

  return (
    <Box>
      {/* Header Controls */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Content Performance Comparison
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Comparison Type</InputLabel>
              <Select
                value={comparisonType}
                onChange={(e) => setComparisonType(e.target.value as any)}
              >
                <MenuItem value="absolute">Absolute Values</MenuItem>
                <MenuItem value="percentage">Percentage Change</MenuItem>
                <MenuItem value="normalized">Normalized (0-100)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Metrics</InputLabel>
              <Select
                multiple
                value={selectedMetrics}
                onChange={(e) => setSelectedMetrics(e.target.value as string[])}
                input={<OutlinedInput label="Metrics" />}
                renderValue={(selected) => selected.join(', ')}
              >
                {METRICS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Checkbox checked={selectedMetrics.indexOf(option.value) > -1} />
                    <ListItemText primary={option.label} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>View Mode</InputLabel>
              <Select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
              >
                <MenuItem value="table">Table View</MenuItem>
                <MenuItem value="chart">Chart View</MenuItem>
                <MenuItem value="radar">Radar Chart</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setSelectedContent([])}
              disabled={selectedContent.length === 0}
            >
              Clear Selection
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Content Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Select Content to Compare (Choose 2-5 items)
          </Typography>
          
          <Grid container spacing={2}>
            {(contentList || []).map((content: ContentItem) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={content.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedContent.includes(content.id) ? 2 : 1,
                    borderColor: selectedContent.includes(content.id) ? 'primary.main' : 'divider',
                    '&:hover': {
                      boxShadow: 2
                    }
                  }}
                  onClick={() => handleContentSelection(content.id)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      {content.thumbnailUrl && (
                        <Avatar
                          src={content.thumbnailUrl}
                          sx={{ width: 40, height: 40, mr: 1 }}
                        />
                      )}
                      <Box flex={1}>
                        <Typography variant="subtitle2" noWrap>
                          {content.title}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={content.platform}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            label={content.contentType}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="textSecondary">
                        Views: {formatNumber(content.metrics.views)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Rank: #{content.rank}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" mt={1}>
                      {content.rank <= 3 && (
                        <Award size={16} color={getPerformanceColor(content.rank, 10)} />
                      )}
                      <Typography variant="body2" sx={{ ml: 0.5 }}>
                        {formatPercentage(content.metrics.engagementRate)} engagement
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {selectedContent.length >= 2 && (
        <>
          {/* Comparison Controls */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Comparison Results ({selectedContent.length} items)
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => {/* Export comparison */}}
              size="small"
            >
              Export Comparison
            </Button>
          </Box>

          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          )}

          {!loading && comparisonData && (
            <>
              {/* Table View */}
              {viewMode === 'table' && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Performance Comparison Table
                    </Typography>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Content</TableCell>
                            <TableCell>Platform</TableCell>
                            {selectedMetrics.map((metric) => (
                              <TableCell key={metric} align="right">
                                {METRICS_OPTIONS.find(m => m.value === metric)?.label}
                              </TableCell>
                            ))}
                            <TableCell align="right">Rank</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {comparisonData.contentPerformances.map((content: any, index: number) => (
                            <TableRow key={content.contentId}>
                              <TableCell component="th" scope="row">
                                <Box display="flex" alignItems="center">
                                  <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                    {index + 1}
                                  </Avatar>
                                  <Typography variant="body2">
                                    {content.contentTitle}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip label="Multi-platform" size="small" />
                              </TableCell>
                              {selectedMetrics.map((metric) => (
                                <TableCell key={metric} align="right">
                                  <Typography variant="body2">
                                    {metric === 'engagementRate' || metric === 'roi' 
                                      ? formatPercentage(content.metrics[metric] || 0)
                                      : formatNumber(content.metrics[metric] || 0)
                                    }
                                  </Typography>
                                </TableCell>
                              ))}
                              <TableCell align="right">
                                <Box display="flex" alignItems="center" justifyContent="flex-end">
                                  {index < 3 && <Star size={16} color="#ffd700" />}
                                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                                    #{index + 1}
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
              )}

              {/* Chart View */}
              {viewMode === 'chart' && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} lg={8}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Performance Comparison Chart
                        </Typography>
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={comparisonData.contentPerformances}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="contentTitle" 
                              angle={-45}
                              textAnchor="end"
                              height={100}
                            />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            {selectedMetrics.map((metric, index) => (
                              <Bar
                                key={metric}
                                dataKey={`metrics.${metric}`}
                                fill={`hsl(${index * 60}, 70%, 50%)`}
                                name={METRICS_OPTIONS.find(m => m.value === metric)?.label}
                              />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} lg={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Performance vs Engagement
                        </Typography>
                        <ResponsiveContainer width="100%" height={400}>
                          <ScatterChart data={getScatterData()}>
                            <CartesianGrid />
                            <XAxis 
                              type="number" 
                              dataKey="x" 
                              name="Views"
                              tickFormatter={formatNumber}
                            />
                            <YAxis 
                              type="number" 
                              dataKey="y" 
                              name="Engagement Rate"
                              tickFormatter={formatPercentage}
                            />
                            <Tooltip 
                              cursor={{ strokeDasharray: '3 3' }}
                              formatter={(value: number, name: string) => [
                                name === 'x' ? formatNumber(value) : formatPercentage(value),
                                name === 'x' ? 'Views' : 'Engagement Rate'
                              ]}
                            />
                            <Scatter dataKey="y" fill="#8884d8" />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Radar Chart View */}
              {viewMode === 'radar' && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Multi-Metric Radar Comparison
                    </Typography>
                    <ResponsiveContainer width="100%" height={500}>
                      <RadarChart data={getRadarData()}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" />
                        <PolarRadiusAxis />
                        <Tooltip />
                        <Legend />
                        {comparisonData.contentPerformances.map((_: any, index: number) => (
                          <Radar
                            key={`content${index}`}
                            name={`Content ${index + 1}`}
                            dataKey={`content${index}`}
                            stroke={`hsl(${index * 60}, 70%, 50%)`}
                            fill={`hsl(${index * 60}, 70%, 50%)`}
                            fillOpacity={0.1}
                            strokeWidth={2}
                          />
                        ))}
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Performance Insights */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Insights & Recommendations
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Award size={20} color="#2e7d32" />
                          <Typography variant="subtitle2" sx={{ ml: 1, color: 'success.dark' }}>
                            Top Performer
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="success.dark">
                          {comparisonData.contentPerformances[0]?.contentTitle} leads with highest engagement rate
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Target size={20} color="#ed6c02" />
                          <Typography variant="subtitle2" sx={{ ml: 1, color: 'warning.dark' }}>
                            Improvement Opportunity
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="warning.dark">
                          Focus on increasing shares for better viral potential
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <TrendingUp size={20} color="#0288d1" />
                          <Typography variant="subtitle2" sx={{ ml: 1, color: 'info.dark' }}>
                            Growth Trend
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="info.dark">
                          Video content shows 23% higher engagement than images
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {selectedContent.length < 2 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          Select at least 2 content items to start comparison analysis
        </Alert>
      )}
    </Box>
  );
};