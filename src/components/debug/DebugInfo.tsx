import React from 'react'
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import { ExpandMore } from '@mui/icons-material'

interface DebugInfoProps {
  data: any
  title: string
}

const DebugInfo: React.FC<DebugInfoProps> = ({ data, title }) => {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle2">🐛 Debug: {title}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ 
            bgcolor: 'grey.100', 
            p: 2, 
            borderRadius: 1,
            maxHeight: 300,
            overflow: 'auto'
          }}>
            <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
              {JSON.stringify(data, null, 2)}
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}

export default DebugInfo