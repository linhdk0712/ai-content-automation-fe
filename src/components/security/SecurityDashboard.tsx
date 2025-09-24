import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  Security,
  Warning,
  Shield,
  Lock,
  Visibility,
  VerifiedUser,
  Report} from '@mui/icons-material';
import { useSecurityDashboard } from '../../hooks/useSecurityDashboard';

interface UISecurityMetrics {
  securityScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  threatEvents: number;
  auditEvents: number;
  dlpViolations: number;
  complianceViolations: number;
  activeKeys: number;
  lastUpdated: string;
}

interface UIThreatEvent {
  id: string;
  type: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  detectedAt: string;
  status: string;
}

const SecurityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<UISecurityMetrics | null>(null);
  const [threatEvents, setThreatEvents] = useState<UIThreatEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<UIThreatEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const { 
    getSecurityMetrics, 
    getThreatEvents, 
    resolveThreateEvent 
  } = useSecurityDashboard();

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const [metricsData, eventsData] = await Promise.all([
        getSecurityMetrics(),
        getThreatEvents({ limit: 10 })
      ]);
      
      const normalizedRisk = String((metricsData as any).riskLevel).toUpperCase();
      const uiMetrics: UISecurityMetrics = {
        ...(metricsData as any),
        riskLevel: (['LOW','MEDIUM','HIGH','CRITICAL'].includes(normalizedRisk)
          ? normalizedRisk
          : 'LOW') as UISecurityMetrics['riskLevel']
      };
      setMetrics(uiMetrics);
      const uiEvents: UIThreatEvent[] = (eventsData as any[]).map((e) => {
        const normalized = String((e as any).level).toUpperCase();
        return {
          ...(e as any),
          level: (['LOW','MEDIUM','HIGH','CRITICAL'].includes(normalized) ? normalized : 'LOW') as UIThreatEvent['level']
        };
      });
      setThreatEvents(uiEvents);
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  const getThreatLevelIcon = (level: string) => {
    switch (level) {
      case 'LOW': return <Shield color="success" />;
      case 'MEDIUM': return <Warning color="warning" />;
      case 'HIGH': return <Report color="error" />;
      case 'CRITICAL': return <Security color="error" />;
      default: return <Security />;
    }
  };

  const handleEventClick = (event: UIThreatEvent) => {
    setSelectedEvent(event);
  };

  const handleResolveEvent = async (eventId: string) => {
    try {
      await resolveThreateEvent(eventId);
      await loadSecurityData();
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to resolve threat event:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Security Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Security Dashboard
      </Typography>

      {/* Security Score Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VerifiedUser color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Security Score</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {metrics?.securityScore || 0}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={metrics?.securityScore || 0} 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Risk Level</Typography>
              </Box>
              <Chip 
                label={metrics?.riskLevel || 'UNKNOWN'}
                color={getRiskLevelColor(metrics?.riskLevel || 'UNKNOWN') as any}
                size="medium"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Threat Events</Typography>
              </Box>
              <Typography variant="h3" color="error">
                {metrics?.threatEvents || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Lock color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Keys</Typography>
              </Box>
              <Typography variant="h3" color="success">
                {metrics?.activeKeys || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Compliance Status */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Compliance Status
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label="GDPR" color="success" variant="outlined" />
                <Chip label="SOX" color="success" variant="outlined" />
                <Chip label="ISO 27001" color="warning" variant="outlined" />
                <Chip label="PCI DSS" color="success" variant="outlined" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Violations
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">DLP Violations:</Typography>
                <Typography variant="body2" color="error">
                  {metrics?.dlpViolations || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Compliance Violations:</Typography>
                <Typography variant="body2" color="error">
                  {metrics?.complianceViolations || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Threat Events */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Threat Events
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Detected At</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {threatEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getThreatLevelIcon(event.level)}
                        <Typography sx={{ ml: 1 }}>{event.type}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={event.level}
                        color={getRiskLevelColor(event.level) as any}
                        size="medium"
                      />
                    </TableCell>
                    <TableCell>{event.description}</TableCell>
                    <TableCell>
                      {new Date(event.detectedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={event.status}
                        variant="outlined"
                        size="medium"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="medium"
                          onClick={() => handleEventClick(event)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Threat Event Details Dialog */}
      <Dialog 
        open={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Threat Event Details
        </DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedEvent.type}
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedEvent.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip 
                  label={`Level: ${selectedEvent.level}`}
                  color={getRiskLevelColor(selectedEvent.level) as any}
                  size="medium"
                />
                <Chip 
                  label={`Status: ${selectedEvent.status}`}
                  variant="outlined"
                  size="medium"
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Detected: {new Date(selectedEvent.detectedAt).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedEvent(null)}>
            Close
          </Button>
          {selectedEvent?.status === 'OPEN' && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => handleResolveEvent(selectedEvent.id)}
            >
              Resolve
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityDashboard;