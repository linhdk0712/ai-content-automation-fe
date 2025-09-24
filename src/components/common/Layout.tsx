import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Toolbar, useTheme, useMediaQuery } from '@mui/material'
import Header from './Header'
import Sidebar from './Sidebar'

const Layout: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
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

  const sidebarWidth = sidebarCollapsed ? 64 : 280

  return (
    <Box sx={{ display: 'flex' }}>
      <Header 
        onToggleSidebar={handleToggleSidebar}
        onToggleTheme={handleToggleTheme}
        isDarkMode={isDarkMode}
      />
      
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
          ml: isMobile ? 0 : `${sidebarWidth}px`,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default Layout