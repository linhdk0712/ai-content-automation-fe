import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

interface RealTimeAnalyticsPanelProps {
  workspaceId: string;
  data?: any;
  enabled?: boolean;
  loading?: boolean;
}

export const RealTimeAnalyticsPanel: React.FC<RealTimeAnalyticsPanelProps> = ({ workspaceId, data, enabled, loading }) => {
  return (
    <Box>
      <Typography variant="h6">Real-time Analytics</Typography>
      <Chip size="small" label={enabled ? 'Live' : 'Paused'} color={enabled ? 'success' : 'default'} sx={{ mt: 1 }} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Workspace: {workspaceId}</Typography>
    </Box>
  );
};

export default RealTimeAnalyticsPanel;

