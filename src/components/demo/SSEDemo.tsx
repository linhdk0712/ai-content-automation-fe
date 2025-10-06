import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { useSSE } from '../../hooks/useSSE';

const SSEDemo: React.FC = () => {
  const [workflowKey, setWorkflowKey] = useState('ai-avatar');
  const [runId, setRunId] = useState('');
  const [userId] = useState(1); // Demo user ID
  const [messages, setMessages] = useState<string[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);

  const {
    isConnected,
    connectionState,
    connectToWorkflow,
    connectToRun,
    disconnect,
    error
  } = useSSE({
    userId,
    onConnection: (data) => {
      setMessages(prev => [...prev, `Connected: ${data}`]);
    },
    onWorkflowUpdate: (data) => {
      setMessages(prev => [...prev, `Workflow Update: ${JSON.stringify(data)}`]);
      setUpdates(prev => [...prev, { type: 'workflow', data, timestamp: new Date() }]);
    },
    onRunUpdate: (data) => {
      setMessages(prev => [...prev, `Run Update: ${JSON.stringify(data)}`]);
      setUpdates(prev => [...prev, { type: 'run', data, timestamp: new Date() }]);
    },
    onNodeUpdate: (data) => {
      setMessages(prev => [...prev, `Node Update: ${JSON.stringify(data)}`]);
      setUpdates(prev => [...prev, { type: 'node', data, timestamp: new Date() }]);
    },
    onError: (error) => {
      setMessages(prev => [...prev, `Error: ${error.type}`]);
    }
  });

  const handleConnectToWorkflow = () => {
    if (workflowKey.trim()) {
      connectToWorkflow(workflowKey.trim());
    }
  };

  const handleConnectToRun = () => {
    if (runId.trim()) {
      connectToRun(runId.trim());
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setUpdates([]);
  };

  const getConnectionStateText = (state: number | null) => {
    switch (state) {
      case 0: return 'CONNECTING';
      case 1: return 'OPEN';
      case 2: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        SSE Demo - Real-time Workflow Updates
      </Typography>

      {/* Connection Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Connection Status
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <Chip
              label={isConnected ? 'Connected' : 'Disconnected'}
              color={isConnected ? 'success' : 'default'}
            />
            <Chip
              label={getConnectionStateText(connectionState)}
              variant="outlined"
            />
            <Typography variant="body2" color="text.secondary">
              User ID: {userId}
            </Typography>
          </Box>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Connection Error: {error.type}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Connection Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Connect to Streams
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField
              label="Workflow Key"
              value={workflowKey}
              onChange={(e) => setWorkflowKey(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />
            <Button
              variant="contained"
              onClick={handleConnectToWorkflow}
              disabled={!workflowKey.trim()}
            >
              Connect to Workflow
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField
              label="Run ID"
              value={runId}
              onChange={(e) => setRunId(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
              placeholder="e.g., test-run-123"
            />
            <Button
              variant="contained"
              onClick={handleConnectToRun}
              disabled={!runId.trim()}
            >
              Connect to Run
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={disconnect}
              disabled={!isConnected}
            >
              Disconnect
            </Button>
            <Button
              variant="outlined"
              onClick={clearMessages}
            >
              Clear Messages
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Messages Log */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Messages Log ({messages.length})
          </Typography>
          <Box
            sx={{
              maxHeight: 300,
              overflow: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 1,
              backgroundColor: 'grey.50'
            }}
          >
            {messages.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No messages yet. Connect to a stream to see real-time updates.
              </Typography>
            ) : (
              messages.map((message, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    mb: 0.5,
                    wordBreak: 'break-all'
                  }}
                >
                  [{new Date().toLocaleTimeString()}] {message}
                </Typography>
              ))
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Structured Updates */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Structured Updates ({updates.length})
          </Typography>
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {updates.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No updates yet"
                  secondary="Connect to a stream and trigger some workflow updates to see structured data here."
                />
              </ListItem>
            ) : (
              updates.slice().reverse().map((update, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={update.type}
                            size="small"
                            color={
                              update.type === 'workflow' ? 'primary' :
                              update.type === 'run' ? 'secondary' : 'default'
                            }
                          />
                          <Typography variant="body2">
                            {update.timestamp.toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                            {JSON.stringify(update.data, null, 2)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < updates.length - 1 && <Divider />}
                </React.Fragment>
              ))
            )}
          </List>
        </CardContent>
      </Card>

      {/* Test Instructions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            How to Test
          </Typography>
          <Typography variant="body2" paragraph>
            1. Connect to a workflow stream (e.g., "ai-avatar")
          </Typography>
          <Typography variant="body2" paragraph>
            2. Use the backend test endpoints to simulate updates:
          </Typography>
          <Box component="pre" sx={{ fontSize: '0.8rem', backgroundColor: 'grey.100', p: 2, borderRadius: 1 }}>
{`# Test workflow update
POST /api/v1/n8n/test/simulate-update/ai-avatar
Headers: X-User-Id: 1
Body: {"status": "RUNNING", "message": "Processing content"}

# Test node callback
POST /api/v1/n8n/test/simulate-callback
Body: {
  "executionId": "test-run-123",
  "nodeName": "Content Processor",
  "status": "success"
}`}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SSEDemo;