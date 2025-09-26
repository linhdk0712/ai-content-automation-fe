import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Stack,
  Paper
} from '@mui/material';
import { useRealtimeEvents } from '../../hooks/useRealtimeEvents';

export const RealtimeEventsTest: React.FC = () => {
  const [tenantId, setTenantId] = useState('test-tenant');
  const [eventType, setEventType] = useState('task_completed');
  const [customPayload, setCustomPayload] = useState('{"status": "success", "progress": 100}');
  
  const {
    events,
    isSubscribed,
    lastEvent,
    createTestEvent,
    requestNotificationPermission,
    loadRecentEvents,
    subscribeToEventType,
    subscribeToTenantEvents,
    subscribeToTaskEvents
  } = useRealtimeEvents({
    tenantId,
    autoSubscribe: true,
    showBrowserNotifications: true
  });

  const handleCreateTestEvent = async () => {
    try {
      let payload;
      try {
        payload = JSON.parse(customPayload);
      } catch {
        payload = { message: customPayload };
      }

      await createTestEvent(eventType, payload);
    } catch (error) {
      console.error('Error creating test event:', error);
      alert('Failed to create test event. Check console for details.');
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      alert('Notification permission granted!');
    } else {
      alert('Notification permission denied.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🔥 Realtime Events Test
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        This component tests realtime events from the `realtime_events` table. 
        When you create a test event, it should appear in real-time and show a popup notification.
      </Alert>

      {/* Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Connection Status
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip 
              label={isSubscribed ? 'Connected' : 'Disconnected'} 
              color={isSubscribed ? 'success' : 'error'} 
            />
            <Typography variant="body2">
              Tenant ID: <strong>{tenantId}</strong>
            </Typography>
            <Typography variant="body2">
              Total Events: <strong>{events.length}</strong>
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Controls
          </Typography>
          
          <Stack spacing={2}>
            <TextField
              label="Tenant ID"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              size="small"
              fullWidth
            />
            
            <TextField
              label="Event Type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              size="small"
              fullWidth
              placeholder="e.g., task_completed, user_action, system_alert"
            />
            
            <TextField
              label="Custom Payload (JSON)"
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
              size="small"
              fullWidth
              multiline
              rows={3}
              placeholder='{"key": "value"}'
            />
            
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button 
                variant="contained" 
                onClick={handleCreateTestEvent}
                color="primary"
              >
                🚀 Create Test Event
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={handleRequestPermission}
              >
                🔔 Request Notification Permission
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={loadRecentEvents}
              >
                🔄 Reload Events
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={() => subscribeToEventType(eventType)}
                color="secondary"
              >
                🎯 Subscribe to Event Type
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={() => subscribeToTenantEvents(tenantId)}
                color="secondary"
              >
                🏢 Subscribe to Tenant
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={() => subscribeToTaskEvents(`task-${Date.now()}`)}
                color="secondary"
              >
                📋 Subscribe to Task
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Last Event */}
      {lastEvent && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              🎯 Latest Event
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {JSON.stringify(lastEvent, null, 2)}
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Recent Events ({events.length})
          </Typography>
          
          {events.length === 0 ? (
            <Alert severity="info">
              No events yet. Create a test event to see real-time updates!
            </Alert>
          ) : (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {events.map((event, index) => (
                <React.Fragment key={event.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip label={event.type} size="small" color="primary" />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(event.created_at)}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            <strong>Tenant:</strong> {event.tenant_id}
                          </Typography>
                          {event.task_id && (
                            <Typography variant="body2">
                              <strong>Task:</strong> {event.task_id}
                            </Typography>
                          )}
                          {event.payload && (
                            <Typography variant="body2" component="pre" sx={{ 
                              fontFamily: 'monospace', 
                              fontSize: '0.75rem',
                              mt: 1,
                              p: 1,
                              bgcolor: 'grey.100',
                              borderRadius: 1,
                              overflow: 'auto'
                            }}>
                              {JSON.stringify(event.payload, null, 2)}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < events.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};