import React from 'react';
import { Box, Typography } from '@mui/material';

interface ROITrackingPanelProps {
  workspaceId: string;
  userId: string;
  data?: any;
  loading?: boolean;
}

export const ROITrackingPanel: React.FC<ROITrackingPanelProps> = ({ workspaceId, userId, data, loading }) => {
  return (
    <Box>
      <Typography variant="h6">ROI Tracking</Typography>
      <Typography variant="body2" color="text.secondary">Workspace: {workspaceId} • User: {userId}</Typography>
    </Box>
  );
};

export default ROITrackingPanel;

