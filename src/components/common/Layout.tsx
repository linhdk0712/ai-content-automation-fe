import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Toolbar, useTheme, useMediaQuery } from '@mui/material'
import Header from './Header'
import Sidebar from './Sidebar'

const Layout: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'))
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isTablet)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen)
    } else {
      setSidebarCollapsed(!sidebarCollapsed)
    }
  }

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    // Here you would typically update your theme context
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      width: '100vw',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Fixed Header - spans full width */}
      <Header 
        onToggleSidebar={handleToggleSidebar}
        onToggleTheme={handleToggleTheme}
        isDarkMode={isDarkMode}
      />
      
      {/* Sidebar - positioned absolutely on desktop, drawer on mobile */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      
      {/* Main Content Area - Full width, content centered within */}
      <Box
        component="main"
        sx={{
          width: '100vw',
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Header spacer */}
        <Toolbar />
        
        {/* Content wrapper - this is where we center everything */}
        <Box 
          sx={{ 
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            width: '100%',
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto',
            py: { xs: 2, sm: 3, md: 4 },
            px: { xs: 2, sm: 3, md: 4 },
          }}
        >
          {/* Centered content container */}
          <Box sx={{ 
            width: '100%', 
            maxWidth: '1400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
          }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Layout