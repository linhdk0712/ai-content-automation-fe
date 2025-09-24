import React from 'react';
import { Box, Typography } from '@mui/material';

interface AutomatedInsightsPanelProps {
  workspaceId: string;
  userId: string;
  data?: any[];
  loading?: boolean;
}

export const AutomatedInsightsPanel: React.FC<AutomatedInsightsPanelProps> = ({ workspaceId, userId, data, loading }) => {
  return (
    <Box>
      <Typography variant="h6">Automated Insights</Typography>
      <Typography variant="body2" color="text.secondary">Workspace: {workspaceId} • User: {userId}</Typography>
    </Box>
  );
};

export default AutomatedInsightsPanel;

