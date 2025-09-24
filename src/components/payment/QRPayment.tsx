import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Grid,
  Paper,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  Timer as TimerIcon
} from '@mui/icons-material';

interface PaymentInfo {
  id: string;
  amount: number;
  currency: string;
  description: string;
  qrCodeData: string;
  paymentUrl: string;
  expiresAt: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  provider: string;
  providerTransactionId: string;
}

interface QRPaymentProps {
  paymentInfo: PaymentInfo;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentFailed: (paymentId: string, reason: string) => void;
  onPaymentExpired: (paymentId: string) => void;
  onClose?: () => void;
  autoRefresh?: boolean;
}

const QRPayment: React.FC<QRPaymentProps> = ({
  paymentInfo,
  onPaymentSuccess,
  onPaymentFailed,
  onPaymentExpired,
  onClose,
  autoRefresh = true
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [progress, setProgress] = useState<number>(100);
  const [copied, setCopied] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Calculate initial time left
    const expiryTime = new Date(paymentInfo.expiresAt).getTime();
    const now = new Date().getTime();
    const initialTimeLeft = Math.max(0, Math.floor((expiryTime - now) / 1000));
    
    setTimeLeft(initialTimeLeft);
    setProgress((initialTimeLeft / (15 * 60)) * 100); // Assuming 15 minutes total

    // Start countdown timer
    if (initialTimeLeft > 0 && paymentInfo.status === 'PENDING') {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          setProgress((newTime / (15 * 60)) * 100);
          
          if (newTime <= 0) {
            onPaymentExpired(paymentInfo.id);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    // Start status checking if auto refresh is enabled
    if (autoRefresh && paymentInfo.status === 'PENDING') {
      statusCheckRef.current = setInterval(() => {
        checkPaymentStatus();
      }, 5000); // Check every 5 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (statusCheckRef.current) {
        clearInterval(statusCheckRef.current);
      }
    };
  }, [paymentInfo, autoRefresh]);

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/v1/payments/${paymentInfo.id}/status`);
      const data = await response.json();
      
      if (data.status === 'COMPLETED') {
        onPaymentSuccess(paymentInfo.id);
        if (statusCheckRef.current) {
          clearInterval(statusCheckRef.current);
        }
      } else if (data.status === 'FAILED') {
        onPaymentFailed(paymentInfo.id, data.failureReason || 'Payment failed');
        if (statusCheckRef.current) {
          clearInterval(statusCheckRef.current);
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const handleCopyQRData = async () => {
    try {
      await navigator.clipboard.writeText(paymentInfo.qrCodeData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy QR data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await checkPaymentStatus();
    } finally {
      setRefreshing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatAmount = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
      case 'EXPIRED':
        return 'error';
      case 'PROCESSING':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon />;
      case 'FAILED':
      case 'EXPIRED':
        return <ErrorIcon />;
      case 'PROCESSING':
        return <CircularProgress size={20} />;
      default:
        return <QrCodeIcon />;
    }
  };

  const renderQRCode = () => {
    // In a real implementation, you would use a QR code library like qrcode.js
    // For now, we'll show a placeholder
    return (
      <Box
        sx={{
          width: 200,
          height: 200,
          bgcolor: 'white',
          border: '1px solid #ddd',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 1
        }}
      >
        <QrCodeIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary" textAlign="center">
          QR Code
          <br />
          {paymentInfo.provider}
        </Typography>
      </Box>
    );
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Thanh Toán QR Code</Typography>
          {onClose && (
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ p: 2 }}>
          {/* Payment Status */}
          <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
            <Chip
              icon={getStatusIcon(paymentInfo.status)}
              label={paymentInfo.status === 'PENDING' ? 'Chờ thanh toán' : 
                     paymentInfo.status === 'PROCESSING' ? 'Đang xử lý' :
                     paymentInfo.status === 'COMPLETED' ? 'Thành công' :
                     paymentInfo.status === 'FAILED' ? 'Thất bại' : 'Hết hạn'}
              color={getStatusColor(paymentInfo.status) as any}
              size="medium"
              sx={{ px: 2, py: 1 }}
            />
          </Box>

          {/* Timer and Progress */}
          {paymentInfo.status === 'PENDING' && timeLeft > 0 && (
            <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <TimerIcon fontSize="small" />
                  <Typography variant="body2" fontWeight="bold">
                    Thời gian còn lại: {formatTime(timeLeft)}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{ color: 'inherit' }}
                >
                  {refreshing ? 'Đang kiểm tra...' : 'Kiểm tra'}
                </Button>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: progress > 20 ? 'success.main' : 'error.main'
                  }
                }}
              />
            </Paper>
          )}

          {/* Payment Information */}
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Số tiền
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {formatAmount(paymentInfo.amount, paymentInfo.currency)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Phương thức
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {paymentInfo.provider === 'VNPAY' ? 'VNPay' : 
                     paymentInfo.provider === 'MOMO' ? 'MoMo' : paymentInfo.provider}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Mô tả
                  </Typography>
                  <Typography variant="body1">
                    {paymentInfo.description}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Mã giao dịch
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" fontFamily="monospace">
                      {paymentInfo.providerTransactionId}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => navigator.clipboard.writeText(paymentInfo.providerTransactionId)}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* QR Code Section */}
          {paymentInfo.status === 'PENDING' && (
            <Box textAlign="center">
              <Typography variant="h6" mb={2}>
                Quét mã QR để thanh toán
              </Typography>
              
              <Box display="flex" justifyContent="center" mb={2}>
                {renderQRCode()}
              </Box>

              <Box display="flex" gap={2} justifyContent="center" mb={2}>
                <Button
                  variant="outlined"
                  startIcon={<CopyIcon />}
                  onClick={handleCopyQRData}
                  size="small"
                >
                  {copied ? 'Đã sao chép!' : 'Sao chép mã QR'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.open(paymentInfo.paymentUrl, '_blank')}
                  size="small"
                >
                  Mở ứng dụng thanh toán
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Alert severity="info" sx={{ textAlign: 'left' }}>
                <Typography variant="body2" mb={1}>
                  <strong>Hướng dẫn thanh toán:</strong>
                </Typography>
                <Typography variant="body2" component="div">
                  1. Mở ứng dụng {paymentInfo.provider === 'VNPAY' ? 'VNPay' : 'MoMo'} trên điện thoại
                  <br />
                  2. Chọn "Quét mã QR" hoặc "Thanh toán QR"
                  <br />
                  3. Quét mã QR phía trên
                  <br />
                  4. Xác nhận thông tin và hoàn tất thanh toán
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Success Message */}
          {paymentInfo.status === 'COMPLETED' && (
            <Alert severity="success" sx={{ textAlign: 'center' }}>
              <Typography variant="h6" mb={1}>
                Thanh toán thành công!
              </Typography>
              <Typography variant="body2">
                Giao dịch của bạn đã được xử lý thành công. Bạn sẽ nhận được email xác nhận trong vài phút tới.
              </Typography>
            </Alert>
          )}

          {/* Error Message */}
          {(paymentInfo.status === 'FAILED' || paymentInfo.status === 'EXPIRED') && (
            <Alert severity="error" sx={{ textAlign: 'center' }}>
              <Typography variant="h6" mb={1}>
                {paymentInfo.status === 'EXPIRED' ? 'Hết thời gian thanh toán' : 'Thanh toán thất bại'}
              </Typography>
              <Typography variant="body2">
                {paymentInfo.status === 'EXPIRED' 
                  ? 'Mã QR đã hết hạn. Vui lòng tạo giao dịch mới.'
                  : 'Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.'
                }
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        {paymentInfo.status === 'PENDING' && (
          <Button onClick={onClose} color="inherit">
            Hủy
          </Button>
        )}
        {(paymentInfo.status === 'COMPLETED' || paymentInfo.status === 'FAILED' || paymentInfo.status === 'EXPIRED') && (
          <Button onClick={onClose} variant="contained" color="primary">
            Đóng
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default QRPayment;