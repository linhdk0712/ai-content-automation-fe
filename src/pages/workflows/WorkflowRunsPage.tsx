import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import WorkflowRunsList from './WorkflowRunsList';
import { useAuth } from '../../hooks/useAuth';

const WorkflowRunsPage: React.FC = () => {
  const { user } = useAuth();
  
  // Get user ID from auth context, fallback to 1 for demo
  const userId = user?.id || 1;

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <WorkflowRunsList userId={userId} />
      </Box>
    </Container>
  );
};

export default WorkflowRunsPage;