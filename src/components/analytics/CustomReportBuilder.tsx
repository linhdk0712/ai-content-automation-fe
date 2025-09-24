import React from 'react';
import { Box, Typography } from '@mui/material';

interface CustomReportBuilderProps {
  workspaceId: string;
  userId: string;
  timeRange: { startDate: string; endDate: string };
}

export const CustomReportBuilder: React.FC<CustomReportBuilderProps> = ({ workspaceId, userId, timeRange }) => {
  return (
    <Box>
      <Typography variant="h6">Custom Report Builder</Typography>
      <Typography variant="body2" color="text.secondary">Range: {timeRange.startDate} → {timeRange.endDate}</Typography>
    </Box>
  );
};

export default CustomReportBuilder;

