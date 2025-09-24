import React from 'react';
import { Box, Container } from '@mui/material';
import ScheduleManager from '../../components/scheduling/ScheduleManager';

const Scheduling: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <ScheduleManager />
      </Box>
    </Container>
  );
};

export default Scheduling;