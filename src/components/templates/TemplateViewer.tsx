import {
    Business,
    Category,
    ContentCopy,
    Download,
    Edit,
    Language,
    Person,
    PlayArrow,
    Schedule,
    Share,
    Star,
    StarBorder
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Rating,
    Stack,
    Tab,
    Tabs,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { templateService } from '../../services/template.service';
import {
    Template,
    TemplateAnalytics,
    TemplatePerformance
} from '../../types/template.types';

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
      id={`template-viewer-tabpanel-${index}`}
      aria-labelledby={`template-viewer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TemplateViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [template, setTemplate] = useState<Template | null>(null);
  const [analytics, setAnalytics] = useState<TemplateAnalytics | null>(null);
  const [performance, setPerformance] = useState<TemplatePerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState(0);

  // Dialogs
  const [useTemplateDialogOpen, setUseTemplateDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Template usage variables
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [processedContent, setProcessedContent] = useState<string>('');

  // Load template data
  useEffect(() => {
    if (id) {
      loadTemplate(parseInt(id));
      loadAnalytics(parseInt(id));
      loadPerformance(parseInt(id));
    }
  }, [id]);

  const loadTemplate = async (templateId: number) => {
    try {
      setLoading(true);
      const templateData = await templateService.getTemplateById(templateId);
      setTemplate(templateData);
    } catch (err) {
      setError('Failed to load template');
      console.error('Error loading template:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (templateId: number) => {
    try {
      const analyticsData = await templateService.getTemplateAnalytics(templateId);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  const loadPerformance = async (templateId: number) => {
    try {
      const performanceData = await templateService.getTemplatePerformance(templateId);
      setPerformance(performanceData);
    } catch (err) {
      console.error('Error loading performance:', err);
    }
  };

  const handleToggleFavorite = async () => {
    if (!template) return;
    
    try {
      if (isFavorite) {
        await templateService.removeFromFavorites(template.id);
      } else {
        await templateService.addToFavorites(template.id);
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Error updating favorite status:', err);
    }
  };

  const handleRateTemplate = async (rating: number) => {
    if (!template) return;
    
    try {
      await templateService.rateTemplate(template.id, rating);
      setUserRating(rating);
    } catch (err) {
      console.error('Error rating template:', err);
    }
  };

  const handleUseTemplate = async () => {
    if (!template) return;
    
    try {
      const processRequest = {
        templateId: template.id,
        variables: variableValues
      };
      
      const result = await templateService.processTemplate(processRequest);
      setProcessedContent(result.processedContent);
      
      // Navigate to content creator with processed content
      navigate('/content/create', {
        state: {
          initialContent: result.processedContent,
          templateId: template.id,
          templateName: template.name
        }
      });
    } catch (err) {
      console.error('Error processing template:', err);
    }
  };

  const handleDuplicateTemplate = async () => {
    if (!template) return;
    
    try {
      const duplicated = await templateService.duplicateTemplate(template.id);
      navigate(`/templates/${duplicated.id}/edit`);
    } catch (err) {
      console.error('Error duplicating template:', err);
    }
  };

  const handleExportTemplate = async (format: string = 'json') => {
    if (!template) return;
    
    try {
      const blob = await templateService.exportTemplate(template.id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting template:', err);
    }
  };

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Description
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {template?.description}
          </Typography>

          <Typography variant="h6" gutterBottom>
            Template Content Preview
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 400, overflow: 'auto' }}>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {template?.promptTemplate}
            </Typography>
          </Paper>
        </Paper>

      </Grid>

      <Grid item xs={12} md={4}>
        {/* Template Info */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Template Information
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon><Category /></ListItemIcon>
              <ListItemText primary="Category" secondary={template?.category.replace('_', ' ')} />
            </ListItem>
            <ListItem>
              <ListItemIcon><Language /></ListItemIcon>
              <ListItemText primary="Language" secondary={template?.language} />
            </ListItem>
            {template?.industry && (
              <ListItem>
                <ListItemIcon><Business /></ListItemIcon>
                <ListItemText primary="Industry" secondary={template.industry.replace('_', ' ')} />
              </ListItem>
            )}
            <ListItem>
              <ListItemIcon><Person /></ListItemIcon>
              <ListItemText 
                primary="Created by" 
                secondary={`User ${template?.createdBy}`}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Schedule /></ListItemIcon>
              <ListItemText 
                primary="Created" 
                secondary={template ? new Date(template.createdAt).toLocaleDateString() : ''} 
              />
            </ListItem>
          </List>
        </Paper>

        {/* Statistics */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Statistics
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {template?.usageCount || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Uses
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {template?.downloadCount || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Downloads
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {template?.forkCount || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Forks
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {template?.successRate || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Success Rate
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Tags */}
        {template?.tags && template.tags.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {template.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          </Paper>
        )}

        {/* Actions */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Actions
          </Typography>
          
          <Stack spacing={1}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<PlayArrow />}
              onClick={() => setUseTemplateDialogOpen(true)}
            >
              Use Template
            </Button>
            
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ContentCopy />}
              onClick={handleDuplicateTemplate}
            >
              Duplicate
            </Button>
            
            <Button
              variant="outlined"
              fullWidth
              startIcon={isFavorite ? <Star /> : <StarBorder />}
              onClick={handleToggleFavorite}
            >
              {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            </Button>
            
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Share />}
              onClick={() => setShareDialogOpen(true)}
            >
              Share
            </Button>
            
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Download />}
              onClick={() => handleExportTemplate('json')}
            >
              Export
            </Button>
            
            {template?.createdBy === user?.id && (
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Edit />}
                onClick={() => template && navigate(`/templates/${template.id}/edit`)}
              >
                Edit
              </Button>
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Rate this template
          </Typography>
          <Rating
            value={userRating}
            onChange={(event, newValue) => {
              if (newValue) {
                handleRateTemplate(newValue);
              }
            }}
          />
        </Paper>
      </Grid>
    </Grid>
  );

  const renderAnalyticsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Usage Analytics
          </Typography>
          {analytics ? (
            <Box>
              <Typography variant="body2" gutterBottom>
                Views: {analytics.metrics.views}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Uses: {analytics.metrics.uses}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Completion Rate: {((analytics.metrics.completions / analytics.metrics.uses) * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" gutterBottom>
                Average Time: {analytics.metrics.averageTime}s
              </Typography>
              <Typography variant="body2" gutterBottom>
                Satisfaction: {analytics.metrics.satisfaction}/5
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No analytics data available
            </Typography>
          )}
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Performance Metrics
          </Typography>
          {performance ? (
            <Box>
              <Typography variant="body2" gutterBottom>
                Average Completion Time: {performance.averageCompletionTime}s
              </Typography>
              <Typography variant="body2" gutterBottom>
                Success Rate: {(performance.successRate * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" gutterBottom>
                User Satisfaction: {performance.userSatisfaction}/5
              </Typography>
              <Typography variant="body2" gutterBottom>
                Error Rate: {(performance.errorRate * 100).toFixed(1)}%
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No performance data available
            </Typography>
          )}
        </Paper>
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading template...</Typography>
      </Box>
    );
  }

  if (error || !template) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error || 'Template not found'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {template.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip label={template.category.replace('_', ' ')} color="primary" />
          <Chip label={template.licenseType} variant="outlined" />
          {template.isPublic && <Chip label="Public" color="success" />}
          {template.isFeatured && <Chip label="Featured" color="warning" />}
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Overview" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {renderOverviewTab()}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        {renderAnalyticsTab()}
      </TabPanel>

      {/* Use Template Dialog */}
      <Dialog open={useTemplateDialogOpen} onClose={() => setUseTemplateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Use Template: {template.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3 }}>
            This template will be used to create new content.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUseTemplateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUseTemplate} variant="contained">
            Create Content
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateViewer;
