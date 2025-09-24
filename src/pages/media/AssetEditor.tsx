import {
  Box, Typography
} from '@mui/material';
import React from 'react';

const AssetEditor: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Asset Editor
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Edit and enhance your images with built-in tools
      </Typography>
    </Box>
  );
};

export default AssetEditor;