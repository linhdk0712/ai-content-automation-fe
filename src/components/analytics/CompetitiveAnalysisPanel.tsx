import React from 'react';
import { Box, Typography } from '@mui/material';

interface CompetitiveAnalysisPanelProps {
  workspaceId: string;
  data?: any;
  loading?: boolean;
}

export const CompetitiveAnalysisPanel: React.FC<CompetitiveAnalysisPanelProps> = ({ workspaceId, data, loading }) => {
  return (
    <Box>
      <Typography variant="h6">Competitive Analysis</Typography>
      <Typography variant="body2" color="text.secondary">Workspace: {workspaceId}</Typography>
    </Box>
  );
};

export default CompetitiveAnalysisPanel;

