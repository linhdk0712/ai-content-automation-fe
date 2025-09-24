import {
  AutoAwesome as AIIcon,
  Analytics as AnalyticsIcon,
  Schedule as ScheduleIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Rating,
  Typography,
} from '@mui/material';
import { SEOHead } from '../../components/common/SEOHead';
import { HeroSection } from '../../components/landing/HeroSection';
import { PricingSection } from '../../components/landing/PricingSection';

const features = [
  {
    icon: <AIIcon />,
    title: 'AI-Powered Content Generation',
    description: 'Generate high-quality content using multiple AI providers including GPT-4, Claude, and Gemini with intelligent cost optimization.',
    benefits: ['Multi-AI provider support', 'Cost optimization', 'Quality scoring', 'Industry-specific templates']
  },
  {
    icon: <ScheduleIcon />,
    title: 'Smart Scheduling',
    description: 'Schedule your content across multiple platforms with AI-powered optimal timing suggestions and automated publishing.',
    benefits: ['Cross-platform scheduling', 'Optimal timing AI', 'Bulk operations', 'Timezone support']
  },
  {
    icon: <ShareIcon />,
    title: 'Multi-Platform Publishing',
    description: 'Publish to Facebook, Instagram, TikTok, YouTube, and more with platform-specific formatting and optimization.',
    benefits: ['10+ platform support', 'Auto-formatting', 'Engagement optimization', 'Real-time publishing']
  },
  {
    icon: <AnalyticsIcon />,
    title: 'Advanced Analytics',
    description: 'Track performance across all platforms with detailed analytics, ROI calculation, and actionable insights.',
    benefits: ['Cross-platform analytics', 'ROI tracking', 'Performance insights', 'Custom reports']
  }
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Marketing Director',
    company: 'TechStart Inc.',
    avatar: '/avatars/sarah.jpg',
    rating: 5,
    text: 'This platform has revolutionized our content marketing. We\'ve increased our social media engagement by 300% while reducing time spent on content creation by 70%.'
  },
  {
    name: 'Michael Chen',
    role: 'Content Creator',
    company: 'Digital Agency Pro',
    avatar: '/avatars/michael.jpg',
    rating: 5,
    text: 'The AI-powered content generation is incredible. I can create weeks of content in just a few hours, and the quality is consistently high across all platforms.'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Social Media Manager',
    company: 'E-commerce Plus',
    avatar: '/avatars/emily.jpg',
    rating: 5,
    text: 'The scheduling and analytics features are game-changers. I can manage 15+ social accounts efficiently and the ROI tracking helps prove the value of our campaigns.'
  }
];

const stats = [
  { number: '10,000+', label: 'Content Pieces Generated' },
  { number: '500+', label: 'Happy Customers' },
  { number: '15+', label: 'Platform Integrations' },
  { number: '99.9%', label: 'Uptime Guarantee' }
];

export const LandingPage: React.FC = () => {
  
  return (
    <>
      <SEOHead
        title="AI Content Automation - Create, Schedule & Publish Content Automatically"
        description="Automate your content creation and social media publishing with AI. Generate high-quality content, schedule posts, and track performance across all platforms."
        keywords="AI content creation, social media automation, content scheduling, multi-platform publishing, content marketing"
        ogImage="/images/og-landing.jpg"
      />
      
      <Box>
        {/* Hero Section */}
        <HeroSection />
        
        {/* Stats Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Grid container spacing={4} justifyContent="center">
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Box textAlign="center">
                  <Typography variant="h3" color="primary" fontWeight="bold">
                    {stat.number}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
        
        {/* Features Section */}
        <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
          <Container maxWidth="lg">
            <Typography variant="h2" textAlign="center" gutterBottom>
              Everything You Need for Content Success
            </Typography>
            <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
              Powerful features designed to streamline your content workflow
            </Typography>
            
            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card sx={{ height: '100%', p: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          {feature.icon}
                        </Avatar>
                        <Typography variant="h5">{feature.title}</Typography>
                      </Box>
                      
                      <Typography variant="body1" paragraph>
                        {feature.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {feature.benefits.map((benefit, benefitIndex) => (
                          <Chip
                            key={benefitIndex}
                            label={benefit}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
        
        {/* Testimonials Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h2" textAlign="center" gutterBottom>
            Loved by Content Creators Worldwide
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            See what our customers are saying about their success
          </Typography>
          
          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ height: '100%', p: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar src={testimonial.avatar} sx={{ mr: 2 }}>
                        {testimonial.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {testimonial.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {testimonial.role} at {testimonial.company}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Rating value={testimonial.rating} readOnly sx={{ mb: 2 }} />
                    
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      "{testimonial.text}"
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
        
        {/* Pricing Section */}
        <PricingSection />
        
        {/* Final CTA Section */}
        <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8 }}>
          <Container maxWidth="md" sx={{ textAlign: 'center' }}>
            <Typography variant="h2" gutterBottom>
              Ready to Transform Your Content Strategy?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Join thousands of content creators who have already automated their success
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'grey.100' }
                }}
                href="/register"
              >
                Start Free Trial
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{ 
                  borderColor: 'white', 
                  color: 'white',
                  '&:hover': { borderColor: 'grey.300', bgcolor: 'rgba(255,255,255,0.1)' }
                }}
                href="/demo"
              >
                Watch Demo
              </Button>
            </Box>
            
            <Typography variant="body2" sx={{ mt: 3, opacity: 0.8 }}>
              No credit card required • 14-day free trial • Cancel anytime
            </Typography>
          </Container>
        </Box>
      </Box>
    </>
  );
};