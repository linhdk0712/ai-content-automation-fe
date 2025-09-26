import React from 'react'
import { Box, Typography, Paper } from '@mui/material'

const LayoutDebug: React.FC = () => {
  return (
    <Box sx={{ 
      position: 'fixed',
      top: 80,
      right: 20,
      width: 300,
      zIndex: 9999,
      display: process.env.NODE_ENV === 'development' ? 'block' : 'none'
    }}>
      <Paper sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.8)', color: 'white' }}>
        <Typography variant="h6" gutterBottom>Layout Debug</Typography>
        
        <Typography variant="body2">
          Viewport: {window.innerWidth}x{window.innerHeight}
        </Typography>
        
        <Typography variant="body2">
          Content Width: {document.querySelector('main')?.clientWidth || 'N/A'}px
        </Typography>
        
        <Typography variant="body2">
          Sidebar Width: {document.querySelector('.MuiDrawer-paper')?.clientWidth || 'N/A'}px
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" display="block">
            Breakpoints:
          </Typography>
          <Typography variant="caption" display="block">
            xs: 0-600px
          </Typography>
          <Typography variant="caption" display="block">
            sm: 600-900px  
          </Typography>
          <Typography variant="caption" display="block">
            md: 900-1200px
          </Typography>
          <Typography variant="caption" display="block">
            lg: 1200px+
          </Typography>
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" display="block">
            Current: {
              window.innerWidth < 600 ? 'xs' :
              window.innerWidth < 900 ? 'sm' :
              window.innerWidth < 1200 ? 'md' : 'lg'
            }
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}

export default LayoutDebug