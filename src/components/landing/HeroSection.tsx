import {
    ArrowForward,
    PlayArrow
} from '@mui/icons-material';
import {
    Box,
    Button,
    Container,
    Typography
} from '@mui/material';
import React from 'react';

export const HeroSection: React.FC = () => {
  return (
    <Box sx={{ 
      bgcolor: 'primary.main', 
      color: 'white', 
      py: 12,
      backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
        <Typography variant="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          AI-Powered Content Automation
        </Typography>
        
        <Typography variant="h5" sx={{ mb: 4, opacity: 0.9, maxWidth: '600px', mx: 'auto' }}>
          Create, schedule, and publish content across multiple platforms with the power of AI. 
          Transform your content strategy and scale your reach effortlessly.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 6 }}>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            sx={{ 
              bgcolor: 'white', 
              color: 'primary.main',
              px: 4,
              py: 1.5,
              '&:hover': { bgcolor: 'grey.100' }
            }}
            href="/register"
          >
            Start Free Trial
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            startIcon={<PlayArrow />}
            sx={{ 
              borderColor: 'white', 
              color: 'white',
              px: 4,
              py: 1.5,
              '&:hover': { 
                borderColor: 'grey.300', 
                bgcolor: 'rgba(255,255,255,0.1)' 
              }
            }}
            href="/demo"
          >
            Watch Demo
          </Button>
        </Box>
        
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          No credit card required • 14-day free trial • Cancel anytime
        </Typography>
      </Container>
    </Box>
  );
};
