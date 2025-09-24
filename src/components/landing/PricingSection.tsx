import {
    CheckCircle
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Grid,
    Typography
} from '@mui/material';
import React from 'react';

const pricingPlans = [
  {
    name: 'Starter',
    price: '$29',
    period: '/month',
    description: 'Perfect for individual creators and small teams',
    features: [
      'Up to 100 content pieces/month',
      '3 AI providers',
      '5 platform integrations',
      'Basic analytics',
      'Email support'
    ],
    popular: false,
    cta: 'Start Free Trial'
  },
  {
    name: 'Professional',
    price: '$79',
    period: '/month',
    description: 'Ideal for growing businesses and agencies',
    features: [
      'Up to 500 content pieces/month',
      'All AI providers',
      '15+ platform integrations',
      'Advanced analytics & reporting',
      'Priority support',
      'Team collaboration',
      'Custom templates'
    ],
    popular: true,
    cta: 'Start Free Trial'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with custom needs',
    features: [
      'Unlimited content pieces',
      'All AI providers',
      'All platform integrations',
      'Custom analytics dashboard',
      'Dedicated account manager',
      'Advanced team management',
      'API access',
      'Custom integrations'
    ],
    popular: false,
    cta: 'Contact Sales'
  }
];

export const PricingSection: React.FC = () => {
  return (
    <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" gutterBottom>
            Simple, Transparent Pricing
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Choose the plan that fits your content needs
          </Typography>
        </Box>
        
        <Grid container spacing={4} justifyContent="center">
          {pricingPlans.map((plan, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  position: 'relative',
                  border: plan.popular ? 2 : 1,
                  borderColor: plan.popular ? 'primary.main' : 'divider',
                  '&:hover': { boxShadow: 6 }
                }}
              >
                {plan.popular && (
                  <Chip 
                    label="Most Popular" 
                    color="primary" 
                    sx={{ 
                      position: 'absolute', 
                      top: -12, 
                      left: '50%', 
                      transform: 'translateX(-50%)' 
                    }} 
                  />
                )}
                
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" gutterBottom>
                    {plan.name}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h3" component="span" color="primary">
                      {plan.price}
                    </Typography>
                    <Typography variant="h6" component="span" color="text.secondary">
                      {plan.period}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {plan.description}
                  </Typography>
                  
                  <Box sx={{ mb: 4 }}>
                    {plan.features.map((feature, featureIndex) => (
                      <Box key={featureIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CheckCircle color="success" sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          {feature}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  
                  <Button
                    variant={plan.popular ? 'contained' : 'outlined'}
                    fullWidth
                    size="large"
                    sx={{ py: 1.5 }}
                    href={plan.name === 'Enterprise' ? '/contact' : '/register'}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography variant="body2" color="text.secondary">
            All plans include 14-day free trial • No setup fees • Cancel anytime
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
