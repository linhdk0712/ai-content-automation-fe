import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Grid,
  Paper,
  Chip
} from '@mui/material';
import { PlayArrow, Stop, Refresh } from '@mui/icons-material';
import { triggerAiAvatarWorkflow } from '../../services/n8n.service';
import { generateContentId } from '../../utils/uuid';
import { useWorkflowRuns } from '../../hooks/useWorkflowRuns';
import { useI18n } from '../../hooks/useI18n';

const WorkflowDemo = () => {
  const { t } = useI18n();
  const [isTriggering, setIsTriggering] = useState(false);
  const [lastTriggeredRun, setLastTriggeredRun] = useState<string | null>(null);
  
  const userId = 1; // Demo user ID
  
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

  const handleTriggerWorkflow = async () => {
    setIsTriggering(true);
    try {
      const demoData = {
        title: 'Demo Content',
        content: 'This is a demo content for testing the AI Avatar workflow.',
        industry: 'technology',
        contentType: 'blog',
        language: 'en',
        tone: 'professional',
        targetAudience: 'developers'
      };

      const contentId = generateContentId();
      console.log('Triggering AI Avatar workflow with demo data:', { contentId, demoData });

      const result = await triggerAiAvatarWorkflow(contentId, demoData);
      console.log('Workflow triggered successfully:', result);

      if (result.runId) {
        setLastTriggeredRun(result.runId);
        // Auto-connect to the new run for real-time updates
        connectToExecution(result.runId);
      }

      // Refresh runs to show the new one
      await refreshRuns();
    } catch (error) {
      console.error('Failed to trigger workflow:', error);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleConnectToRun = (runId: string) => {
    if (connectedExecutionId === runId) {
      disconnectFromExecution();
    } else {
      connectToExecution(runId);
    }
  };

  const runningRuns = runs.filter(run => run.status === 'RUNNING');
  const completedRuns = runs.filter(run => run.status === 'COMPLETED');
  const failedRuns = runs.filter(run => run.status === 'FAILED');

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Workflow Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Test the AI Avatar workflow with demo data and see real-time updates via Socket.IO.
      </Typography>

      {/* Connection Status */}
      <Box mb={3}>
        <Alert 
          severity={socketConnected ? "success" : "warning"}
          action={
            <Button color="inherit" size="small" onClick={() => refreshRuns()}>
              <Refresh />
            </Button>
          }
        >
          {socketConnected 
            ? "Connected to real-time server - you'll see live updates!" 
            : "Not connected to real-time server - updates will be polled."
          }
        </Alert>
      </Box>

      {/* Stats */}
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
              {runningRuns.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Running
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {completedRuns.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completed
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="error.main">
              {failedRuns.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Failed
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Trigger Workflow */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Trigger Demo Workflow
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Click the button below to trigger an AI Avatar workflow with demo data.
          </Typography>

          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={handleTriggerWorkflow}
            disabled={isTriggering}
            size="large"
          >
            {isTriggering ? 'Triggering...' : 'Trigger AI Avatar Workflow'}
          </Button>

          {isTriggering && (
            <Box mt={2}>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Starting workflow...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Recent Runs */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Recent Workflow Runs
            </Typography>
            <Button
              startIcon={<Refresh />}
              onClick={() => refreshRuns()}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {runs.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
              No workflow runs yet. Trigger a workflow to see results here.
            </Typography>
          ) : (
            <Box>
              {runs.slice(0, 5).map((run) => (
                <Box key={run.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle2">
                        {run.workflowName || 'AI Avatar Workflow'}
                      </Typography>
                      <Chip
                        label={run.status}
                        color={
                          run.status === 'RUNNING' ? 'warning' :
                          run.status === 'COMPLETED' ? 'success' :
                          run.status === 'FAILED' ? 'error' : 'default'
                        }
                        size="small"
                      />
                      {run.isLive && (
                        <Chip
                          label="Live"
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    
                    {run.status === 'RUNNING' && run.runId && (
                      <Button
                        size="small"
                        startIcon={connectedExecutionId === run.runId ? <Stop /> : <PlayArrow />}
                        onClick={() => handleConnectToRun(run.runId!)}
                        color={connectedExecutionId === run.runId ? "success" : "primary"}
                      >
                        {connectedExecutionId === run.runId ? 'Disconnect' : 'Connect Live'}
                      </Button>
                    )}
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary">
                    Started: {new Date(run.startedAt).toLocaleString()}
                    {run.finishedAt && ` | Finished: ${new Date(run.finishedAt).toLocaleString()}`}
                    {run.contentId && ` | Content ID: ${run.contentId}`}
                  </Typography>
                </Box>
              ))}
              
              {runs.length > 5 && (
                <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={2}>
                  ... and {runs.length - 5} more runs
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default WorkflowDemo;