import {
  AccessTime,
  AutoFixHigh,
  Close,
  Error,
  Info,
  Merge,
  Schedule,
  SwapHoriz,
  Warning,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useConflictDetection } from '../../hooks/useScheduling';
import { ConflictResolution, SchedulingConflict } from '../../types/scheduling';

const SchedulingConflictResolver: React.FC = () => {
  const [selectedConflict, setSelectedConflict] = useState<SchedulingConflict | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<ConflictResolution | null>(null);
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);

  const { conflicts, resolveConflict, isResolving } = useConflictDetection();

  useEffect(() => {
    if (conflicts.length > 0 && !selectedConflict) {
      setSelectedConflict(conflicts[0]);
    }
  }, [conflicts, selectedConflict]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Error color="error" />;
      case 'medium':
        return <Warning color="warning" />;
      case 'low':
        return <Info color="info" />;
      default:
        return <Info />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getConflictTypeDescription = (type: string) => {
    switch (type) {
      case 'time_overlap':
        return 'Posts scheduled too close together';
      case 'platform_limit':
        return 'Platform posting limit exceeded';
      case 'content_similarity':
        return 'Similar content already scheduled';
      default:
        return 'Scheduling conflict detected';
    }
  };

  const getResolutionIcon = (type: string) => {
    switch (type) {
      case 'reschedule':
        return <Schedule />;
      case 'merge':
        return <Merge />;
      case 'replace':
        return <SwapHoriz />;
      case 'ignore':
        return <Close />;
      default:
        return <AutoFixHigh />;
    }
  };

  const handleResolveConflict = (resolution: ConflictResolution) => {
    if (selectedConflict) {
      resolveConflict({ conflictId: selectedConflict.id, resolution });
      setShowResolutionDialog(false);
      setSelectedResolution(null);
    }
  };

  const renderConflictList = () => (
    <List>
      {conflicts.map((conflict) => (
        <ListItem
          key={conflict.id}
          button
          selected={selectedConflict?.id === conflict.id}
          onClick={() => setSelectedConflict(conflict)}
        >
          <ListItemIcon>
            {getSeverityIcon(conflict.severity)}
          </ListItemIcon>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle2">
                  {conflict.existingPost.title} vs {conflict.newPost.title}
                </Typography>
                <Chip
                  label={conflict.severity}
                  size="small"
                  color={getSeverityColor(conflict.severity)}
                />
              </Box>
            }
            secondary={
              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  {getConflictTypeDescription(conflict.conflictType)}
                </Typography>
                <Typography variant="caption">
                  Existing: {moment(conflict.existingPost.scheduledTime).format('MMM DD, YYYY HH:mm')} |
                  New: {moment(conflict.newPost.scheduledTime).format('MMM DD, YYYY HH:mm')}
                </Typography>
              </Stack>
            }
          />
        </ListItem>
      ))}
    </List>
  );

  const renderConflictDetails = () => {
    if (!selectedConflict) return null;

    return (
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Conflict Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Existing Post
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedConflict.existingPost.title}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <AccessTime fontSize="small" />
                    <Typography variant="caption">
                      {moment(selectedConflict.existingPost.scheduledTime).format('MMM DD, YYYY HH:mm')}
                    </Typography>
                  </Box>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {selectedConflict.existingPost.platforms.map(platform => (
                      <Chip key={platform} label={platform} size="small" />
                    ))}
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    New Post
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedConflict.newPost.title}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <AccessTime fontSize="small" />
                    <Typography variant="caption">
                      {moment(selectedConflict.newPost.scheduledTime).format('MMM DD, YYYY HH:mm')}
                    </Typography>
                  </Box>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {selectedConflict.newPost.platforms?.map(platform => (
                      <Chip key={platform} label={platform} size="small" />
                    ))}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Suggested Resolutions
            </Typography>
            <List>
              {selectedConflict.suggestions.map((suggestion, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => {
                    setSelectedResolution(suggestion);
                    setShowResolutionDialog(true);
                  }}
                >
                  <ListItemIcon>
                    {getResolutionIcon(suggestion.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                          {suggestion.type.replace('_', ' ')}
                        </Typography>
                        <Chip
                          label={`${Math.round(suggestion.confidence * 100)}% confidence`}
                          size="small"
                          color={suggestion.confidence > 0.8 ? 'success' : 'default'}
                        />
                      </Box>
                    }
                    secondary={
                      <Stack spacing={0.5}>
                        <Typography variant="body2">
                          {suggestion.description}
                        </Typography>
                        {suggestion.newTime && (
                          <Typography variant="caption" color="primary">
                            Suggested time: {moment(suggestion.newTime).format('MMM DD, YYYY HH:mm')}
                          </Typography>
                        )}
                      </Stack>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Stack>
    );
  };

  const renderResolutionDialog = () => (
    <Dialog
      open={showResolutionDialog}
      onClose={() => setShowResolutionDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Confirm Resolution
      </DialogTitle>
      <DialogContent>
        {selectedResolution && (
          <Stack spacing={2}>
            <Alert severity="info">
              <Typography variant="subtitle2" gutterBottom>
                {selectedResolution.type.charAt(0).toUpperCase() + selectedResolution.type.slice(1).replace('_', ' ')}
              </Typography>
              <Typography variant="body2">
                {selectedResolution.description}
              </Typography>
            </Alert>

            {selectedResolution.newTime && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  New Scheduled Time
                </Typography>
                <Typography variant="body1">
                  {moment(selectedResolution.newTime).format('dddd, MMMM Do YYYY [at] h:mm A')}
                </Typography>
              </Box>
            )}

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Confidence Level
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2">
                  {Math.round(selectedResolution.confidence * 100)}%
                </Typography>
                <Chip
                  label={selectedResolution.confidence > 0.8 ? 'High' : selectedResolution.confidence > 0.6 ? 'Medium' : 'Low'}
                  size="small"
                  color={selectedResolution.confidence > 0.8 ? 'success' : selectedResolution.confidence > 0.6 ? 'warning' : 'error'}
                />
              </Box>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowResolutionDialog(false)}>
          Cancel
        </Button>
        <Button
          onClick={() => selectedResolution && handleResolveConflict(selectedResolution)}
          variant="contained"
          disabled={isResolving}
        >
          {isResolving ? 'Resolving...' : 'Apply Resolution'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (conflicts.length === 0) {
    return null; // Don't show the component if there are no conflicts
  }

  return (
    <>
      <Dialog open={conflicts.length > 0} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Warning color="warning" />
            Scheduling Conflicts Detected
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            {conflicts.length} scheduling conflict{conflicts.length > 1 ? 's' : ''} detected. 
            Please review and resolve before proceeding.
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Conflicts ({conflicts.length})
              </Typography>
              <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
                {renderConflictList()}
              </Paper>
            </Grid>
            <Grid item xs={12} md={8}>
              {selectedConflict ? (
                renderConflictDetails()
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="300px">
                  <Typography color="text.secondary">
                    Select a conflict to view details and resolutions
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => window.location.reload()}>
            Ignore All Conflicts
          </Button>
          <Button variant="contained" disabled={conflicts.length > 0}>
            All Conflicts Resolved
          </Button>
        </DialogActions>
      </Dialog>

      {renderResolutionDialog()}
    </>
  );
};

export default SchedulingConflictResolver;