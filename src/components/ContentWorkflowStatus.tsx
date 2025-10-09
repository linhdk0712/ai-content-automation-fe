import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Alert,
  Divider,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CompletedIcon,
  Error as ErrorIcon,
  PlayArrow as RunningIcon,
  Pending as PendingIcon,
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

const ContentWorkflowStatus = ({
  contentId,
  userId,
  showDetails = true,
  onViewFullDetails
}: ContentWorkflowStatusProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showNodeDetails, setShowNodeDetails] = useState(false);

  const {
    status,
    nodeRuns,
    loading,
    error,
    refreshAll,
    socketConnected,
    connectToContent,
    disconnectFromContent
  } = useContentWorkflow({
    contentId,
    userId,
    autoRefresh: true,
    enableSocket: true
  });

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return 'success';
      case 'RUNNING': return 'warning';
      case 'FAILED': return 'error';
      case 'PARTIAL': return 'info';
      default: return 'default';
    }
  };

  // Status icon mapping
  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return <CompletedIcon />;
      case 'RUNNING': return <RunningIcon />;
      case 'FAILED': return <ErrorIcon />;
      case 'PARTIAL': return <PendingIcon />;
      default: return <ScheduleIcon />;
    }
  };

  // Node status icon mapping
  const getNodeStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success': return <CompletedIcon color="success" />;
      case 'failed': return <ErrorIcon color="error" />;
      case 'running': return <RunningIcon color="warning" />;
      default: return <PendingIcon color="disabled" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <LinearProgress sx={{ flexGrow: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Loading workflow status...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={() => refreshAll()}>
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
          <Alert severity="info">
            No workflow data found for content ID {contentId}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6">
              Workflow Status
            </Typography>
            <Chip
              icon={getStatusIcon(status.overallStatus)}
              label={status.overallStatus}
              color={getStatusColor(status.overallStatus)}
              size="small"
            />
            {socketConnected && (
              <Chip
                label="Live"
                color="success"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
          
          <Box display="flex" gap={1}>
            <Tooltip title={socketConnected ? "Disconnect real-time updates" : "Connect for real-time updates"}>
              <IconButton
                size="small"
                onClick={socketConnected ? disconnectFromContent : connectToContent}
                color={socketConnected ? "success" : "default"}
              >
                {socketConnected ? <StopIcon /> : <PlayIcon />}
              </IconButton>
            </Tooltip>
            
            <Button
              size="small"
              variant="outlined"
              onClick={() => refreshAll()}
            >
              Refresh
            </Button>
            
            {status.workflowRun && onViewFullDetails && (
              <Button
                size="small"
                variant="contained"
                startIcon={<ViewIcon />}
                onClick={() => onViewFullDetails(status.workflowRun!.id)}
              >
                View Details
              </Button>
            )}
          </Box>
        </Box>

        {/* Progress */}
        {status.overallStatus === 'RUNNING' && (
          <Box mb={2}>
            <LinearProgress 
              variant="indeterminate" 
              color="primary"
              sx={{ height: 6, borderRadius: 3 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Workflow is running...
            </Typography>
          </Box>
        )}

        {/* Workflow Run Info */}
        {status.workflowRun && (
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Workflow:</strong> {status.workflowRun.workflowKey || 'Unknown'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Started:</strong> {new Date(status.workflowRun.startedAt).toLocaleString()}
              </Typography>
            </Grid>
            {status.workflowRun.finishedAt && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Finished:</strong> {new Date(status.workflowRun.finishedAt).toLocaleString()}
                </Typography>
              </Grid>
            )}
          </Grid>
        )}

        {/* Node Details */}
        {showDetails && nodeRuns.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Accordion 
              expanded={showNodeDetails} 
              onChange={() => setShowNodeDetails(!showNodeDetails)}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">
                  Node Executions ({nodeRuns.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {nodeRuns.slice(0, 10).map((nodeRun, index) => (
                    <ListItem key={`${nodeRun.executionId}-${nodeRun.nodeName}-${index}`}>
                      <ListItemIcon>
                        {getNodeStatusIcon(nodeRun.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={nodeRun.nodeName}
                        secondary={
                          <React.Fragment>
                            <Typography variant="caption" display="block" component="span">
                              Status: {nodeRun.status} | Type: {nodeRun.nodeType || 'Unknown'}
                            </Typography>
                            {nodeRun.finishedAt && (
                              <Typography variant="caption" color="text.secondary" component="span">
                                Finished: {new Date(nodeRun.finishedAt).toLocaleString()}
                              </Typography>
                            )}
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                  ))}
                  {nodeRuns.length > 10 && (
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography variant="caption" color="text.secondary">
                            ... and {nodeRuns.length - 10} more nodes
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                </List>
              </AccordionDetails>
            </Accordion>
          </>
        )}

        {/* Summary Stats */}
        <Box mt={2}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary" display="block">
                Total Nodes
              </Typography>
              <Typography variant="h6">
                {status.totalNodes || nodeRuns.length}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary" display="block">
                Completed
              </Typography>
              <Typography variant="h6" color="success.main">
                {nodeRuns.filter(n => n.status === 'success').length}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary" display="block">
                Failed
              </Typography>
              <Typography variant="h6" color="error.main">
                {status.failedNodes || nodeRuns.filter(n => n.status === 'failed').length}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary" display="block">
                Running
              </Typography>
              <Typography variant="h6" color="warning.main">
                {nodeRuns.filter(n => n.status === 'running').length}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ContentWorkflowStatus;