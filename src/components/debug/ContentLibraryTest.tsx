import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

const ContentLibraryTest: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Content Library Test
      </Typography>
      
      <Typography variant="body1" gutterBottom>
        Auth Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </Typography>
      
      <Typography variant="body1" gutterBottom>
        User: {user ? user.username || user.email : 'No user'}
      </Typography>

      <Button 
        variant="contained" 
        onClick={() => console.log('Test button clicked')}
        sx={{ mt: 2 }}
      >
        Test Button
      </Button>
    </Box>
  );
};

export default ContentLibraryTest;