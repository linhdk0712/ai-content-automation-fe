import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Analytics,
  Search,
  DragIndicator,
  Keyboard,
  PlayArrow,
  Stop,
  Groups as Collaboration
} from '@mui/icons-material';

// Import our advanced components
import { CollaborativeEditor } from '../collaboration/CollaborativeEditor';
import { DragDropWorkflowDesigner } from '../workflow/DragDropWorkflowDesigner';
import { InteractiveAnalyticsDashboard } from '../analytics/InteractiveAnalyticsDashboard';
import { AdvancedSearchInterface } from '../search/AdvancedSearchInterface';
import { KeyboardShortcutsManager, KeyboardShortcutsProvider } from '../shortcuts/KeyboardShortcutsSystem';
import { useAdvancedFeatures } from '../../hooks/useAdvancedFeatures';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`advanced-tabpanel-${index}`}
    aria-labelledby={`advanced-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const ShowcaseContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const StatusChip = styled(Chip)<{ status: 'active' | 'inactive' | 'error' }>(({ theme, status }) => ({
  backgroundColor: 
    status === 'active' ? theme.palette.success.light :
    status === 'error' ? theme.palette.error.light :
    theme.palette.grey[300],
  color: 
    status === 'active' ? theme.palette.success.contrastText :
    status === 'error' ? theme.palette.error.contrastText :
    theme.palette.text.primary,
}));

export const AdvancedFeaturesShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [featuresEnabled, setFeaturesEnabled] = useState({
    collaboration: true,
    analytics: true,
    search: true,
    dragDrop: true,
    shortcuts: true,
  });

  const {
    collaboration,
    analytics,
    search,
    startCollaboration,
    stopCollaboration,
    startAnalyticsStreaming,
    stopAnalyticsStreaming,
    performSearch,
    trackEvent,
    isConnected,
  } = useAdvancedFeatures({
    enableCollaboration: featuresEnabled.collaboration,
    enableLiveAnalytics: featuresEnabled.analytics,
    enableAdvancedSearch: featuresEnabled.search,
    enableKeyboardShortcuts: featuresEnabled.shortcuts,
    workspaceId: 'demo-workspace',
    contentId: 'demo-content',
  });

  // Sample data for demonstrations
  const sampleMetrics = [
    {
      id: 'engagement',
      name: 'Engagement Rate',
      value: 4.2,
      change: 0.8,
      changeType: 'increase' as const,
      trend: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
        value: 3.5 + Math.random() * 1.5,
      })),
    },
    {
      id: 'reach',
      name: 'Total Reach',
      value: 15420,
      change: -2.1,
      changeType: 'decrease' as const,
      trend: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
        value: 14000 + Math.random() * 3000,
      })),
    },
    {
      id: 'conversions',
      name: 'Conversions',
      value: 89,
      change: 12.5,
      changeType: 'increase' as const,
      trend: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
        value: 70 + Math.random() * 30,
      })),
    },
  ];

  const sampleCharts = [
    {
      id: 'engagement-trend',
      type: 'line' as const,
      title: 'Engagement Trend',
      data: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        value: 3 + Math.random() * 2,
        platform: ['Facebook', 'Instagram', 'Twitter'][Math.floor(Math.random() * 3)],
      })),
      xAxis: 'date',
      yAxis: 'value',
      drillDownLevels: ['platform', 'content_type', 'individual_posts'],
      currentLevel: 0,
    },
    {
      id: 'platform-distribution',
      type: 'pie' as const,
      title: 'Platform Distribution',
      data: [
        { name: 'Facebook', value: 45 },
        { name: 'Instagram', value: 30 },
        { name: 'Twitter', value: 15 },
        { name: 'LinkedIn', value: 10 },
      ],
    },
  ];

  const sampleSearchResults = [
    {
      id: '1',
      title: 'AI Content Generation Best Practices',
      description: 'Learn how to create engaging content using AI tools and techniques.',
      type: 'content' as const,
      category: 'Tutorial',
      tags: ['AI', 'Content', 'Best Practices'],
      author: { id: '1', name: 'John Doe', avatar: '' },
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      rating: 4.5,
      views: 1250,
      likes: 89,
      thumbnail: '',
      metadata: {},
    },
    {
      id: '2',
      title: 'Social Media Analytics Template',
      description: 'Ready-to-use template for tracking social media performance.',
      type: 'template' as const,
      category: 'Analytics',
      tags: ['Analytics', 'Template', 'Social Media'],
      author: { id: '2', name: 'Jane Smith', avatar: '' },
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18'),
      rating: 4.8,
      views: 890,
      likes: 67,
      thumbnail: '',
      metadata: {},
    },
  ];

  const sampleFacets = [
    {
      id: 'type',
      name: 'Content Type',
      expanded: true,
      filters: [
        {
          id: 'content_type',
          name: 'Type',
          type: 'checkbox' as const,
          options: [
            { value: 'content', label: 'Content', count: 45 },
            { value: 'template', label: 'Template', count: 23 },
            { value: 'media', label: 'Media', count: 67 },
            { value: 'workflow', label: 'Workflow', count: 12 },
          ],
        },
      ],
    },
    {
      id: 'category',
      name: 'Category',
      expanded: true,
      filters: [
        {
          id: 'category',
          name: 'Category',
          type: 'checkbox' as const,
          options: [
            { value: 'tutorial', label: 'Tutorial', count: 34 },
            { value: 'analytics', label: 'Analytics', count: 28 },
            { value: 'marketing', label: 'Marketing', count: 56 },
            { value: 'design', label: 'Design', count: 19 },
          ],
        },
      ],
    },
  ];

  const handleFeatureToggle = (feature: keyof typeof featuresEnabled) => {
    setFeaturesEnabled(prev => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    trackEvent({
      type: 'tab_change',
      data: { tab: newValue, timestamp: Date.now() },
    });
  };

  const getFeatureStatus = (feature: keyof typeof featuresEnabled) => {
    if (!featuresEnabled[feature]) return 'inactive';
    
    switch (feature) {
      case 'collaboration':
        return collaboration.isActive ? 'active' : 'inactive';
      case 'analytics':
        return analytics.isStreaming ? 'active' : 'inactive';
      case 'search':
        return search.isLoading ? 'active' : 'inactive';
      default:
        return isConnected ? 'active' : 'error';
    }
  };

  useEffect(() => {
    // Track page view
    trackEvent({
      type: 'page_view',
      data: { page: 'advanced_features_showcase', timestamp: Date.now() },
    });
  }, [trackEvent]);

  return (
    <KeyboardShortcutsProvider>
      <ShowcaseContainer maxWidth="xl">
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Advanced Frontend Features
        </Typography>
        
        <Typography variant="h6" color="textSecondary" align="center" paragraph>
          Explore cutting-edge UI components with real-time collaboration, 
          interactive analytics, advanced search, and intelligent workflows.
        </Typography>

        {/* Connection Status */}
        <Alert 
          severity={isConnected ? 'success' : 'warning'} 
          sx={{ mb: 3 }}
        >
          WebSocket Connection: {isConnected ? 'Connected' : 'Disconnected'}
        </Alert>

        {/* Feature Controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Feature Controls
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(featuresEnabled).map(([feature, enabled]) => (
                <Grid item xs={12} sm={6} md={2.4} key={feature}>
                  <FeatureCard>
                    <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {feature.charAt(0).toUpperCase() + feature.slice(1)}
                      </Typography>
                      <StatusChip 
                        status={getFeatureStatus(feature as keyof typeof featuresEnabled)}
                        label={getFeatureStatus(feature as keyof typeof featuresEnabled)}
                        size="small"
                      />
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={enabled}
                            onChange={() => handleFeatureToggle(feature as keyof typeof featuresEnabled)}
                            size="small"
                          />
                        }
                        label="Enable"
                        labelPlacement="top"
                      />
                    </CardActions>
                  </FeatureCard>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Feature Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab icon={<Collaboration />} label="Real-time Collaboration" />
            <Tab icon={<Analytics />} label="Interactive Analytics" />
            <Tab icon={<Search />} label="Advanced Search" />
            <Tab icon={<DragIndicator />} label="Drag & Drop Workflows" />
            <Tab icon={<Keyboard />} label="Keyboard Shortcuts" />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h5" gutterBottom>
            Real-time Collaborative Editor
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Experience real-time collaboration with cursor tracking, presence indicators, 
            and operational transform for conflict-free editing.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={() => startCollaboration('demo-content')}
              disabled={collaboration.isActive}
            >
              Start Collaboration
            </Button>
            <Button
              variant="outlined"
              startIcon={<Stop />}
              onClick={stopCollaboration}
              disabled={!collaboration.isActive}
            >
              Stop Collaboration
            </Button>
          </Box>

          {featuresEnabled.collaboration && (
            <CollaborativeEditor
              contentId="demo-content"
              initialContent="<h2>Welcome to Collaborative Editing!</h2><p>Start typing to see real-time collaboration in action. Multiple users can edit simultaneously with automatic conflict resolution.</p>"
            />
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Typography variant="h5" gutterBottom>
            Interactive Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Explore interactive charts with drill-down capabilities, real-time updates, 
            and comprehensive filtering options.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={startAnalyticsStreaming}
              disabled={analytics.isStreaming}
            >
              Start Live Analytics
            </Button>
            <Button
              variant="outlined"
              startIcon={<Stop />}
              onClick={stopAnalyticsStreaming}
              disabled={!analytics.isStreaming}
            >
              Stop Streaming
            </Button>
          </Box>

          {featuresEnabled.analytics && (
            <InteractiveAnalyticsDashboard
              metrics={sampleMetrics}
              charts={sampleCharts}
              onMetricClick={(metric, path) => {
                console.log('Metric clicked:', metric, path);
                trackEvent({
                  type: 'metric_drill_down',
                  data: { metricId: metric.id, path },
                });
              }}
              onChartInteraction={(chart, dataPoint, path) => {
                console.log('Chart interaction:', chart, dataPoint, path);
                trackEvent({
                  type: 'chart_drill_down',
                  data: { chartId: chart.id, dataPoint, path },
                });
              }}
            />
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Typography variant="h5" gutterBottom>
            Advanced Search Interface
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Powerful search with faceted filtering, auto-suggestions, and intelligent results ranking.
          </Typography>

          {featuresEnabled.search && (
            <AdvancedSearchInterface
              searchResults={sampleSearchResults}
              facets={sampleFacets}
              suggestions={['AI content generation', 'Social media templates', 'Analytics dashboard']}
              recentSearches={['content templates', 'analytics', 'workflow automation']}
              trendingSearches={['AI tools', 'social media', 'automation']}
              onSearch={(query, filters) => {
                console.log('Search:', query, filters);
                performSearch(query, filters);
                trackEvent({
                  type: 'search_performed',
                  data: { query, filters },
                });
              }}
              onResultClick={(result) => {
                console.log('Result clicked:', result);
                trackEvent({
                  type: 'search_result_click',
                  data: { resultId: result.id, type: result.type },
                });
              }}
            />
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Typography variant="h5" gutterBottom>
            Drag & Drop Workflow Designer
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Visual workflow builder with drag-and-drop interface, real-time execution, 
            and intelligent node connections.
          </Typography>

          {featuresEnabled.dragDrop && (
            <Box sx={{ height: 600, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <DragDropWorkflowDesigner
                onWorkflowChange={(workflow) => {
                  console.log('Workflow changed:', workflow);
                  trackEvent({
                    type: 'workflow_modified',
                    data: { nodeCount: workflow.nodes.length, connectionCount: workflow.connections.length },
                  });
                }}
                onSave={(workflow) => {
                  console.log('Workflow saved:', workflow);
                  trackEvent({
                    type: 'workflow_saved',
                    data: { workflowId: 'demo-workflow' },
                  });
                }}
              />
            </Box>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <Typography variant="h5" gutterBottom>
            Keyboard Shortcuts System
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Customizable keyboard shortcuts with conflict detection, recording interface, 
            and context-aware activation.
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            Press <strong>Ctrl + ?</strong> or click the keyboard icon in the bottom-right corner 
            to access the shortcuts manager.
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Global Shortcuts
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Search</Typography>
                      <Chip label="Ctrl + K" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Settings</Typography>
                      <Chip label="Ctrl + ," size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Help</Typography>
                      <Chip label="?" size="small" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Content Shortcuts
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Save</Typography>
                      <Chip label="Ctrl + S" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">New Content</Typography>
                      <Chip label="Ctrl + N" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Undo</Typography>
                      <Chip label="Ctrl + Z" size="small" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {featuresEnabled.shortcuts && <KeyboardShortcutsManager />}
        </TabPanel>

        <Divider sx={{ my: 4 }} />

        {/* Feature Statistics */}
        <Typography variant="h5" gutterBottom>
          Feature Usage Statistics
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {collaboration.participants.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Active Collaborators
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {analytics.events.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Analytics Events
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {search.results.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Search Results
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {Object.values(featuresEnabled).filter(Boolean).length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Active Features
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </ShowcaseContainer>
    </KeyboardShortcutsProvider>
  );
};

export default AdvancedFeaturesShowcase;