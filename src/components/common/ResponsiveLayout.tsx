import React from 'react'
import {
  Box,
  Container,
  Grid,
  useTheme,
  useMediaQuery,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Fab,
  Zoom,
  Hidden
} from '@mui/material'
import {
  Menu as MenuIcon,
  KeyboardArrowUp,
  Close
} from '@mui/icons-material'
import { styled } from '@mui/material/styles'

// Responsive breakpoints
const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536
}

// Styled components for responsive behavior
const ResponsiveContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3)
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(4)
  }
}))

const MobileDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 280,
    [theme.breakpoints.down('sm')]: {
      width: '100vw'
    }
  }
}))

const ResponsiveAppBar = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  })
}))

const MainContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'sidebarOpen' && prop !== 'sidebarWidth'
})<{ sidebarOpen?: boolean; sidebarWidth?: number }>(({ theme, sidebarOpen, sidebarWidth = 280 }) => ({
  flexGrow: 1,
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  marginLeft: 0,
  [theme.breakpoints.up('md')]: {
    marginLeft: sidebarOpen ? sidebarWidth : 0
  }
}))

// Responsive grid system
interface ResponsiveGridProps {
  children: React.ReactNode
  spacing?: number
  xs?: number | 'auto'
  sm?: number | 'auto'
  md?: number | 'auto'
  lg?: number | 'auto'
  xl?: number | 'auto'
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  spacing = 3,
  xs = 12,
  sm,
  md,
  lg,
  xl
}) => {
  return (
    <Grid container spacing={spacing}>
      <Grid item xs={xs} sm={sm || xs} md={md || sm || xs} lg={lg || md || sm || xs} xl={xl || lg || md || sm || xs}>
        {children}
      </Grid>
    </Grid>
  )
}

// Mobile-first responsive layout
interface ResponsiveLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  sidebarWidth?: number
  showBackToTop?: boolean
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  sidebar,
  header,
  footer,
  sidebarWidth = 280,
  showBackToTop = true,
  maxWidth = 'lg'
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [showBackToTopButton, setShowBackToTopButton] = React.useState(false)

  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  // Back to top functionality
  React.useEffect(() => {
    const handleScroll = () => {
      setShowBackToTopButton(window.scrollY > 300)
    }

    if (showBackToTop) {
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [showBackToTop])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Header */}
      {header && (
        <ResponsiveAppBar position="fixed">
          <Toolbar>
            {sidebar && isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            {header}
          </Toolbar>
        </ResponsiveAppBar>
      )}

      {/* Sidebar */}
      {sidebar && (
        <>
          {/* Mobile drawer */}
          <MobileDrawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true // Better open performance on mobile
            }}
            sx={{
              display: { xs: 'block', md: 'none' }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
              <IconButton onClick={handleDrawerToggle} aria-label="close drawer">
                <Close />
              </IconButton>
            </Box>
            {sidebar}
          </MobileDrawer>

          {/* Desktop drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: sidebarWidth,
                top: header ? 64 : 0,
                height: header ? 'calc(100vh - 64px)' : '100vh'
              }
            }}
            open
          >
            {sidebar}
          </Drawer>
        </>
      )}

      {/* Main content */}
      <MainContent
        component="main"
        sidebarOpen={!isMobile && !!sidebar}
        sidebarWidth={sidebarWidth}
        sx={{
          pt: header ? 8 : 0,
          pb: footer ? 8 : 0
        }}
      >
        <ResponsiveContainer maxWidth={maxWidth}>
          {children}
        </ResponsiveContainer>
      </MainContent>

      {/* Footer */}
      {footer && (
        <Box
          component="footer"
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
            backgroundColor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider'
          }}
        >
          {footer}
        </Box>
      )}

      {/* Back to top button */}
      {showBackToTop && (
        <Zoom in={showBackToTopButton}>
          <Fab
            color="primary"
            size="small"
            aria-label="scroll back to top"
            onClick={scrollToTop}
            sx={{
              position: 'fixed',
              bottom: theme.spacing(2),
              right: theme.spacing(2),
              zIndex: theme.zIndex.fab
            }}
          >
            <KeyboardArrowUp />
          </Fab>
        </Zoom>
      )}
    </Box>
  )
}

// Responsive card component
interface ResponsiveCardProps {
  children: React.ReactNode
  elevation?: number
  padding?: number | string
  margin?: number | string
  fullWidth?: boolean
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  elevation = 1,
  padding = 2,
  margin = 0,
  fullWidth = true
}) => {
  const theme = useTheme()
  
  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
        borderRadius: 1,
        boxShadow: theme.shadows[elevation],
        p: padding,
        m: margin,
        width: fullWidth ? '100%' : 'auto',
        [theme.breakpoints.down('sm')]: {
          borderRadius: 0,
          boxShadow: 'none',
          borderBottom: 1,
          borderColor: 'divider'
        }
      }}
    >
      {children}
    </Box>
  )
}

// Responsive text component
interface ResponsiveTextProps {
  children: React.ReactNode
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption'
  mobileVariant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption'
  align?: 'left' | 'center' | 'right'
  color?: string
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  variant = 'body1',
  mobileVariant,
  align = 'left',
  color = 'text.primary'
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const actualVariant = isMobile && mobileVariant ? mobileVariant : variant
  
  return (
    <Typography
      variant={actualVariant}
      align={align}
      color={color}
      sx={{
        [theme.breakpoints.down('sm')]: {
          fontSize: theme.typography[actualVariant].fontSize
        }
      }}
    >
      {children}
    </Typography>
  )
}

// Responsive spacing utility
export const useResponsiveSpacing = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  
  return {
    spacing: (mobile: number, tablet?: number, desktop?: number) => {
      if (isMobile) return theme.spacing(mobile)
      if (isTablet && tablet) return theme.spacing(tablet)
      return theme.spacing(desktop || tablet || mobile)
    },
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet
  }
}

// Responsive visibility component
interface ResponsiveVisibilityProps {
  children: React.ReactNode
  hideOn?: ('xs' | 'sm' | 'md' | 'lg' | 'xl')[]
  showOn?: ('xs' | 'sm' | 'md' | 'lg' | 'xl')[]
}

export const ResponsiveVisibility: React.FC<ResponsiveVisibilityProps> = ({
  children,
  hideOn,
  showOn
}) => {
  if (hideOn) {
    return (
      <Hidden only={hideOn}>
        {children}
      </Hidden>
    )
  }
  
  if (showOn) {
    const allBreakpoints = ['xs', 'sm', 'md', 'lg', 'xl'] as const
    const hiddenBreakpoints = allBreakpoints.filter((bp) => !showOn.includes(bp))
    return (
      <Hidden only={hiddenBreakpoints}>
        {children}
      </Hidden>
    )
  }
  
  return <>{children}</>
}

// Touch-friendly component wrapper
interface TouchFriendlyProps {
  children: React.ReactNode
  minTouchTarget?: number
  hapticFeedback?: boolean
}

export const TouchFriendly: React.FC<TouchFriendlyProps> = ({
  children,
  minTouchTarget = 44,
  hapticFeedback = false
}) => {
  const handleTouch = () => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10) // Short haptic feedback
    }
  }

  return (
    <Box
      sx={{
        minWidth: minTouchTarget,
        minHeight: minTouchTarget,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        '&:active': {
          transform: 'scale(0.98)',
          transition: 'transform 0.1s ease'
        }
      }}
      onTouchStart={handleTouch}
    >
      {children}
    </Box>
  )
}

export default ResponsiveLayout