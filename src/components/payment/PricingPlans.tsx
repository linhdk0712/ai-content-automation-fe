import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Container,
  Paper,
  Divider
} from '@mui/material';
import {
  Check as CheckIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon
} from '@mui/icons-material';

interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  originalPrice?: number;
  currency: string;
  period: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
  buttonText: string;
  buttonVariant: 'contained' | 'outlined';
}

interface PricingPlansProps {
  onPlanSelect: (planId: string, isAnnual: boolean) => void;
  currentPlan?: string;
  loading?: boolean;
}

const PricingPlans: React.FC<PricingPlansProps> = ({
  onPlanSelect,
  currentPlan,
  loading = false
}) => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [plans, setPlans] = useState<PricingPlan[]>([]);

  useEffect(() => {
    // Initialize pricing plans
    const basePlans: PricingPlan[] = [
      {
        id: 'BASIC',
        name: 'Basic',
        displayName: 'Gói Cơ Bản',
        price: isAnnual ? 159000 : 199000,
        originalPrice: isAnnual ? 199000 : undefined,
        currency: 'VND',
        period: isAnnual ? '/năm' : '/tháng',
        description: 'Hoàn hảo cho cá nhân và freelancer',
        features: [
          { name: '100 lần tạo nội dung AI', included: true, limit: '100/tháng' },
          { name: '10 phút video AI', included: true, limit: '10 phút/tháng' },
          { name: '5GB lưu trữ', included: true, limit: '5GB' },
          { name: '1,000 API calls', included: true, limit: '1,000/tháng' },
          { name: 'Template cơ bản', included: true },
          { name: 'Hỗ trợ email', included: true },
          { name: 'Đăng lên 2 nền tảng', included: true },
          { name: 'Analytics cơ bản', included: true },
          { name: 'Team collaboration', included: false },
          { name: 'Priority support', included: false }
        ],
        icon: <StarIcon />,
        color: '#2196F3',
        buttonText: currentPlan === 'BASIC' ? 'Gói hiện tại' : 'Chọn gói Basic',
        buttonVariant: 'outlined'
      },
      {
        id: 'PRO',
        name: 'Pro',
        displayName: 'Gói Chuyên Nghiệp',
        price: isAnnual ? 399000 : 499000,
        originalPrice: isAnnual ? 499000 : undefined,
        currency: 'VND',
        period: isAnnual ? '/năm' : '/tháng',
        description: 'Tốt nhất cho doanh nghiệp nhỏ và content creator',
        features: [
          { name: '500 lần tạo nội dung AI', included: true, limit: '500/tháng' },
          { name: '60 phút video AI', included: true, limit: '60 phút/tháng' },
          { name: '50GB lưu trữ', included: true, limit: '50GB' },
          { name: '5,000 API calls', included: true, limit: '5,000/tháng' },
          { name: 'Tất cả template premium', included: true },
          { name: 'Hỗ trợ ưu tiên', included: true },
          { name: 'Đăng lên 5 nền tảng', included: true },
          { name: 'Analytics nâng cao', included: true },
          { name: 'Team collaboration (5 thành viên)', included: true },
          { name: 'A/B Testing', included: true }
        ],
        popular: true,
        icon: <TrendingUpIcon />,
        color: '#FF9800',
        buttonText: currentPlan === 'PRO' ? 'Gói hiện tại' : 'Chọn gói Pro',
        buttonVariant: 'contained'
      },
      {
        id: 'ENTERPRISE',
        name: 'Enterprise',
        displayName: 'Gói Doanh Nghiệp',
        price: isAnnual ? 799000 : 999000,
        originalPrice: isAnnual ? 999000 : undefined,
        currency: 'VND',
        period: isAnnual ? '/năm' : '/tháng',
        description: 'Giải pháp toàn diện cho doanh nghiệp lớn',
        features: [
          { name: '2,000 lần tạo nội dung AI', included: true, limit: '2,000/tháng' },
          { name: '300 phút video AI', included: true, limit: '300 phút/tháng' },
          { name: '500GB lưu trữ', included: true, limit: '500GB' },
          { name: '20,000 API calls', included: true, limit: '20,000/tháng' },
          { name: 'Custom templates', included: true },
          { name: 'Dedicated support', included: true },
          { name: 'Đăng lên không giới hạn nền tảng', included: true },
          { name: 'Advanced analytics & reporting', included: true },
          { name: 'Unlimited team members', included: true },
          { name: 'White-label solution', included: true }
        ],
        icon: <BusinessIcon />,
        color: '#9C27B0',
        buttonText: currentPlan === 'ENTERPRISE' ? 'Gói hiện tại' : 'Chọn gói Enterprise',
        buttonVariant: 'outlined'
      }
    ];

    setPlans(basePlans);
  }, [isAnnual, currentPlan]);

  const handlePlanSelect = (planId: string) => {
    if (currentPlan === planId) return;
    onPlanSelect(planId, isAnnual);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Chọn Gói Phù Hợp Với Bạn
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={3}>
          Bắt đầu miễn phí, nâng cấp khi cần thiết. Hủy bất cứ lúc nào.
        </Typography>
        
        <Paper elevation={1} sx={{ display: 'inline-flex', p: 1, borderRadius: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isAnnual}
                onChange={(e) => setIsAnnual(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography>Thanh toán hàng năm</Typography>
                <Chip 
                  label="Tiết kiệm 20%" 
                  size="small" 
                  color="success" 
                  variant="outlined"
                />
              </Box>
            }
          />
        </Paper>
      </Box>

      <Grid container spacing={3} justifyContent="center">
        {plans.map((plan) => (
          <Grid item xs={12} md={4} key={plan.id}>
            <Card
              elevation={plan.popular ? 8 : 2}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: plan.popular ? `2px solid ${plan.color}` : 'none',
                transform: plan.popular ? 'scale(1.05)' : 'none',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: plan.popular ? 'scale(1.05)' : 'scale(1.02)',
                  boxShadow: 6
                }
              }}
            >
              {plan.popular && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: plan.color,
                    color: 'white',
                    px: 3,
                    py: 0.5,
                    borderRadius: 2,
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                  }}
                >
                  PHỔ BIẾN NHẤT
                </Box>
              )}

              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box
                    sx={{
                      bgcolor: `${plan.color}20`,
                      color: plan.color,
                      p: 1,
                      borderRadius: 1,
                      mr: 2
                    }}
                  >
                    {plan.icon}
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {plan.displayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {plan.description}
                    </Typography>
                  </Box>
                </Box>

                <Box mb={3}>
                  <Box display="flex" alignItems="baseline" mb={1}>
                    <Typography variant="h3" fontWeight="bold" color={plan.color}>
                      {formatPrice(plan.price, plan.currency)}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" ml={1}>
                      {plan.period}
                    </Typography>
                  </Box>
                  {plan.originalPrice && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textDecoration: 'line-through' }}
                    >
                      {formatPrice(plan.originalPrice, plan.currency)}{plan.period}
                    </Typography>
                  )}
                </Box>

                <Button
                  variant={plan.buttonVariant}
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={loading || currentPlan === plan.id}
                  sx={{
                    mb: 3,
                    py: 1.5,
                    bgcolor: plan.buttonVariant === 'contained' ? plan.color : 'transparent',
                    borderColor: plan.color,
                    color: plan.buttonVariant === 'contained' ? 'white' : plan.color,
                    '&:hover': {
                      bgcolor: plan.buttonVariant === 'contained' ? plan.color : `${plan.color}10`,
                      borderColor: plan.color
                    }
                  }}
                >
                  {plan.buttonText}
                </Button>

                <Divider sx={{ mb: 2 }} />

                <List dense>
                  {plan.features.map((feature, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon
                          sx={{
                            color: feature.included ? plan.color : 'text.disabled',
                            fontSize: 20
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={feature.name}
                        secondary={feature.limit}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: feature.included ? 'text.primary' : 'text.disabled',
                            fontSize: '0.875rem'
                          },
                          '& .MuiListItemText-secondary': {
                            fontSize: '0.75rem'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box textAlign="center" mt={4}>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Tất cả gói đều bao gồm SSL miễn phí, backup hàng ngày và hỗ trợ 24/7
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Cần tư vấn? <Button variant="text" size="small">Liên hệ với chúng tôi</Button>
        </Typography>
      </Box>
    </Container>
  );
};

export default PricingPlans;