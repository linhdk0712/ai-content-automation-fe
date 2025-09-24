import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import {
  CloudUpload,
  Download,
  CheckCircle,
  Error,
  Warning,
} from '@mui/icons-material';
import Papa from 'papaparse';
import { useScheduling } from '../../hooks/useScheduling';
import { BulkScheduleItem } from '../../types/scheduling';
import { schedulingService } from '../../services/scheduling.service';

interface BulkSchedulerProps {
  open: boolean;
  onClose: () => void;
}

interface ValidationResult {
  valid: BulkScheduleItem[];
  invalid: { item: BulkScheduleItem; errors: string[] }[];
}

const steps = ['Upload CSV', 'Review & Validate', 'Configure Settings', 'Schedule Posts'];

const BulkScheduler: React.FC<BulkSchedulerProps> = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [csvData, setCsvData] = useState<BulkScheduleItem[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [defaultPlatforms, setDefaultPlatforms] = useState<string[]>(['facebook', 'instagram']);
  const [isScheduling, setIsScheduling] = useState(false);

  const { bulkSchedule } = useScheduling();

  const availablePlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'];
  const templates = [
    { id: 'marketing', name: 'Marketing Campaign' },
    { id: 'product', name: 'Product Launch' },
    { id: 'educational', name: 'Educational Content' },
    { id: 'custom', name: 'Custom Template' },
  ];

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as BulkScheduleItem[];
        setCsvData(data);
        setActiveStep(1);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
      },
    });
  }, []);

  const handleValidation = useCallback(async () => {
    if (csvData.length === 0) return;

    setIsValidating(true);
    try {
      const result = await schedulingService.validateBulkSchedule(csvData);
      setValidationResult(result);
      if (result.invalid.length === 0) {
        setActiveStep(2);
      }
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  }, [csvData]);

  const handleSchedulePosts = useCallback(async () => {
    if (!validationResult?.valid) return;

    setIsScheduling(true);
    try {
      // Apply template and default settings to valid items
      const itemsToSchedule = validationResult.valid.map(item => ({
        ...item,
        platforms: item.platforms || defaultPlatforms.join(','),
      }));

      await bulkSchedule(itemsToSchedule);
      setActiveStep(3);
    } catch (error) {
      console.error('Bulk scheduling error:', error);
    } finally {
      setIsScheduling(false);
    }
  }, [validationResult, defaultPlatforms, bulkSchedule]);

  const handleClose = () => {
    setActiveStep(0);
    setCsvData([]);
    setValidationResult(null);
    setSelectedTemplate('');
    setDefaultPlatforms(['facebook', 'instagram']);
    onClose();
  };

  const downloadTemplate = () => {
    const template = [
      {
        title: 'Sample Post Title',
        content: 'This is sample content for your post...',
        scheduledTime: '2024-01-15 10:00',
        platforms: 'facebook,instagram',
        recurringPattern: 'weekly',
        tags: 'marketing,social',
      },
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_schedule_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getValidationIcon = (errors: string[]) => {
    if (errors.length === 0) return <CheckCircle color="success" />;
    if (errors.some(e => e.includes('required'))) return <Error color="error" />;
    return <Warning color="warning" />;
  };

  const renderUploadStep = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h6" gutterBottom>
        Upload CSV File
      </Typography>
      <Typography color="text.secondary" paragraph>
        Upload a CSV file with your posts to schedule in bulk. Make sure your file includes the required columns.
      </Typography>

      <Stack spacing={3} alignItems="center">
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={downloadTemplate}
        >
          Download Template
        </Button>

        <Box>
          <input
            accept=".csv"
            style={{ display: 'none' }}
            id="csv-upload"
            type="file"
            onChange={handleFileUpload}
          />
          <label htmlFor="csv-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUpload />}
              size="large"
            >
              Upload CSV File
            </Button>
          </label>
        </Box>

        <Typography variant="caption" color="text.secondary">
          Required columns: title, content, scheduledTime, platforms
        </Typography>
      </Stack>
    </Box>
  );

  const renderValidationStep = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Review & Validate ({csvData.length} items)
        </Typography>
        <Button
          variant="contained"
          onClick={handleValidation}
          disabled={isValidating || csvData.length === 0}
        >
          {isValidating ? 'Validating...' : 'Validate'}
        </Button>
      </Box>

      {isValidating && <LinearProgress sx={{ mb: 2 }} />}

      {validationResult && (
        <Stack spacing={2}>
          <Alert severity={validationResult.invalid.length === 0 ? 'success' : 'warning'}>
            {validationResult.valid.length} valid items, {validationResult.invalid.length} items with issues
          </Alert>

          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Scheduled Time</TableCell>
                  <TableCell>Platforms</TableCell>
                  <TableCell>Issues</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {validationResult.valid.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <CheckCircle color="success" />
                    </TableCell>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.scheduledTime}</TableCell>
                    <TableCell>
                      {item.platforms?.split(',').map(platform => (
                        <Chip key={platform} label={platform} size="small" sx={{ mr: 0.5 }} />
                      ))}
                    </TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                ))}
                {validationResult.invalid.map(({ item, errors }, index) => (
                  <TableRow key={`invalid-${index}`}>
                    <TableCell>
                      {getValidationIcon(errors)}
                    </TableCell>
                    <TableCell>{item.title || 'Missing title'}</TableCell>
                    <TableCell>{item.scheduledTime || 'Missing time'}</TableCell>
                    <TableCell>
                      {item.platforms?.split(',').map(platform => (
                        <Chip key={platform} label={platform} size="small" sx={{ mr: 0.5 }} />
                      ))}
                    </TableCell>
                    <TableCell>
                      {errors.map((error, i) => (
                        <Chip key={i} label={error} color="error" size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      )}
    </Box>
  );

  const renderConfigurationStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configure Settings
      </Typography>

      <Stack spacing={3}>
        <FormControl fullWidth>
          <InputLabel>Content Template</InputLabel>
          <Select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            title="Content Template"
          >
            {templates.map((template) => (
              <MenuItem key={template.id} value={template.id}>
                {template.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Default Platforms</InputLabel>
          <Select
            multiple
            value={defaultPlatforms}
            onChange={(e) => setDefaultPlatforms(e.target.value as string[])}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
            title="Default Platforms"
          >
            {availablePlatforms.map((platform) => (
              <MenuItem key={platform} value={platform}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {validationResult && (
          <Alert severity="info">
            Ready to schedule {validationResult.valid.length} posts
          </Alert>
        )}
      </Stack>
    </Box>
  );

  const renderCompletionStep = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Bulk Scheduling Complete!
      </Typography>
      <Typography color="text.secondary">
        All valid posts have been scheduled successfully.
      </Typography>
    </Box>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderUploadStep();
      case 1:
        return renderValidationStep();
      case 2:
        return renderConfigurationStep();
      case 3:
        return renderCompletionStep();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>Bulk Schedule Posts</DialogTitle>
      <DialogContent>
        <Box sx={{ width: '100%', mt: 2 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mt: 4 }}>
            {renderStepContent()}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          {activeStep === 3 ? 'Close' : 'Cancel'}
        </Button>
        {activeStep === 1 && validationResult?.invalid.length === 0 && (
          <Button onClick={() => setActiveStep(2)} variant="contained">
            Next
          </Button>
        )}
        {activeStep === 2 && (
          <Button
            onClick={handleSchedulePosts}
            variant="contained"
            disabled={isScheduling || !validationResult?.valid.length}
          >
            {isScheduling ? 'Scheduling...' : 'Schedule Posts'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkScheduler;