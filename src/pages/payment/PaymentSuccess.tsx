import {
  CheckCircle as CheckCircleIcon,
  Check as CheckIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Phone as PhoneIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Container, Grid, List, ListItem, ListItemIcon, ListItemText, Paper, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

interface PaymentDetails {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  paymentProvider: string;
  description: string;
  processedAt: string;
  invoiceNumber?: string;
  subscriptionId?: string;
  planType?: string;
}

const PaymentSuccess: React.FC = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (paymentId) {
      fetchPaymentDetails();
    } else {
      // Try to get payment info from URL params (for redirect from payment gateway)
      const transactionId = searchParams.get('vnp_TxnRef') || searchParams.get('orderId');
      if (transactionId) {
        fetchPaymentByTransactionId(transactionId);
      } else {
        setError('Không tìm thấy thông tin thanh toán');
        setLoading(false);
      }
    }
  }, [paymentId, searchParams]);

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/v1/payments/${paymentId}`);
      if (response.ok) {
        const data = await response.json();
        setPayment(data);
      } else {
        setError('Không thể tải thông tin thanh toán');
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      setError('Có lỗi xảy ra khi tải thông tin thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentByTransactionId = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/v1/payments/transaction/${transactionId}`);
      if (response.ok) {
        const data = await response.json();
        setPayment(data);
      } else {
        setError('Không tìm thấy giao dịch');
      }
    } catch (error) {
      console.error('Error fetching payment by transaction ID:', error);
      setError('Có lỗi xảy ra khi tải thông tin giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (payment?.invoiceNumber) {
      try {
        const response = await fetch(`/api/v1/invoices/${payment.invoiceNumber}/download`);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoice-${payment.invoiceNumber}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      } catch (error) {
        console.error('Error downloading invoice:', error);
      }
    }
  };

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getPlanDisplayName = (planType?: string): string => {
    switch (planType) {
      case 'BASIC':
        return 'Gói Cơ Bản';
      case 'PRO':
        return 'Gói Chuyên Nghiệp';
      case 'ENTERPRISE':
        return 'Gói Doanh Nghiệp';
      default:
        return planType || '';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress size={60} />
          <Typography variant="h6">Đang xử lý thông tin thanh toán...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !payment) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Không tìm thấy thông tin thanh toán'}
        </Alert>
        <Box textAlign="center">
          <Button variant="contained" onClick={() => navigate('/')} startIcon={<HomeIcon />}>
            Về trang chủ
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Success Header */}
      <Box textAlign="center" mb={4}>
        <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h3" fontWeight="bold" color="success.main" gutterBottom>
          Thanh Toán Thành Công!
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi
        </Typography>
      </Box>

      {/* Payment Details */}
      <Card elevation={3} sx={{ mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Chi Tiết Thanh Toán
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Số tiền
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {formatAmount(payment.amount, payment.currency)}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Trạng thái
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircleIcon color="success" />
                <Typography variant="h6" color="success.main">
                  Thành công
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Phương thức thanh toán
              </Typography>
              <Typography variant="body1">
                {payment.paymentProvider === 'VNPAY' ? 'VNPay' : 
                 payment.paymentProvider === 'MOMO' ? 'MoMo' : payment.paymentProvider}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Thời gian xử lý
              </Typography>
              <Typography variant="body1">
                {formatDate(payment.processedAt)}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Mô tả
              </Typography>
              <Typography variant="body1">
                {payment.description}
              </Typography>
            </Grid>

            {payment.planType && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Gói đăng ký
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {getPlanDisplayName(payment.planType)}
                </Typography>
              </Grid>
            )}

            {payment.invoiceNumber && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Số hóa đơn
                </Typography>
                <Typography variant="body1" fontFamily="monospace">
                  {payment.invoiceNumber}
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Bước Tiếp Theo
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Email xác nhận đã được gửi"
                secondary="Kiểm tra hộp thư của bạn để xem chi tiết giao dịch"
              />
            </ListItem>
            
            {payment.subscriptionId && (
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Gói đăng ký đã được kích hoạt"
                  secondary="Bạn có thể bắt đầu sử dụng các tính năng premium ngay bây giờ"
                />
              </ListItem>
            )}
            
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Hóa đơn có thể tải xuống"
                secondary="Sử dụng nút bên dưới để tải hóa đơn PDF"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {payment.invoiceNumber && (
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<DownloadIcon />}
              onClick={handleDownloadInvoice}
            >
              Tải hóa đơn
            </Button>
          </Grid>
        )}
        
        {payment.subscriptionId && (
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<SettingsIcon />}
              onClick={() => navigate('/subscription')}
            >
              Quản lý gói
            </Button>
          </Grid>
        )}
        
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<ReceiptIcon />}
            onClick={() => navigate('/payment-history')}
          >
            Lịch sử thanh toán
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<HomeIcon />}
            onClick={() => navigate('/dashboard')}
          >
            Về Dashboard
          </Button>
        </Grid>
      </Grid>

      {/* Support Information */}
      <Paper elevation={1} sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Cần Hỗ Trợ?
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Nếu bạn có bất kỳ câu hỏi nào về giao dịch này, vui lòng liên hệ với chúng tôi:
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" gap={1}>
              <EmailIcon color="primary" />
              <Typography variant="body2">
                support@aicontentautomation.com
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" gap={1}>
              <PhoneIcon color="primary" />
              <Typography variant="body2">
                1900 1234 (8:00 - 22:00)
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default PaymentSuccess;