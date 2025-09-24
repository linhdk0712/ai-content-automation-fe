import React from 'react'
import { Container, Typography } from '@mui/material'

const Pricing: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Pricing Plans
      </Typography>
      <Typography variant="body1">
        Pricing plans will be implemented here.
      </Typography>
    </Container>
  )
}

export default Pricing