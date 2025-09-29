import {
  Box,
  Button,
  CircularProgress,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ContentLibrarySimple: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Access auth context (provider is set in main.tsx)
  const authData = useAuth();

  useEffect(() => {
    console.log('ContentLibrarySimple mounted');
    setLoading(false);
  }, []);

  // No explicit error UI: app is wrapped by AuthProvider

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Content Library (Simple)
      </Typography>
      
      <Typography variant="body1" gutterBottom>
        Auth Status: {authData?.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </Typography>
      
      <Typography variant="body1" gutterBottom>
        User: {authData?.user ? (authData.user.username || authData.user.email) : 'No user'}
      </Typography>

      <Button 
        variant="contained" 
        onClick={() => navigate('/content/create')}
        sx={{ mt: 2, mr: 2 }}
      >
        Create Content
      </Button>

      <Button 
        variant="outlined" 
        onClick={() => console.log('Test button clicked')}
        sx={{ mt: 2 }}
      >
        Test Button
      </Button>

      <Typography variant="h6" sx={{ mt: 3 }}>
        Debug Info:
      </Typography>
      <Box component="pre" sx={{ fontSize: '12px', backgroundColor: '#f5f5f5', p: 1.25 }}>
        {JSON.stringify({
          isAuthenticated: authData?.isAuthenticated,
          isLoading: authData?.isLoading,
          hasUser: !!authData?.user,
          userEmail: authData?.user?.email
        }, null, 2)}
      </Box>
    </Box>
  );
};

export default ContentLibrarySimple;