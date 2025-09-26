import React from 'react'
import { Box } from '@mui/material'
import ContentCreator from '../../components/content/ContentCreator'
import PageHeader from '../../components/common/PageHeader'

const ContentCreatorPage: React.FC = () => {
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Content', href: '/content' },
    { label: 'Create' }
  ]

  return (
    <Box sx={{ 
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }}>
      <PageHeader
        title="AI Content Creator"
        subtitle="Generate high-quality content using advanced AI models"
        breadcrumbs={breadcrumbs}
        centered
      />
      <ContentCreator />
    </Box>
  )
}

export default ContentCreatorPage