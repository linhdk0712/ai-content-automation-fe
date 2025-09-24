import { useContent } from '@/hooks/useContent';
import {
  AccessTime,
  Archive,
  CheckCircle,
  Code,
  Delete,
  Description,
  Download,
  Error,
  Info,
  PictureAsPdf,
  Refresh,
  Schedule,
  TableChart,
  Visibility,
  Warning
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: React.ReactElement;
  extension: string;
  supportedFields: string[];
  maxItems?: number;
  premium?: boolean;
}

interface ExportJob {
  id: number;
  name: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  itemCount: number;
  fileSize?: number;
  downloadUrl?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
  expiresAt?: string;
}

interface ExportFilter {
  dateRange: {
    start: string;
    end: string;
  };
  status: string[];
  types: string[];
  authors: string[];
  tags: string[];
  includeVersions: boolean;
  includeComments: boolean;
  includeAnalytics: boolean;
  includeMedia: boolean;
}

const ContentExport: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    loading,
    error  } = useContent();

  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [exportName, setExportName] = useState('');
  const [filters, setFilters] = useState<ExportFilter>({
    dateRange: {
      start: '',
      end: ''
    },
    status: [],
    types: [],
    authors: [],
    tags: [],
    includeVersions: false,
    includeComments: false,
    includeAnalytics: false,
    includeMedia: false
  });
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState('weekly');

  // Export formats
  const exportFormats: ExportFormat[] = [
    {
      id: 'pdf',
      name: 'PDF Document',
      description: 'Formatted PDF with content and metadata',
      icon: <PictureAsPdf />,
      extension: 'pdf',
      supportedFields: ['title', 'content', 'metadata', 'images'],
      maxItems: 100
    },
    {
      id: 'docx',
      name: 'Word Document',
      description: 'Microsoft Word format with formatting',
      icon: <Description />,
      extension: 'docx',
      supportedFields: ['title', 'content', 'metadata', 'comments'],
      maxItems: 50
    },
    {
      id: 'csv',
      name: 'CSV Spreadsheet',
      description: 'Comma-separated values for data analysis',
      icon: <TableChart />,
      extension: 'csv',
      supportedFields: ['title', 'content', 'metadata', 'analytics'],
      maxItems: 1000
    },
    {
      id: 'json',
      name: 'JSON Data',
      description: 'Structured data format for developers',
      icon: <Code />,
      extension: 'json',
      supportedFields: ['title', 'content', 'metadata', 'versions', 'comments', 'analytics'],
      maxItems: 500
    },
    {
      id: 'html',
      name: 'HTML Archive',
      description: 'Web-ready HTML with embedded media',
      icon: <Code />,
      extension: 'html',
      supportedFields: ['title', 'content', 'metadata', 'images', 'styling'],
      maxItems: 200
    },
    {
      id: 'zip',
      name: 'Complete Archive',
      description: 'All content with media files in ZIP format',
      icon: <Archive />,
      extension: 'zip',
      supportedFields: ['title', 'content', 'metadata', 'images', 'videos', 'versions', 'comments'],
      maxItems: 100,
      premium: true
    }
  ];

  // Mock data for demonstration
  const contents: any[] = [];
  const exportJobs: ExportJob[] = [];

  // Load data on mount
  useEffect(() => {
    // Data loading would be implemented here
  }, []);

  const handleFormatSelect = (format: ExportFormat) => {
    setSelectedFormat(format);
    setActiveStep(1);
  };

  const handleItemSelection = (itemId: number) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === contents.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(contents.map(content => content.id));
    }
  };

  const handleFilterChange = (field: keyof ExportFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateExport = async () => {
    if (!selectedFormat || selectedItems.length === 0) return;
    
    // Export creation would be implemented here
    console.log('Creating export:', { selectedFormat, selectedItems, filters });
  };

  const handleDownload = async (job: ExportJob) => {
    // Download functionality would be implemented here
    console.log('Downloading export:', job.id);
  };

  const handleCancel = async (jobId: number) => {
    // Cancel functionality would be implemented here
    console.log('Cancelling export:', jobId);
  };

  const handleDelete = async (jobId: number) => {
    if (confirm('Are you sure you want to delete this export?')) {
      // Delete functionality would be implemented here
      console.log('Deleting export:', jobId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'primary';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle color="success" />;
      case 'processing': return <AccessTime color="primary" />;
      case 'pending': return <Schedule color="warning" />;
      case 'failed': return <Error color="error" />;
      case 'cancelled': return <Warning color="disabled" />;
      default: return <Info />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderFormatSelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choose Export Format
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the format that best suits your needs
      </Typography>

      <Grid container spacing={2}>
        {exportFormats.map((format) => (
          <Grid item xs={12} sm={6} md={4} key={format.id}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: selectedFormat?.id === format.id ? 2 : 1,
                borderColor: selectedFormat?.id === format.id ? 'primary.main' : 'divider',
                '&:hover': { boxShadow: 4 }
              }}
              onClick={() => handleFormatSelect(format)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {format.icon}
                  <Box>
                    <Typography variant="h6">
                      {format.name}
                      {format.premium && (
                        <Chip label="Premium" size="small" color="primary" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      .{format.extension}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {format.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Supported fields:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {format.supportedFields.slice(0, 3).map((field) => (
                      <Chip key={field} label={field} size="small" variant="outlined" />
                    ))}
                    {format.supportedFields.length > 3 && (
                      <Chip 
                        label={`+${format.supportedFields.length - 3}`} 
                        size="small" 
                        variant="outlined" 
                      />
                    )}
                  </Box>
                </Box>

                {format.maxItems && (
                  <Typography variant="caption" color="text.secondary">
                    Max items: {format.maxItems}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderContentSelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Content to Export
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose which content items to include in your export
      </Typography>

      {/* Selection Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedItems.length === contents.length}
              indeterminate={selectedItems.length > 0 && selectedItems.length < contents.length}
              onChange={handleSelectAll}
            />
          }
          label={`Select all (${selectedItems.length}/${contents.length})`}
        />

        <Typography variant="body2" color="text.secondary">
          {selectedFormat?.maxItems && selectedItems.length > selectedFormat.maxItems && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Selected {selectedItems.length} items, but {selectedFormat.name} supports maximum {selectedFormat.maxItems} items.
            </Alert>
          )}
        </Typography>
      </Box>

      {/* Content List */}
      <List>
        {contents.map((content) => (
          <ListItem key={content.id} divider>
            <ListItemIcon>
              <Checkbox
                checked={selectedItems.includes(content.id)}
                onChange={() => handleItemSelection(content.id)}
              />
            </ListItemIcon>
            
            <ListItemText
              primary={content.title}
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {content.textContent.substring(0, 100)}...
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip label={content.status} size="small" />
                    <Chip label={content.type} size="small" variant="outlined" />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(content.updatedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              }
            />
            
            <IconButton onClick={() => navigate(`/content/edit/${content.id}`)}>
              <Visibility />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const renderExportOptions = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Export Options
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure additional options for your export
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Options */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Basic Settings
              </Typography>

              <TextField
                fullWidth
                label="Export Name"
                value={exportName}
                onChange={(e) => setExportName(e.target.value)}
                placeholder="My Content Export"
                sx={{ mb: 2 }}
              />

              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.includeVersions}
                      onChange={(e) => handleFilterChange('includeVersions', e.target.checked)}
                    />
                  }
                  label="Include version history"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.includeComments}
                      onChange={(e) => handleFilterChange('includeComments', e.target.checked)}
                    />
                  }
                  label="Include comments"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.includeAnalytics}
                      onChange={(e) => handleFilterChange('includeAnalytics', e.target.checked)}
                    />
                  }
                  label="Include analytics data"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.includeMedia}
                      onChange={(e) => handleFilterChange('includeMedia', e.target.checked)}
                    />
                  }
                  label="Include media files"
                />
              </FormGroup>
            </CardContent>
          </Card>
        </Grid>

        {/* Scheduling */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Scheduling (Optional)
              </Typography>

              <TextField
                fullWidth
                type="datetime-local"
                label="Schedule Export"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
                helperText="Leave empty to export immediately"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={recurring}
                    onChange={(e) => setRecurring(e.target.checked)}
                  />
                }
                label="Recurring export"
              />

              {recurring && (
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={recurringPattern}
                    onChange={(e) => setRecurringPattern(e.target.value)}
                    label="Frequency"
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Export Summary */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Export Summary
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {selectedItems.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Items Selected
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {selectedFormat?.extension.toUpperCase()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Format
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {Object.values(filters).filter(Boolean).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Options Enabled
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  ~5MB
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Estimated Size
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  const renderExportJobs = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Export History
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => console.log('Refreshing export jobs')}
        >
          Refresh
        </Button>
      </Box>

      <List>
        {exportJobs.map((job) => (
          <ListItem key={job.id} divider>
            <ListItemIcon>
              {getStatusIcon(job.status)}
            </ListItemIcon>
            
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1">
                    {job.name}
                  </Typography>
                  <Chip 
                    label={job.status} 
                    color={getStatusColor(job.status) as any}
                    size="small"
                  />
                  <Chip 
                    label={job.format.toUpperCase()} 
                    size="small" 
                    variant="outlined"
                  />
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {job.itemCount} items • Created {new Date(job.createdAt).toLocaleString()}
                  </Typography>
                  
                  {job.status === 'processing' && (
                    <LinearProgress 
                      variant="determinate" 
                      value={job.progress} 
                      sx={{ mt: 1, mb: 1 }}
                    />
                  )}
                  
                  {job.fileSize && (
                    <Typography variant="caption" color="text.secondary">
                      Size: {formatFileSize(job.fileSize)}
                    </Typography>
                  )}
                  
                  {job.error && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {job.error}
                    </Alert>
                  )}
                  
                  {job.expiresAt && job.status === 'completed' && (
                    <Typography variant="caption" color="warning.main">
                      Expires: {new Date(job.expiresAt).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              }
            />
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {job.status === 'completed' && job.downloadUrl && (
                <Tooltip title="Download">
                  <IconButton onClick={() => handleDownload(job)}>
                    <Download />
                  </IconButton>
                </Tooltip>
              )}
              
              {job.status === 'processing' && (
                <Tooltip title="Cancel">
                  <IconButton onClick={() => handleCancel(job.id)}>
                    <Warning />
                  </IconButton>
                </Tooltip>
              )}
              
              <Tooltip title="Delete">
                <IconButton onClick={() => handleDelete(job.id)}>
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
          </ListItem>
        ))}
      </List>

      {exportJobs.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No exports yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first export to get started
          </Typography>
        </Box>
      )}
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading export data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => navigate('/content')}>
          Back to Content Library
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Content Export
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Export your content in various formats for backup, sharing, or migration
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Export Wizard */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stepper activeStep={activeStep} orientation="vertical">
                <Step>
                  <StepLabel>Choose Format</StepLabel>
                  <StepContent>
                    {renderFormatSelection()}
                  </StepContent>
                </Step>
                
                <Step>
                  <StepLabel>Select Content</StepLabel>
                  <StepContent>
                    {renderContentSelection()}
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={() => setActiveStep(2)}
                        disabled={selectedItems.length === 0}
                        sx={{ mr: 1 }}
                      >
                        Continue
                      </Button>
                      <Button onClick={() => setActiveStep(0)}>
                        Back
                      </Button>
                    </Box>
                  </StepContent>
                </Step>
                
                <Step>
                  <StepLabel>Configure Options</StepLabel>
                  <StepContent>
                    {renderExportOptions()}
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleCreateExport}
                        disabled={selectedItems.length === 0}
                        sx={{ mr: 1 }}
                      >
                        Create Export
                      </Button>
                      <Button onClick={() => setActiveStep(1)}>
                        Back
                      </Button>
                    </Box>
                  </StepContent>
                </Step>
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* Export Jobs */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              {renderExportJobs()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ContentExport;