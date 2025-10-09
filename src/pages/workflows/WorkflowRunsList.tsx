import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Tooltip,
  Grid,
  Paper
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  CheckCircle as CompletedIcon,
  Error as ErrorIcon,
  PlayArrow as RunningIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWorkflowRuns, WorkflowRunWithSocket } from '../../hooks/useWorkflowRuns';
import { useI18n } from '../../hooks/useI18n';

interface WorkflowRunsListProps {
  userId: number;
}

const WorkflowRunsList = ({ userId }: WorkflowRunsListProps) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  
  const [selectedRun, setSelectedRun] = useState<WorkflowRunWithSocket | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const {
    runs,
    loading,
    error,
    refreshRuns,
    connectToExecution,
    disconnectFromExecution,
    connectedExecutionId,
    socketConnected
  } = useWorkflowRuns({ userId });



  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'RUNNING': return 'warning';
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'error';
      case 'QUEUED': return 'info';
      case 'CANCELLED': return 'default';
      default: return 'default';
    }
  };

  // Status icon mapping
  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'RUNNING': return <RunningIcon />;
      case 'COMPLETED': return <CompletedIcon />;
      case 'FAILED': return <ErrorIcon />;
      case 'QUEUED': return <PendingIcon />;
      case 'CANCELLED': return <CancelIcon />;
      default: return <PendingIcon />;
    }
  };

  const handleViewDetails = (run: WorkflowRunWithSocket) => {
    if (run.id) {
      navigate(`/workflows/runs/${run.id}${run.contentId ? `?contentId=${run.contentId}` : ''}`);
    }
  };

  const handleShowDetails = (run: WorkflowRunWithSocket) => {
    setSelectedRun(run);
    setDetailsOpen(true);
  };

  const handleConnectToRun = (runId: string) => {
    if (connectedExecutionId === runId) {
      disconnectFromExecution();
    } else {
      connectToExecution(runId);
    }
  };

  const formatDuration = (startedAt: string, finishedAt?: string) => {
    const start = new Date(startedAt);
    const end = finishedAt ? new Date(finishedAt) : new Date();
    const duration = end.getTime() - start.getTime();
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <LinearProgress sx={{ flexGrow: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Loading workflow runs...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Workflow Runs
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          {socketConnected && (
            <Chip
              label="Live Updates"
              color="success"
              size="small"
              variant="outlined"
            />
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refreshRuns()}
          >
            Refresh
          </Button>
        </Box>
      </Box>



      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" onClick={() => refreshRuns()}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {runs.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Runs
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {runs.filter(r => r.status === 'RUNNING').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Running
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {runs.filter(r => r.status === 'COMPLETED').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completed
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="error.main">
              {runs.filter(r => r.status === 'FAILED').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Failed
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Runs Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow key="header">
                <TableCell>Workflow</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Started</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Content ID</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {runs.length === 0 ? (
                <TableRow key="empty-state">
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" py={4}>
                      No workflow runs found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                runs.map((run) => (
                  <TableRow key={run.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="medium">
                          {run.workflowKey || 'Unknown Workflow'}
                        </Typography>
                        {run.isLive && (
                          <Chip
                            label="Live"
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(run.status)}
                        label={run.status}
                        color={getStatusColor(run.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(run.startedAt).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDuration(run.startedAt, run.finishedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {run.contentId && (
                        <Chip
                          label={run.contentId}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={1} justifyContent="flex-end">
                        {run.status === 'RUNNING' && run.runId && (
                          <Tooltip title={
                            connectedExecutionId === run.runId 
                              ? "Disconnect live updates" 
                              : "Connect for live updates"
                          }>
                            <IconButton
                              size="small"
                              onClick={() => handleConnectToRun(run.runId!)}
                              color={connectedExecutionId === run.runId ? "success" : "default"}
                            >
                              {connectedExecutionId === run.runId ? <StopIcon /> : <PlayIcon />}
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="View details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(run)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Workflow Run Details
        </DialogTitle>
        <DialogContent>
          {selectedRun && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Workflow:</strong> {selectedRun.workflowKey || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Run ID:</strong> {selectedRun.runId || selectedRun.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Status:</strong> {selectedRun.status}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Content ID:</strong> {selectedRun.contentId || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Started:</strong> {new Date(selectedRun.startedAt).toLocaleString()}
                  </Typography>
                </Grid>
                {selectedRun.finishedAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Finished:</strong> {new Date(selectedRun.finishedAt).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                {selectedRun.errorMessage && (
                  <Grid item xs={12}>
                    <Alert severity="error">
                      <strong>Error:</strong> {selectedRun.errorMessage}
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
          {selectedRun && (
            <Button
              variant="contained"
              onClick={() => {
                handleViewDetails(selectedRun);
                setDetailsOpen(false);
              }}
            >
              View Full Details
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowRunsList;