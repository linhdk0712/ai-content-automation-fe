import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  Psychology,
  CompareArrows,
  Lightbulb,
  AttachMoney,
  Speed,
  Refresh,
  Download,
  Settings,
  Notifications
} from '@mui/icons-material';
import { useAdvancedAnalytics } from '../../hooks/useAdvancedAnalytics';
import { PredictiveAnalyticsPanel } from './PredictiveAnalyticsPanel.tsx';
import { CustomReportBuilder } from './CustomReportBuilder.tsx';
import { CompetitiveAnalysisPanel } from './CompetitiveAnalysisPanel.tsx';
import { AutomatedInsightsPanel } from './AutomatedInsightsPanel.tsx';
import { ROITrackingPanel } from './ROITrackingPanel.tsx';
import { RealTimeAnalyticsPanel } from './RealTimeAnalyticsPanel.tsx';

interface AdvancedAnalyticsDashboardProps {
  workspaceId: string;
  userId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  workspaceId,
  userId
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [timeRange, setTimeRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const {
    dashboard,
    predictiveAnalytics,
    competitiveAnalysis,
    automatedInsights,
    roiTracking,
    realTimeAnalytics,
    loading,
    error,
    generateDashboard,
    generatePredictiveAnalytics,
    getCompetitiveAnalysis,
    getAutomatedInsights,
    getROITracking,
    startRealTimeStreaming,
    stopRealTimeStreaming,
    exportAnalytics
  } = useAdvancedAnalytics();

  // Load initial data
  useEffect(() => {
    loadAnalyticsData();
  }, [workspaceId, userId, timeRange]);

  // Handle real-time streaming
  useEffect(() => {
    if (realTimeEnabled) {
      startRealTimeStreaming(workspaceId, `session_${Date.now()}`);
    } else {
      stopRealTimeStreaming(workspaceId, `session_${Date.now()}`);
    }

    return () => {
      if (realTimeEnabled) {
        stopRealTimeStreaming(workspaceId, `session_${Date.now()}`);
      }
    };
  }, [realTimeEnabled, workspaceId]);

  const loadAnalyticsData = useCallback(async () => {
    try {
      await Promise.all([
        generateDashboard(userId, workspaceId, timeRange.startDate, timeRange.endDate),
        generatePredictiveAnalytics(userId, workspaceId, {
          contentType: 'all',
          platforms: ['facebook', 'instagram', 'twitter'],
          timeHorizon: 30
        }),
        getCompetitiveAnalysis(workspaceId, timeRange.startDate, timeRange.endDate),
        getAutomatedInsights(userId, workspaceId, timeRange.startDate, timeRange.endDate),
        getROITracking(userId, workspaceId, timeRange.startDate, timeRange.endDate)
      ]);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  }, [userId, workspaceId, timeRange]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    loadAnalyticsData();
  };

  const handleExport = async (format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON') => {
    try {
      await exportAnalytics(userId, {
        workspaceId,
        timeRange,
        format,
        configuration: {
          includeCharts: true,
          includePredictions: true,
          includeInsights: true
        }
      });
    } catch (error) {
      console.error('Failed to export analytics:', error);
    }
  };

  const handleRealTimeToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRealTimeEnabled(event.target.checked);
  };

  if (loading && !dashboard) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Advanced Analytics...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load analytics data: {error.message}
        <Button onClick={handleRefresh} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Advanced Analytics Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              AI-powered insights, predictions, and real-time analytics
            </Typography>
          </Grid>
          <Grid item>
            <Box display="flex" alignItems="center" gap={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={realTimeEnabled}
                    onChange={handleRealTimeToggle}
                    color="primary"
                  />
                }
                label="Real-time Updates"
              />
              <Tooltip title="Refresh Data">
                <IconButton onClick={handleRefresh} disabled={loading}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => handleExport('PDF')}
              >
                Export
              </Button>
              <Button
                variant="contained"
                startIcon={<Settings />}
              >
                Configure
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Key Metrics Summary */}
        {dashboard && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <TrendingUp color="primary" />
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="h6">
                        {dashboard.performanceSummary?.overallScore?.toFixed(1) || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Performance Score
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Psychology color="secondary" />
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="h6">
                        {(dashboard.predictiveInsights?.overallConfidence * 100)?.toFixed(0) || 'N/A'}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        AI Confidence
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <AttachMoney color="success" />
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="h6">
                        {dashboard.roiMetrics?.overallROI?.roi?.toFixed(1) || 'N/A'}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ROI
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Lightbulb color="warning" />
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="h6">
                        {dashboard.automatedInsights?.length || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Insights
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <CompareArrows color="info" />
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="h6">
                        {dashboard.competitiveAnalysis?.positioning?.overallScore?.toFixed(1) || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Market Position
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Speed color="error" />
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="h6">
                        {realTimeEnabled ? 'Live' : 'Static'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Data Mode
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Active Alerts */}
        {dashboard?.alerts && dashboard.alerts.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Active Alerts
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {dashboard.alerts.slice(0, 5).map((alert: any, index: number) => (
                <Chip
                  key={index}
                  icon={<Notifications />}
                  label={alert.title}
                  color={alert.severity === 'HIGH' ? 'error' : alert.severity === 'MEDIUM' ? 'warning' : 'info'}
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="analytics tabs">
          <Tab
            icon={<Psychology />}
            label="Predictive Analytics"
            id="analytics-tab-0"
            aria-controls="analytics-tabpanel-0"
          />
          <Tab
            icon={<Settings />}
            label="Custom Reports"
            id="analytics-tab-1"
            aria-controls="analytics-tabpanel-1"
          />
          <Tab
            icon={<CompareArrows />}
            label="Competitive Analysis"
            id="analytics-tab-2"
            aria-controls="analytics-tabpanel-2"
          />
          <Tab
            icon={<Lightbulb />}
            label="Automated Insights"
            id="analytics-tab-3"
            aria-controls="analytics-tabpanel-3"
          />
          <Tab
            icon={<AttachMoney />}
            label="ROI Tracking"
            id="analytics-tab-4"
            aria-controls="analytics-tabpanel-4"
          />
          <Tab
            icon={<Speed />}
            label="Real-time Analytics"
            id="analytics-tab-5"
            aria-controls="analytics-tabpanel-5"
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        <PredictiveAnalyticsPanel
          workspaceId={workspaceId}
          userId={userId}
          data={predictiveAnalytics}
          loading={loading}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <CustomReportBuilder
          workspaceId={workspaceId}
          userId={userId}
          timeRange={timeRange}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <CompetitiveAnalysisPanel
          workspaceId={workspaceId}
          data={competitiveAnalysis}
          loading={loading}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <AutomatedInsightsPanel
          workspaceId={workspaceId}
          userId={userId}
          data={automatedInsights}
          loading={loading}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <ROITrackingPanel
          workspaceId={workspaceId}
          userId={userId}
          data={roiTracking}
          loading={loading}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={5}>
        <RealTimeAnalyticsPanel
          workspaceId={workspaceId}
          data={realTimeAnalytics}
          enabled={realTimeEnabled}
          loading={loading}
        />
      </TabPanel>
    </Box>
  );
};