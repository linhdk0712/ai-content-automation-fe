import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import React, { useState } from 'react';
import { authService } from '../../services/auth.service';
import { TokenManager } from '../../services/api';

const AuthDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const checkAuthStatus = () => {
    const accessToken = TokenManager.getAccessToken();
    const refreshToken = TokenManager.getRefreshToken();
    const isAuthenticated = authService.isAuthenticated();

    const info = {
      hasAccessToken: !!accessToken,
      accessTokenPreview: accessToken ? accessToken.substring(0, 50) + '...' : 'null',
      hasRefreshToken: !!refreshToken,
      refreshTokenPreview: refreshToken ? refreshToken.substring(0, 50) + '...' : 'null',
      isAuthenticated,
      isTokenExpired: accessToken ? TokenManager.isTokenExpired(accessToken) : 'no token',
      localStorage: {
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken')
      }
    };

    setDebugInfo(info);
    console.log('Auth Debug Info:', info);
  };

  const testApiCall = async () => {
    try {
      console.log('Testing /auth/me API call...');
      const user = await authService.getCurrentUser();
      console.log('API call successful:', user);
      alert('API call successful! Check console for details.');
    } catch (error) {
      console.error('API call failed:', error);
      alert('API call failed! Check console for details.');
    }
  };

  const clearTokens = () => {
    TokenManager.clearTokens();
    setDebugInfo(null);
    alert('Tokens cleared!');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Authentication Debug
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button variant="contained" onClick={checkAuthStatus} sx={{ mr: 2 }}>
          Check Auth Status
        </Button>
        <Button variant="outlined" onClick={testApiCall} sx={{ mr: 2 }}>
          Test /auth/me API
        </Button>
        <Button variant="outlined" color="error" onClick={clearTokens}>
          Clear Tokens
        </Button>
      </Box>

      {debugInfo && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Debug Information
            </Typography>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AuthDebug;