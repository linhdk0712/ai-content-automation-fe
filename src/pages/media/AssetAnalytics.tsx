import {
  Box,
  Typography
} from '@mui/material';
import React from 'react';

const AssetAnalytics: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Asset Analytics
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Track usage and performance of your media assets
      </Typography>
    </Box>
  );
};

export default AssetAnalytics;