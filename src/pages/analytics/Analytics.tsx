import { Box, Container, Typography } from '@mui/material'
import React from 'react'
import { PerformanceDashboard } from '../../components/analytics/PerformanceDashboard'
import { useAuth } from '../../hooks/useAuth'

const Analytics: React.FC = () => {
  const { user } = useAuth()

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Track your content performance and engagement metrics
        </Typography>
        {user?.id && (
          <PerformanceDashboard userId={user.id} />
        )}
      </Box>
    </Container>
  )
}

export default Analytics