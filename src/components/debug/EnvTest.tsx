import React from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';

export const EnvTest: React.FC = () => {
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    NODE_ENV: import.meta.env.NODE_ENV,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD
  };

  const allViteVars = Object.keys(import.meta.env)
    .filter(key => key.startsWith('VITE_'))
    .reduce((acc, key) => {
      acc[key] = import.meta.env[key];
      return acc;
    }, {} as Record<string, any>);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🔧 Environment Variables Debug
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        This component helps debug environment variable loading issues.
      </Alert>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Expected Variables
        </Typography>
        <pre style={{ fontSize: '0.875rem', overflow: 'auto' }}>
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          All VITE_ Variables
        </Typography>
        <pre style={{ fontSize: '0.875rem', overflow: 'auto' }}>
          {JSON.stringify(allViteVars, null, 2)}
        </pre>
      </Paper>

      <Alert 
        severity={envVars.VITE_SUPABASE_URL && envVars.VITE_SUPABASE_ANON_KEY ? 'success' : 'error'} 
        sx={{ mt: 3 }}
      >
        {envVars.VITE_SUPABASE_URL && envVars.VITE_SUPABASE_ANON_KEY 
          ? '✅ Supabase environment variables are loaded correctly!'
          : '❌ Missing Supabase environment variables. Check your .env file and restart the dev server.'
        }
      </Alert>
    </Box>
  );
};