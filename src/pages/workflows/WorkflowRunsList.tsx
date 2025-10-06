import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Button,
  Alert,
  CircularProgress,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  Grid,
  Divider
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LiveTv as LiveIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWorkflowRuns, WorkflowRunWithSSE } from '../../hooks/useWorkflowRuns';
import { useI18n } from '../../hooks/useI18n';

interface WorkflowRunsListProps {
  userId: number;
}

const WorkflowRunsList: React.FC<WorkflowRunsListProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  
  const [selectedRun, setSelectedRun] = useState<WorkflowRunWithSSE | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const {
    runs,
    loading,
    error,
    refreshRuns,
    connectToRun,
    disconnectFromRun,
    connectedRunId,
    sseConnected
  } = useWorkflowRuns({ userId });

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'RUNNING': return 'warning';
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'error';
      case 'CANCELLED': return 'default';
      case 'QUEUED': return 'info';
      default: return 'default';
    }
  };

  // Status icon mapping
  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'RUNNING': return <CircularProgress size={16} />;
      case 'COMPLETED': return <CheckCircleIcon color="success" />;
      case 'FAILED': return <ErrorIcon color="error" />;
      case 'CANCELLED': return <CancelIcon color="disabled" />;
      case 'QUEUED': return <ScheduleIcon color="info" />;
      default: return <ScheduleIcon />;
    }
  };

  // Format duration
  const formatDuration = (startedAt: string, finishedAt?: string) => {
    const start = new Date(startedAt);
    const end = finishedAt ? new Date(finishedAt) : new Date();
    const duration = end.getTime() - start.getTime();
    
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Extract current step from output
  const getCurrentStep = (run: WorkflowRunWithSSE) => {
    if (!run.output) return 'Initializing';
    
    try {
      const output = JSON.parse(run.output);
      return output.currentNode || 'Processing';
    } catch {
      return 'Processing';
    }
  };

  // Handle row expansion
  const toggleRowExpansion = (runId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(runId)) {
      newExpanded.delete(runId);
    } else {
      newExpanded.add(runId);
    }
    setExpandedRows(newExpanded);
  };

  // Handle view details
  const handleViewDetails = (run: WorkflowRunWithSSE) => {
    setSelectedRun(run);
    setDetailsOpen(true);
  };

  // Handle connect/disconnect to live updates
  const handleToggleLiveUpdates = (run: WorkflowRunWithSSE) => {
    if (run.runId) {
      if (connectedRunId === run.runId) {
        disconnectFromRun();
      } else {
        connectToRun(run.runId);
      }
    }
  };

  // Navigate to detailed run viewer
  const handleNavigateToRun = (runId: number) => {
    navigate(`/workflows/runs/${runId}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {t('workflows.workflowRuns')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {sseConnected && (
            <Chip
              icon={<LiveIcon />}
              label="Live Updates"
              color="success"
              variant="outlined"
              size="small"
            />
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refreshRuns}
            disabled={loading}
          >
            {t('common.refresh')}
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => {}}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <CircularProgress size={20} />
          <Typography>{t('common.loading')}</Typography>
        </Box>
      )}

      {/* Runs Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={50}></TableCell>
                  <TableCell>{t('workflows.status')}</TableCell>
                  <TableCell>{t('workflows.workflowKey')}</TableCell>
                  <TableCell>{t('workflows.currentStep')}</TableCell>
                  <TableCell>{t('workflows.startedAt')}</TableCell>
                  <TableCell>{t('workflows.duration')}</TableCell>
                  <TableCell>{t('workflows.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {runs.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {t('workflows.noWorkflowRuns')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  runs.map((run) => (
                    <React.Fragment key={run.id}>
                      <TableRow hover>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => toggleRowExpansion(run.id)}
                          >
                            {expandedRows.has(run.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(run.status)}
                            <Chip
                              label={run.status}
                              color={getStatusColor(run.status) as any}
                              size="small"
                            />
                            {run.isLive && (
                              <Chip
                                icon={<LiveIcon />}
                                label="Live"
                                color="success"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {run.workflowKey}
                          </Typography>
                          {run.runId && (
                            <Typography variant="caption" color="text.secondary">
                              ID: {run.runId}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {getCurrentStep(run)}
                          </Typography>
                          {run.status === 'RUNNING' && (
                            <LinearProgress 
                              variant="indeterminate" 
                              sx={{ mt: 1, height: 4, borderRadius: 2 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(run.startedAt).toLocaleString()}
                          </Typography>
                          {run.lastUpdated && (
                            <Typography variant="caption" color="text.secondary">
                              Updated: {run.lastUpdated.toLocaleTimeString()}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDuration(run.startedAt, run.finishedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title={t('workflows.viewDetails')}>
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(run)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            {run.status === 'RUNNING' && run.runId && (
                              <Tooltip title={
                                connectedRunId === run.runId 
                                  ? t('workflows.disconnectLiveUpdates')
                                  : t('workflows.connectLiveUpdates')
                              }>
                                <IconButton
                                  size="small"
                                  color={connectedRunId === run.runId ? 'success' : 'default'}
                                  onClick={() => handleToggleLiveUpdates(run)}
                                >
                                  {connectedRunId === run.runId ? <StopIcon /> : <PlayIcon />}
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Row Details */}
                      <TableRow>
                        <TableCell colSpan={7} sx={{ py: 0 }}>
                          <Collapse in={expandedRows.has(run.id)} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    {t('workflows.runDetails')}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Content ID:</strong> {run.contentId || 'N/A'}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>User ID:</strong> {run.userId || 'N/A'}
                                  </Typography>
                                  {run.finishedAt && (
                                    <Typography variant="body2">
                                      <strong>Finished:</strong> {new Date(run.finishedAt).toLocaleString()}
                                    </Typography>
                                  )}
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  {run.errorMessage && (
                                    <Box>
                                      <Typography variant="subtitle2" color="error" gutterBottom>
                                        {t('workflows.errorMessage')}
                                      </Typography>
                                      <Typography variant="body2" color="error">
                                        {run.errorMessage}
                                      </Typography>
                                    </Box>
                                  )}
                                  {run.output && (
                                    <Box>
                                      <Typography variant="subtitle2" gutterBottom>
                                        {t('workflows.currentOutput')}
                                      </Typography>
                                      <Box
                                        component="pre"
                                        sx={{
                                          fontSize: '0.75rem',
                                          backgroundColor: 'background.paper',
                                          p: 1,
                                          borderRadius: 1,
                                          overflow: 'auto',
                                          maxHeight: 150
                                        }}
                                      >
                                        {JSON.stringify(JSON.parse(run.output), null, 2)}
                                      </Box>
                                    </Box>
                                  )}
                                </Grid>
                              </Grid>
                              <Divider sx={{ my: 2 }} />
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleNavigateToRun(run.id)}
                                >
                                  {t('workflows.viewFullDetails')}
                                </Button>
                              </Box>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {t('workflows.workflowRunDetails')}
        </DialogTitle>
        <DialogContent>
          {selectedRun && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>ID:</strong> {selectedRun.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Run ID:</strong> {selectedRun.runId || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Workflow:</strong> {selectedRun.workflowKey}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Status:</strong> {selectedRun.status}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Started:</strong> {new Date(selectedRun.startedAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Duration:</strong> {formatDuration(selectedRun.startedAt, selectedRun.finishedAt)}
                  </Typography>
                </Grid>
                {selectedRun.input && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Input Data:
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        fontSize: '0.75rem',
                        backgroundColor: 'grey.100',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        maxHeight: 200
                      }}
                    >
                      {JSON.stringify(JSON.parse(selectedRun.input), null, 2)}
                    </Box>
                  </Grid>
                )}
                {selectedRun.output && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Output Data:
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        fontSize: '0.75rem',
                        backgroundColor: 'grey.100',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        maxHeight: 200
                      }}
                    >
                      {JSON.stringify(JSON.parse(selectedRun.output), null, 2)}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            {t('common.close')}
          </Button>
          {selectedRun && (
            <Button
              variant="contained"
              onClick={() => {
                handleNavigateToRun(selectedRun.id);
                setDetailsOpen(false);
              }}
            >
              {t('workflows.viewFullDetails')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowRunsList;