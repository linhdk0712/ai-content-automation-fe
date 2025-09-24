import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Delete,
  Download,
  Eye,
  FileText
} from 'lucide-react';
import React, { useState } from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';

interface ReportGeneratorProps {
  userId: number;
}

interface ReportConfig {
  name: string;
  type: 'performance' | 'engagement' | 'roi' | 'audience' | 'comprehensive';
  format: 'pdf' | 'excel';
  includeCharts: boolean;
  includeTables: boolean;
  includeInsights: boolean;
  platforms: string[];
  metrics: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    recipients: string[];
  };
}

interface ScheduledReport {
  id: string;
  name: string;
  type: string;
  frequency: string;
  nextRun: Date;
  status: 'active' | 'paused' | 'error';
  lastGenerated?: Date;
}

const REPORT_TYPES = [
  { value: 'performance', label: 'Performance Overview', description: 'Views, engagement, reach metrics' },
  { value: 'engagement', label: 'Engagement Analysis', description: 'Likes, shares, comments breakdown' },
  { value: 'roi', label: 'ROI Analysis', description: 'Cost analysis and return calculations' },
  { value: 'audience', label: 'Audience Insights', description: 'Demographics and behavior patterns' },
  { value: 'comprehensive', label: 'Comprehensive Report', description: 'All metrics and insights combined' }
];

