import { Box, Fade } from '@mui/material'
import React from 'react'

import { usePageFocus, usePageTransition } from '../../hooks/usePageTransition'
import SEOHead from './SEOHead'

interface PageWrapperProps {
  children: React.ReactNode
  title?: string
  description?: string
  keywords?: string
  noIndex?: boolean
  className?: string
}

const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  title,
  description,
  keywords,
  noIndex = false,
  className,
}) => {
  const { isTransitioning } = usePageTransition()
  
  // Handle page focus for accessibility
  usePageFocus()

  return (
    <>
      <SEOHead
        title={title}
        description={description}
        keywords={keywords}
        noIndex={noIndex}
      />
      
      <Fade in={!isTransitioning} timeout={300}>
        <Box
          component="main"
          id="main-content"
          tabIndex={-1}
          className={className}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
            outline: 'none', // Remove focus outline since this is programmatically focused
          }}
        >
          {children}
        </Box>
      </Fade>
    </>
  )
}

export default PageWrapper