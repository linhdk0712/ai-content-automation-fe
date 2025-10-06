import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import { PlayArrow, Stop, Refresh } from '@mui/icons-material';
import { triggerAiAvatarWorkflow } from '../../services/n8n.service';
import { generateContentId } from '../../utils/uuid';
import { useWorkflowRuns } from '../../hooks/useWorkflowRuns';
import { useI18n } from '../../hooks/useI18n';

const WorkflowDemo: React.FC = () => {
  const { t } = useI18n();
  const [isTriggering, setIsTriggering] = useState(false);
  const [lastTriggeredRun, setLastTriggeredRun] = useState<string | null>(null);
  
  const userId = 1; // Demo user ID
  
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

  const handleTriggerWorkflow = async () => {
    setIsTriggering(true);
    try {
      const demoData = {
        title: 'Demo Content',
        input: 'This is a demo content for testing workflow functionality.',
        metadata: {
          industry: 'technology',
          contentType: 'blog',
          language: 'en',
          tone: 'professional',
          targetAudience: 'developers'
        }
      };

      // Generate a unique content ID for demo workflow
      const contentId = generateContentId();
      console.log('Generated demo content ID:', contentId);
      
      const run = await triggerAiAvatarWorkflow(contentId, demoData);
      console.log('Demo workflow triggered:', run);
      
      if (run.runId) {
        setLastTriggeredRun(run.runId);
        // Auto-connect to the new run for live updates
        connectToRun(run.runId);
      }
      
      // Refresh the runs list to show the new run
      setTimeout(() => {
        refreshRuns();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to trigger demo workflow:', error);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleConnectToLatestRun = () => {
    const runningRuns = runs.filter(run => run.status === 'RUNNING');
    if (runningRuns.length > 0) {
      const latestRun = runningRuns[0];
      if (latestRun.runId) {
        connectToRun(latestRun.runId);
      }
    }
  };

  const runningRuns = runs.filter(run => run.status === 'RUNNING');
  const completedRuns = runs.filter(run => run.status === 'COMPLETED');
  const failedRuns = runs.filter(run => run.status === 'FAILED');

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Workflow Demo - Complete Integration Test
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        This demo shows the complete workflow integration: trigger → SSE updates → database sync → UI updates
      </Typography>

      {/* Control Panel */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Control Panel
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={handleTriggerWorkflow}
                disabled={isTriggering}
              >
                {isTriggering ? 'Triggering...' : 'Trigger Demo Workflow'}
              </Button>
            </Grid>
            
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={refreshRuns}
                disabled={loading}
              >
                Refresh Runs
              </Button>
            </Grid>
            
            {runningRuns.length > 0 && (
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={sseConnected ? <Stop /> : <PlayArrow />}
                  onClick={sseConnected ? disconnectFromRun : handleConnectToLatestRun}
                  color={sseConnected ? 'error' : 'success'}
                >
                  {sseConnected ? 'Disconnect SSE' : 'Connect to Latest Run'}
                </Button>
              </Grid>
            )}
          </Grid>

          {/* Connection Status */}
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`SSE: ${sseConnected ? 'Connected' : 'Disconnected'}`}
              color={sseConnected ? 'success' : 'default'}
              size="small"
            />
            {connectedRunId && (
              <Chip
                label={`Monitoring: ${connectedRunId}`}
                color="info"
                size="small"
              />
            )}
            {lastTriggeredRun && (
              <Chip
                label={`Last Triggered: ${lastTriggeredRun}`}
                color="secondary"
                size="small"
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Workflow Statistics
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {runs.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Runs
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {runningRuns.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Running
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {completedRuns.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="error.main">
                  {failedRuns.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Failed
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Runs */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Workflow Runs ({runs.length})
          </Typography>
          
          {loading && (
            <Typography color="text.secondary">Loading runs...</Typography>
          )}
          
          {runs.length === 0 && !loading && (
            <Typography color="text.secondary">
              No workflow runs found. Trigger a demo workflow to get started.
            </Typography>
          )}
          
          {runs.slice(0, 5).map((run, index) => (
            <Box key={run.id}>
              {index > 0 && <Divider sx={{ my: 2 }} />}
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={2}>
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
                      sx={{ ml: 1 }}
                    />
                  )}
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2">
                    <strong>ID:</strong> {run.id}
                  </Typography>
                  {run.runId && (
                    <Typography variant="caption" color="text.secondary">
                      Run: {run.runId}
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2">
                    <strong>Started:</strong> {new Date(run.startedAt).toLocaleTimeString()}
                  </Typography>
                  {run.lastUpdated && (
                    <Typography variant="caption" color="text.secondary">
                      Updated: {run.lastUpdated.toLocaleTimeString()}
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} sm={2}>
                  <Typography variant="body2">
                    <strong>Duration:</strong> {
                      run.finishedAt 
                        ? Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000) + 's'
                        : Math.round((Date.now() - new Date(run.startedAt).getTime()) / 1000) + 's'
                    }
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={2}>
                  {run.status === 'RUNNING' && run.runId && (
                    <Button
                      size="small"
                      variant={connectedRunId === run.runId ? 'contained' : 'outlined'}
                      onClick={() => {
                        if (connectedRunId === run.runId) {
                          disconnectFromRun();
                        } else {
                          connectToRun(run.runId!);
                        }
                      }}
                    >
                      {connectedRunId === run.runId ? 'Disconnect' : 'Connect'}
                    </Button>
                  )}
                </Grid>
              </Grid>
              
              {run.errorMessage && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {run.errorMessage}
                </Alert>
              )}
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            How to Test
          </Typography>
          
          <Typography variant="body2" paragraph>
            1. <strong>Trigger Workflow:</strong> Click "Trigger Demo Workflow" to start a new workflow run
          </Typography>
          
          <Typography variant="body2" paragraph>
            2. <strong>Watch Live Updates:</strong> The system will auto-connect to the new run for real-time updates via SSE
          </Typography>
          
          <Typography variant="body2" paragraph>
            3. <strong>Simulate Backend Updates:</strong> Use the backend test endpoints to simulate n8n callbacks:
          </Typography>
          
          <Box component="pre" sx={{ fontSize: '0.8rem', backgroundColor: 'grey.100', p: 2, borderRadius: 1, mt: 1 }}>
{`# Simulate node completion
POST /api/v1/n8n/test/simulate-callback
Body: {
  "executionId": "your-run-id",
  "nodeName": "Content Processor",
  "status": "success"
}

# Simulate workflow completion
POST /api/v1/n8n/test/simulate-update/ai-avatar
Headers: X-User-Id: 1
Body: {"status": "COMPLETED"}`}
          </Box>
          
          <Typography variant="body2" paragraph sx={{ mt: 2 }}>
            4. <strong>Monitor Updates:</strong> Watch the UI update in real-time as the workflow progresses
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WorkflowDemo;