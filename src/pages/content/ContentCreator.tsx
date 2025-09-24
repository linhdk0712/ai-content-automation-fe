import { Box, Container, Typography } from '@mui/material'
import React from 'react'
import ContentCreator from '../../components/content/ContentCreator'

const ContentCreatorPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          AI Content Creator
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Generate high-quality content using advanced AI models
        </Typography>
        <ContentCreator />
      </Box>
    </Container>
  )
}

export default ContentCreatorPage