const METRICS_OPTIONS = [
  { value: 'views', label: 'Views' },
  { value: 'engagementRate', label: 'Engagement Rate' },
  { value: 'likes', label: 'Likes' },
  { value: 'shares', label: 'Shares' },
  { value: 'comments', label: 'Comments' },
  { value: 'reach', label: 'Reach' },
  { value: 'impressions', label: 'Impressions' },
  { value: 'roi', label: 'ROI' },
  { value: 'cost', label: 'Cost per Engagement' }
];

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ userId }) => {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: '',
    type: 'performance',
    format: 'pdf',
    includeCharts: true,
    includeTables: true,
    includeInsights: true,
    platforms: ['facebook', 'instagram', 'tiktok', 'youtube'],
    metrics: ['views', 'engagementRate', 'likes', 'shares'],
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    }
  });

  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([
    {
      id: '1',
      name: 'Weekly Performance Report',
      type: 'performance',
      frequency: 'weekly',
      nextRun: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'active',
      lastGenerated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      name: 'Monthly ROI Analysis',
      type: 'roi',
      frequency: 'monthly',
      nextRun: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'active',
      lastGenerated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }
  ]);

  const [generating, setGenerating] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  const { generateReport } = useAnalytics();

  const handleConfigChange = (field: keyof ReportConfig, value: any) => {
    setReportConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      
      const reportUrl = await generateReport({
        userId,
        reportType: reportConfig.type,
        filters: {
          startDate: reportConfig.dateRange.start,
          endDate: reportConfig.dateRange.end,
          platforms: reportConfig.platforms,
          timeGranularity: 'DAY' as const,
          timezone: 'UTC'
        },
        format: reportConfig.format,
        includeCharts: reportConfig.includeCharts
      });

      // Download the report
      window.open(reportUrl, '_blank');
      
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleScheduleReport = () => {
    // Add scheduling logic here
    setScheduleDialogOpen(false);
  };

  const toggleReportStatus = (reportId: string) => {
    setScheduledReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, status: report.status === 'active' ? 'paused' : 'active' }
        : report
    ));
  };

  const deleteScheduledReport = (reportId: string) => {
    setScheduledReports(prev => prev.filter(report => report.id !== reportId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} />;
      case 'paused': return <Clock size={16} />;
      case 'error': return <AlertCircle size={16} />;
      default: return null;
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Report Generator
      </Typography>

      <Grid container spacing={3}>
        {/* Report Configuration */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Create New Report
              </Typography>

              <Grid container spacing={3}>
                {/* Basic Configuration */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Report Name"
                    value={reportConfig.name}
                    onChange={(e) => handleConfigChange('name', e.target.value)}
                    placeholder="e.g., Monthly Performance Report"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Report Type</InputLabel>
                    <Select
                      value={reportConfig.type}
                      onChange={(e) => handleConfigChange('type', e.target.value)}
                    >
                      {REPORT_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          <Box>
                            <Typography variant="body1">{type.label}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {type.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Format</InputLabel>
                    <Select
                      value={reportConfig.format}
                      onChange={(e) => handleConfigChange('format', e.target.value)}
                    >
                      <MenuItem value="pdf">PDF Document</MenuItem>
                      <MenuItem value="excel">Excel Spreadsheet</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Date Range */}
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Start Date"
                    value={reportConfig.dateRange.start}
                    onChange={(date) => handleConfigChange('dateRange', {
                      ...reportConfig.dateRange,
                      start: date
                    })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="End Date"
                    value={reportConfig.dateRange.end}
                    onChange={(date) => handleConfigChange('dateRange', {
                      ...reportConfig.dateRange,
                      end: date
                    })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>

                {/* Platform Selection */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Platforms
                  </Typography>
                  <FormGroup row>
                    {['facebook', 'instagram', 'tiktok', 'youtube', 'twitter'].map((platform) => (
                      <FormControlLabel
                        key={platform}
                        control={
                          <Checkbox
                            checked={reportConfig.platforms.includes(platform)}
                            onChange={(e) => {
                              const platforms = e.target.checked
                                ? [...reportConfig.platforms, platform]
                                : reportConfig.platforms.filter(p => p !== platform);
                              handleConfigChange('platforms', platforms);
                            }}
                          />
                        }
                        label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                      />
                    ))}
                  </FormGroup>
                </Grid>

                {/* Metrics Selection */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Metrics to Include
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {METRICS_OPTIONS.map((metric) => (
                      <Chip
                        key={metric.value}
                        label={metric.label}
                        clickable
                        color={reportConfig.metrics.includes(metric.value) ? 'primary' : 'default'}
                        onClick={() => {
                          const metrics = reportConfig.metrics.includes(metric.value)
                            ? reportConfig.metrics.filter(m => m !== metric.value)
                            : [...reportConfig.metrics, metric.value];
                          handleConfigChange('metrics', metrics);
                        }}
                      />
                    ))}
                  </Box>
                </Grid>

                {/* Content Options */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Content Options
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={reportConfig.includeCharts}
                          onChange={(e) => handleConfigChange('includeCharts', e.target.checked)}
                        />
                      }
                      label="Include Charts and Visualizations"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={reportConfig.includeTables}
                          onChange={(e) => handleConfigChange('includeTables', e.target.checked)}
                        />
                      }
                      label="Include Data Tables"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={reportConfig.includeInsights}
                          onChange={(e) => handleConfigChange('includeInsights', e.target.checked)}
                        />
                      }
                      label="Include AI-Generated Insights"
                    />
                  </FormGroup>
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<Download />}
                      onClick={handleGenerateReport}
                      disabled={generating || !reportConfig.name}
                    >
                      {generating ? 'Generating...' : 'Generate Report'}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      startIcon={<Eye />}
                      onClick={() => setPreviewDialogOpen(true)}
                      disabled={!reportConfig.name}
                    >
                      Preview
                    </Button>
                    
                    <Button
                      variant="outlined"
                      startIcon={<Calendar />}
                      onClick={() => setScheduleDialogOpen(true)}
                      disabled={!reportConfig.name}
                    >
                      Schedule
                    </Button>
                  </Box>
                  
                  {generating && (
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress />
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Generating your report... This may take a few minutes.
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Scheduled Reports */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Scheduled Reports
              </Typography>
              
              {scheduledReports.length === 0 ? (
                <Alert severity="info">
                  No scheduled reports yet. Create a report and schedule it for automatic delivery.
                </Alert>
              ) : (
                <List>
                  {scheduledReports.map((report, index) => (
                    <React.Fragment key={report.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle2">
                                {report.name}
                              </Typography>
                              <Chip
                                size="small"
                                label={report.status}
                                color={getStatusColor(report.status) as any}
                                icon={getStatusIcon(report.status) || undefined}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {report.frequency} • Next: {report.nextRun.toLocaleDateString()}
                              </Typography>
                              {report.lastGenerated && (
                                <Typography variant="caption" color="textSecondary">
                                  Last: {report.lastGenerated.toLocaleDateString()}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={() => toggleReportStatus(report.id)}
                          >
                            {report.status === 'active' ? <Clock size={16} /> : <CheckCircle size={16} />}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => deleteScheduledReport(report.id)}
                          >
                            <Delete size={16} />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < scheduledReports.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Reports
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FileText />}
                  onClick={() => {
                    setReportConfig({
                      ...reportConfig,
                      name: 'Weekly Performance Summary',
                      type: 'performance',
                      dateRange: {
                        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        end: new Date()
                      }
                    });
                  }}
                >
                  Last 7 Days Performance
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileText />}
                  onClick={() => {
                    setReportConfig({
                      ...reportConfig,
                      name: 'Monthly ROI Report',
                      type: 'roi',
                      dateRange: {
                        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        end: new Date()
                      }
                    });
                  }}
                >
                  Monthly ROI Analysis
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileText />}
                  onClick={() => {
                    setReportConfig({
                      ...reportConfig,
                      name: 'Comprehensive Analytics',
                      type: 'comprehensive',
                      dateRange: {
                        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                        end: new Date()
                      }
                    });
                  }}
                >
                  Quarterly Overview
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Report</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Set up automatic report generation and delivery
            </Typography>
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Frequency</InputLabel>
              <Select defaultValue="weekly">
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Email Recipients"
              placeholder="Enter email addresses separated by commas"
              sx={{ mt: 2 }}
              helperText="Reports will be automatically sent to these email addresses"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleScheduleReport} variant="contained">
            Schedule Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Report Preview</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This is a preview of your report configuration. The actual report will contain live data.
          </Alert>
          
          <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              {reportConfig.name || 'Untitled Report'}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {REPORT_TYPES.find(t => t.value === reportConfig.type)?.description}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Date Range:</Typography>
                <Typography variant="body2">
                  {reportConfig.dateRange.start.toLocaleDateString()} - {reportConfig.dateRange.end.toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Format:</Typography>
                <Typography variant="body2">{reportConfig.format.toUpperCase()}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Platforms:</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                  {reportConfig.platforms.map(platform => (
                    <Chip key={platform} label={platform} size="small" />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          <Button onClick={handleGenerateReport} variant="contained">
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};