import React from 'react'
import { Box, Container, useTheme, useMediaQuery } from '@mui/material'

interface ResponsiveContainerProps {
  children: React.ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
  disableGutters?: boolean
  centerContent?: boolean
  fullHeight?: boolean
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'xl',
  disableGutters = false,
  centerContent = false,
  fullHeight = false
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Container
      maxWidth={maxWidth}
      disableGutters={disableGutters}
      sx={{
        px: {
          xs: disableGutters ? 0 : 2,
          sm: disableGutters ? 0 : 3,
          md: disableGutters ? 0 : 4,
        },
        py: {
          xs: 2,
          sm: 3,
          md: 4,
        },
        height: fullHeight ? '100%' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: centerContent ? 'center' : 'stretch',
        justifyContent: centerContent ? 'center' : 'flex-start',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: {
            xs: 2,
            sm: 3,
            md: 4,
          },
          alignItems: centerContent ? 'center' : 'stretch',
        }}
      >
        {children}
      </Box>
    </Container>
  )
}

export default ResponsiveContainer