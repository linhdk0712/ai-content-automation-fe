import { Box, Container } from '@mui/material';
import React from 'react';
import SchedulingSuite from '../../components/scheduling/SchedulingSuite';

const Scheduling: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <SchedulingSuite />
      </Box>
    </Container>
  );
};

export default Scheduling;