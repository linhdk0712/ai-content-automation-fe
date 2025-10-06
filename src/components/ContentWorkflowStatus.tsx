import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  LinearProgress,
  Collapse,
  Grid,
  Divider,
  Button,
  Alert,
  CircularProgress,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  LiveTv as LiveIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useContentWorkflow } from '../hooks/useContentWorkflow';
import { ContentWorkflowStatusDto, N8nNodeRunDto } from '../services/n8n.service';

interface ContentWorkflowStatusProps {
  contentId: number;
  userId: number;
  showDetails?: boolean;
  onViewFullDetails?: (runId: number) => void;
}

const ContentWorkflowStatus: React.FC<ContentWorkflowStatusProps> = ({
  contentId,
  userId,
  showDetails = true,
  onViewFullDetails
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showNodeDetails, setShowNodeDetails] = useState(false);

  const {
    status,
    nodeRuns,
    loading,
    error,
    refreshAll,
    sseConnected,
    connectToWorkflow,
    disconnectFromWorkflow
  } = useContentWorkflow({
    contentId,
    userId,
    autoRefresh: true,
    enableSSE: true
  });

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'RUNNING': return 'warning';
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'error';
      case 'PARTIAL': return 'info';
      case 'NO_DATA': return 'default';
      default: return 'default';
    }
  };

  // Status icon mapping
  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'RUNNING': return <CircularProgress size={16} />;
      case 'COMPLETED': return <CheckCircleIcon color="success" />;
      case 'FAILED': return <ErrorIcon color="error" />;
      case 'PARTIAL': return <ScheduleIcon color="info" />;
      case 'NO_DATA': return <ScheduleIcon color="disabled" />;
      default: return <ScheduleIcon />;
    }
  };

  // Node status icon
  const getNodeStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success': return <CheckCircleIcon color="success" fontSize="small" />;
      case 'failed': return <ErrorIcon color="error" fontSize="small" />;
      default: return <ScheduleIcon color="disabled" fontSize="small" />;
    }
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!status || status.totalNodes === 0) return 0;
    return Math.round((status.successfulNodes / status.totalNodes) * 100);
  };

  // Format duration
  const formatDuration = (startedAt?: string, finishedAt?: string) => {
    if (!startedAt) return 'N/A';
    
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

  // Handle SSE toggle
  const handleToggleSSE = () => {
    if (sseConnected) {
      disconnectFromWorkflow();
    } else {
      connectToWorkflow();
    }
  };

  if (loading && !status) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={20} />
            <Typography>Loading workflow status...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error && !status) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" action={
            <Button size="small" onClick={refreshAll}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">
            No workflow data available for this content.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">
              Workflow Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getStatusIcon(status.overallStatus)}
              <Chip
                label={status.overallStatus}
                color={getStatusColor(status.overallStatus) as any}
                size="small"
              />
              {sseConnected && (
                <Chip
                  icon={<LiveIcon />}
                  label="Live"
                  color="success"
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {status.overallStatus === 'RUNNING' && (
              <Tooltip title={sseConnected ? 'Disconnect live updates' : 'Connect live updates'}>
                <IconButton
                  size="small"
                  color={sseConnected ? 'success' : 'default'}
                  onClick={handleToggleSSE}
                >
                  {sseConnected ? <StopIcon /> : <PlayIcon />}
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={refreshAll} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            {showDetails && (
              <Tooltip title={expanded ? 'Hide details' : 'Show details'}>
                <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                  {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Progress Summary */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Total Nodes
            </Typography>
            <Typography variant="h6">
              {status.totalNodes}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Successful
            </Typography>
            <Typography variant="h6" color="success.main">
              {status.successfulNodes}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Failed
            </Typography>
            <Typography variant="h6" color="error.main">
              {status.failedNodes}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="h6">
              {getProgressPercentage()}%
            </Typography>
          </Grid>
        </Grid>

        {/* Progress Bar */}
        {status.totalNodes > 0 && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={getProgressPercentage()}
              sx={{ height: 8, borderRadius: 4 }}
              color={status.overallStatus === 'FAILED' ? 'error' : 'primary'}
            />
          </Box>
        )}

        {/* Workflow Run Info */}
        {status.workflowRun && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Current Run: {status.workflowRun.workflowKey}
            </Typography>
            <Typography variant="body2">
              Started: {new Date(status.workflowRun.startedAt).toLocaleString()}
            </Typography>
            <Typography variant="body2">
              Duration: {formatDuration(status.workflowRun.startedAt, status.workflowRun.finishedAt)}
            </Typography>
            {onViewFullDetails && (
              <Button
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => onViewFullDetails(status.workflowRun!.id)}
                sx={{ mt: 1 }}
              >
                View Full Details
              </Button>
            )}
          </Box>
        )}

        {/* Error Message */}
        {status.workflowRun?.errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {status.workflowRun.errorMessage}
          </Alert>
        )}

        {/* Detailed View */}
        {showDetails && (
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Divider sx={{ my: 2 }} />
            
            {/* Node Runs */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">
                  Node Execution Details ({nodeRuns.length})
                </Typography>
                <Button
                  size="small"
                  onClick={() => setShowNodeDetails(!showNodeDetails)}
                >
                  {showNodeDetails ? 'Hide' : 'Show'} Nodes
                </Button>
              </Box>
              
              <Collapse in={showNodeDetails} timeout="auto" unmountOnExit>
                <List dense>
                  {nodeRuns.slice(0, 10).map((node, index) => (
                    <ListItem key={`${node.executionId}-${node.nodeName}-${index}`}>
                      <ListItemIcon>
                        {getNodeStatusIcon(node.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={node.nodeName}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Type: {node.nodeType || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Status: {node.status}
                            </Typography>
                            {node.finishedAt && (
                              <Typography variant="caption" display="block">
                                Finished: {new Date(node.finishedAt).toLocaleString()}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={node.status}
                          color={node.status === 'success' ? 'success' : node.status === 'failed' ? 'error' : 'default'}
                          size="small"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  {nodeRuns.length > 10 && (
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography variant="body2" color="text.secondary" align="center">
                            ... and {nodeRuns.length - 10} more nodes
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                </List>
              </Collapse>
            </Box>
          </Collapse>
        )}
      </CardContent>
    </Card>
  );
};

export default ContentWorkflowStatus;