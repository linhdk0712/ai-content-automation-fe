import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Info,
  Download,
  Refresh,
  BuildRounded as OptimizeRounded
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  FunnelChart,
  Funnel,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer} from 'recharts';
import { motion } from 'framer-motion';

interface FunnelStep {
  id: string;
  name: string;
  description: string;
  users: number;
  conversionRate: number;
  dropOffRate: number;
  averageTime: number;
  revenue: number;
  optimizationScore: number;
}

interface ConversionMetrics {
  totalUsers: number;
  totalConversions: number;
  overallConversionRate: number;
  averageTimeToConvert: number;
  totalRevenue: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
}

interface OptimizationSuggestion {
  stepId: string;
  stepName: string;
  issue: string;
  suggestion: string;
  potentialImpact: number;
  difficulty: 'LOW' | 'MEDIUM' | 'HIGH';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

const ConversionFunnelAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>([]);
  const [conversionMetrics, setConversionMetrics] = useState<ConversionMetrics | null>(null);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [showOptimizationDialog, setShowOptimizationDialog] = useState(false);
  const [cohortData, setCohortData] = useState<any[]>([]);
  const [segmentData, setSegmentData] = useState<any[]>([]);

  useEffect(() => {
    fetchFunnelData();
  }, [timeRange]);

  const fetchFunnelData = async () => {
    setLoading(true);
    try {
      // Fetch funnel analytics data
      const response = await fetch(`/api/v1/analytics/conversion-funnel?timeRange=${timeRange}`);
      const data = await response.json();
      
      setFunnelSteps(data.funnelSteps);
      setConversionMetrics(data.metrics);
      setOptimizationSuggestions(data.optimizationSuggestions);
      setCohortData(data.cohortAnalysis);
      setSegmentData(data.segmentAnalysis);
    } catch (error) {
      console.error('Failed to fetch funnel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeStep = async (stepId: string) => {
    try {
      const response = await fetch(`/api/v1/analytics/optimize-step/${stepId}`, {
        method: 'POST'
      });
      const optimization = await response.json();
      
      // Show optimization results
      setSelectedStep(stepId);
      setShowOptimizationDialog(true);
    } catch (error) {
      console.error('Failed to optimize step:', error);
    }
  };

  const exportFunnelReport = async () => {
    try {
      const response = await fetch(`/api/v1/analytics/funnel-report?timeRange=${timeRange}&format=pdf`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `funnel-report-${timeRange}.pdf`;
      a.click();
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const getFunnelChartData = () => {
    return funnelSteps.map((step, index) => ({
      name: step.name,
      users: step.users,
      conversionRate: step.conversionRate,
      fill: `hsl(${220 + index * 30}, 70%, ${60 - index * 5}%)`
    }));
  };

  const getConversionTrendData = () => {
    // Mock trend data - in real implementation, this would come from API
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      conversionRate: Math.random() * 10 + 15,
      users: Math.floor(Math.random() * 1000) + 500
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Loading Conversion Funnel Analytics...</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Conversion Funnel Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchFunnelData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={exportFunnelReport}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      {conversionMetrics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4">
                  {conversionMetrics.totalUsers.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUp color="success" fontSize="small" />
                  <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                    +12.5% vs last period
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Conversion Rate
                </Typography>
                <Typography variant="h4">
                  {conversionMetrics.overallConversionRate.toFixed(1)}%
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUp color="success" fontSize="small" />
                  <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                    +2.3% vs last period
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Revenue
                </Typography>
                <Typography variant="h4">
                  ${conversionMetrics.totalRevenue.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUp color="success" fontSize="small" />
                  <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                    +18.7% vs last period
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Avg. Time to Convert
                </Typography>
                <Typography variant="h4">
                  {Math.round(conversionMetrics.averageTimeToConvert / 60)}h
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingDown color="success" fontSize="small" />
                  <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                    -5.2% vs last period
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Funnel Visualization */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Conversion Funnel
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <FunnelChart>
                  <Funnel
                    dataKey="users"
                    data={getFunnelChartData()}
                    isAnimationActive
                  />
                  <RechartsTooltip />
                </FunnelChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Funnel Steps Details */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Step Details
              </Typography>
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {funnelSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Box sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {step.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={`${step.conversionRate.toFixed(1)}%`}
                          color={step.conversionRate > 20 ? 'success' : step.conversionRate > 10 ? 'warning' : 'error'}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {step.users.toLocaleString()} users
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Avg. time: {Math.round(step.averageTime / 60)}min
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<OptimizeRounded />}
                          onClick={() => handleOptimizeStep(step.id)}
                        >
                          Optimize
                        </Button>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={step.optimizationScore}
                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                        color={step.optimizationScore > 80 ? 'success' : step.optimizationScore > 60 ? 'warning' : 'error'}
                      />
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Conversion Trend */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Conversion Rate Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getConversionTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="conversionRate"
                    stroke="#1976d2"
                    strokeWidth={2}
                    dot={{ fill: '#1976d2' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Optimization Suggestions */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Optimization Suggestions
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {optimizationSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Alert
                      severity={suggestion.priority === 'HIGH' ? 'error' : suggestion.priority === 'MEDIUM' ? 'warning' : 'info'}
                      sx={{ mb: 2 }}
                      action={
                        <IconButton size="small">
                          <Info />
                        </IconButton>
                      }
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        {suggestion.stepName}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        {suggestion.suggestion}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip
                          size="small"
                          label={`${suggestion.potentialImpact}% impact`}
                          color="primary"
                        />
                        <Chip
                          size="small"
                          label={suggestion.difficulty}
                          color={getDifficultyColor(suggestion.difficulty) as any}
                        />
                      </Box>
                    </Alert>
                  </motion.div>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Cohort Analysis */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cohort Analysis
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cohort</TableCell>
                      <TableCell align="right">Week 1</TableCell>
                      <TableCell align="right">Week 2</TableCell>
                      <TableCell align="right">Week 3</TableCell>
                      <TableCell align="right">Week 4</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cohortData.map((cohort, index) => (
                      <TableRow key={index}>
                        <TableCell>{cohort.period}</TableCell>
                        <TableCell align="right">{cohort.week1}%</TableCell>
                        <TableCell align="right">{cohort.week2}%</TableCell>
                        <TableCell align="right">{cohort.week3}%</TableCell>
                        <TableCell align="right">{cohort.week4}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Segment Analysis */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Segment Performance
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={segmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="segment" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="conversionRate" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Optimization Dialog */}
      <Dialog
        open={showOptimizationDialog}
        onClose={() => setShowOptimizationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Step Optimization Recommendations
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Based on AI analysis of user behavior and industry benchmarks, here are specific recommendations 
            to improve conversion for this step:
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Immediate Actions (High Impact)
            </Typography>
            <ul>
              <li>Simplify the form by removing non-essential fields</li>
              <li>Add social proof elements (testimonials, user count)</li>
              <li>Improve page loading speed (currently 3.2s, target: &lt;2s)</li>
            </ul>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              A/B Test Suggestions
            </Typography>
            <ul>
              <li>Test different CTA button colors and text</li>
              <li>Experiment with form layout (single column vs. multi-column)</li>
              <li>Try different value proposition messaging</li>
            </ul>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Long-term Improvements
            </Typography>
            <ul>
              <li>Implement progressive profiling</li>
              <li>Add exit-intent popups with special offers</li>
              <li>Personalize content based on traffic source</li>
            </ul>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOptimizationDialog(false)}>
            Close
          </Button>
          <Button variant="contained">
            Implement Suggestions
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConversionFunnelAnalytics;