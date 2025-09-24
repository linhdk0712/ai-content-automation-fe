import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Paper,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Upgrade as UpgradeIcon,
  Cancel as CancelIcon,
  CreditCard as CreditCardIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon} from '@mui/icons-material';

interface SubscriptionInfo {
  id: string;
  planType: 'BASIC' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED';
  monthlyPrice: number;
  currency: string;
  startsAt: string;
  expiresAt: string;
  autoRenew: boolean;
  nextBillingDate: string;
  paymentMethod: string;
  paymentProvider: string;
  
  // Usage limits
  aiGenerationsLimit: number;
  aiGenerationsUsed: number;
  videoMinutesLimit: number;
  videoMinutesUsed: number;
  storageLimitGb: number;
  storageUsedGb: number;
  apiCallsLimit: number;
  apiCallsUsed: number;
  
  // Billing info
  billingAddress?: string;
  taxRate?: number;
  discountPercentage?: number;
  promoCode?: string;
}

interface SubscriptionManagerProps {
  subscription: SubscriptionInfo;
  onUpgrade: (planType: string) => void;
  onDowngrade: (planType: string) => void;
  onCancel: (reason: string, immediate: boolean) => void;
  onUpdatePaymentMethod: () => void;
  onUpdateBillingInfo: (billingInfo: any) => void;
  onToggleAutoRenew: (autoRenew: boolean) => void;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  subscription,
  onUpgrade,
  onDowngrade,
  onCancel,
  onUpdatePaymentMethod,
  onUpdateBillingInfo,
  onToggleAutoRenew
}) => {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelImmediate, setCancelImmediate] = useState(false);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [billingAddress, setBillingAddress] = useState(subscription.billingAddress || '');

  const formatAmount = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString));
  };

  const getPlanDisplayName = (planType: string): string => {
    switch (planType) {
      case 'BASIC':
        return 'Gói Cơ Bản';
      case 'PRO':
        return 'Gói Chuyên Nghiệp';
      case 'ENTERPRISE':
        return 'Gói Doanh Nghiệp';
      default:
        return planType;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'CANCELLED':
        return 'warning';
      case 'EXPIRED':
      case 'SUSPENDED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'ACTIVE':
        return 'Đang hoạt động';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'EXPIRED':
        return 'Hết hạn';
      case 'SUSPENDED':
        return 'Tạm ngưng';
      default:
        return status;
    }
  };

  const calculateUsagePercentage = (used: number, limit: number): number => {
    return limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  };

  const getUsageColor = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage < 70) return 'success';
    if (percentage < 90) return 'warning';
    return 'error';
  };

  const handleCancelSubscription = () => {
    if (cancelReason.trim()) {
      onCancel(cancelReason, cancelImmediate);
      setCancelDialogOpen(false);
      setCancelReason('');
      setCancelImmediate(false);
    }
  };

  const handleUpdateBillingInfo = () => {
    onUpdateBillingInfo({ billingAddress });
    setBillingDialogOpen(false);
  };

  const canUpgrade = subscription.planType !== 'ENTERPRISE' && subscription.status === 'ACTIVE';
  const canDowngrade = subscription.planType !== 'BASIC' && subscription.status === 'ACTIVE';

  return (
    <Box>
      {/* Subscription Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {getPlanDisplayName(subscription.planType)}
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Chip
                  label={getStatusLabel(subscription.status)}
                  color={getStatusColor(subscription.status) as any}
                  size="small"
                />
                <Typography variant="h6" color="primary">
                  {formatAmount(subscription.monthlyPrice, subscription.currency)}/tháng
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Gia hạn vào: {formatDate(subscription.nextBillingDate)}
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              {canUpgrade && (
                <Button
                  variant="contained"
                  startIcon={<UpgradeIcon />}
                  onClick={() => {
                    const nextPlan = subscription.planType === 'BASIC' ? 'PRO' : 'ENTERPRISE';
                    onUpgrade(nextPlan);
                  }}
                  size="small"
                >
                  Nâng cấp
                </Button>
              )}
              <IconButton onClick={() => setBillingDialogOpen(true)} size="small">
                <SettingsIcon />
              </IconButton>
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Thông tin thanh toán
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CreditCardIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Phương thức thanh toán"
                      secondary={subscription.paymentProvider === 'VNPAY' ? 'VNPay' : 'MoMo'}
                    />
                    <Button size="small" onClick={onUpdatePaymentMethod}>
                      Thay đổi
                    </Button>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <ReceiptIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Tự động gia hạn"
                      secondary={subscription.autoRenew ? 'Bật' : 'Tắt'}
                    />
                    <Switch
                      checked={subscription.autoRenew}
                      onChange={(e) => onToggleAutoRenew(e.target.checked)}
                      size="small"
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Thời gian sử dụng
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Ngày bắt đầu"
                      secondary={formatDate(subscription.startsAt)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Ngày hết hạn"
                      secondary={formatDate(subscription.expiresAt)}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Thống Kê Sử Dụng
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Tạo nội dung AI
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">
                    {subscription.aiGenerationsUsed} / {subscription.aiGenerationsLimit}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {calculateUsagePercentage(subscription.aiGenerationsUsed, subscription.aiGenerationsLimit).toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={calculateUsagePercentage(subscription.aiGenerationsUsed, subscription.aiGenerationsLimit)}
                  color={getUsageColor(calculateUsagePercentage(subscription.aiGenerationsUsed, subscription.aiGenerationsLimit))}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Video AI (phút)
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">
                    {subscription.videoMinutesUsed} / {subscription.videoMinutesLimit}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {calculateUsagePercentage(subscription.videoMinutesUsed, subscription.videoMinutesLimit).toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={calculateUsagePercentage(subscription.videoMinutesUsed, subscription.videoMinutesLimit)}
                  color={getUsageColor(calculateUsagePercentage(subscription.videoMinutesUsed, subscription.videoMinutesLimit))}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Lưu trữ (GB)
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">
                    {subscription.storageUsedGb} / {subscription.storageLimitGb}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {calculateUsagePercentage(subscription.storageUsedGb, subscription.storageLimitGb).toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={calculateUsagePercentage(subscription.storageUsedGb, subscription.storageLimitGb)}
                  color={getUsageColor(calculateUsagePercentage(subscription.storageUsedGb, subscription.storageLimitGb))}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  API Calls
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">
                    {subscription.apiCallsUsed} / {subscription.apiCallsLimit}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {calculateUsagePercentage(subscription.apiCallsUsed, subscription.apiCallsLimit).toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={calculateUsagePercentage(subscription.apiCallsUsed, subscription.apiCallsLimit)}
                  color={getUsageColor(calculateUsagePercentage(subscription.apiCallsUsed, subscription.apiCallsLimit))}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            </Grid>
          </Grid>

          {/* Usage Warnings */}
          <Box mt={2}>
            {subscription.aiGenerationsUsed / subscription.aiGenerationsLimit > 0.8 && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  Bạn đã sử dụng hơn 80% quota tạo nội dung AI. Hãy cân nhắc nâng cấp gói để tránh gián đoạn.
                </Typography>
              </Alert>
            )}
            {subscription.storageUsedGb / subscription.storageLimitGb > 0.9 && (
              <Alert severity="error" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  Dung lượng lưu trữ sắp đầy. Vui lòng xóa các file không cần thiết hoặc nâng cấp gói.
                </Typography>
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Plan Management */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Quản Lý Gói
          </Typography>
          
          <Grid container spacing={2}>
            {canUpgrade && (
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<UpgradeIcon />}
                  onClick={() => {
                    const nextPlan = subscription.planType === 'BASIC' ? 'PRO' : 'ENTERPRISE';
                    onUpgrade(nextPlan);
                  }}
                >
                  Nâng cấp gói
                </Button>
              </Grid>
            )}
            
            {canDowngrade && (
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<WarningIcon />}
                  onClick={() => {
                    const prevPlan = subscription.planType === 'ENTERPRISE' ? 'PRO' : 'BASIC';
                    onDowngrade(prevPlan);
                  }}
                >
                  Hạ cấp gói
                </Button>
              </Grid>
            )}
            
            {subscription.status === 'ACTIVE' && (
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  startIcon={<CancelIcon />}
                  onClick={() => setCancelDialogOpen(true)}
                >
                  Hủy gói
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Hủy Gói Đăng Ký</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Bạn có chắc chắn muốn hủy gói đăng ký? Hành động này không thể hoàn tác.
          </Alert>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Lý do hủy (bắt buộc)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={cancelImmediate}
                onChange={(e) => setCancelImmediate(e.target.checked)}
              />
            }
            label="Hủy ngay lập tức (không chờ đến cuối chu kỳ thanh toán)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            Hủy bỏ
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelSubscription}
            disabled={!cancelReason.trim()}
          >
            Xác nhận hủy
          </Button>
        </DialogActions>
      </Dialog>

      {/* Billing Info Dialog */}
      <Dialog open={billingDialogOpen} onClose={() => setBillingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cập Nhật Thông Tin Thanh Toán</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Địa chỉ thanh toán"
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBillingDialogOpen(false)}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleUpdateBillingInfo}>
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionManager;