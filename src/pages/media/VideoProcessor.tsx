import {
  Box, Typography
} from '@mui/material';
import React from 'react';

const VideoProcessor: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Video Processor
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Process and optimize your videos for different platforms
      </Typography>
    </Box>
  );
};

export default VideoProcessor;