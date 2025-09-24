import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

interface PredictiveAnalyticsPanelProps {
  workspaceId: string;
  userId: string;
  data?: any;
  loading?: boolean;
}

export const PredictiveAnalyticsPanel: React.FC<PredictiveAnalyticsPanelProps> = ({ workspaceId, userId, data, loading }) => {
  if (loading) {
    return <Alert severity="info">Loading predictive analytics...</Alert>;
  }
  return (
    <Box>
      <Typography variant="h6">Predictive Analytics</Typography>
      <Typography variant="body2" color="text.secondary">Workspace: {workspaceId} • User: {userId}</Typography>
    </Box>
  );
};

export default PredictiveAnalyticsPanel;

