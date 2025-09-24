import {
  CreditCard as CreditCardIcon,
  Email as EmailIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  Home as HomeIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography
} from '@mui/material';
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
  createdAt: string;
  failureReason?: string;
  providerTransactionId: string;
}

const PaymentFailure: React.FC = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

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

  const handleRetryPayment = async () => {
    if (!payment) return;
    
    setRetrying(true);
    try {
      // Create a new payment with the same details
      const response = await fetch('/api/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
          paymentProvider: payment.paymentProvider,
          description: payment.description
        }),
      });

      if (response.ok) {
        const newPayment = await response.json();
        // Redirect to payment page
        window.location.href = newPayment.providerPaymentUrl;
      } else {
        setError('Không thể tạo giao dịch mới');
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
      setError('Có lỗi xảy ra khi thử lại thanh toán');
    } finally {
      setRetrying(false);
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

  const getFailureReasonMessage = (reason?: string): string => {
    if (!reason) return 'Không xác định được lý do thất bại';
    
    // Map common failure reasons to user-friendly messages
    const reasonMap: Record<string, string> = {
      'insufficient_funds': 'Số dư tài khoản không đủ',
      'card_declined': 'Thẻ bị từ chối',
      'expired_card': 'Thẻ đã hết hạn',
      'invalid_card': 'Thông tin thẻ không hợp lệ',
      'network_error': 'Lỗi kết nối mạng',
      'timeout': 'Hết thời gian chờ',
      'cancelled_by_user': 'Người dùng hủy giao dịch',
      'payment_expired': 'Giao dịch đã hết hạn',
      'system_error': 'Lỗi hệ thống'
    };

    return reasonMap[reason] || reason;
  };

  const getTroubleshootingSteps = (reason?: string): string[] => {
    const commonSteps = [
      'Kiểm tra kết nối internet của bạn',
      'Đảm bảo thông tin thanh toán chính xác',
      'Thử lại sau vài phút',
      'Liên hệ ngân hàng nếu vấn đề tiếp tục'
    ];

    const specificSteps: Record<string, string[]> = {
      'insufficient_funds': [
        'Kiểm tra số dư tài khoản',
        'Nạp thêm tiền vào tài khoản',
        'Sử dụng phương thức thanh toán khác'
      ],
      'card_declined': [
        'Liên hệ ngân hàng để kiểm tra thẻ',
        'Kiểm tra giới hạn giao dịch',
        'Thử sử dụng thẻ khác'
      ],
      'expired_card': [
        'Cập nhật thông tin thẻ mới',
        'Sử dụng thẻ khác còn hiệu lực'
      ],
      'network_error': [
        'Kiểm tra kết nối internet',
        'Thử lại sau vài phút',
        'Sử dụng mạng khác nếu có thể'
      ]
    };

    return specificSteps[reason || ''] || commonSteps;
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
      {/* Failure Header */}
      <Box textAlign="center" mb={4}>
        <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
        <Typography variant="h3" fontWeight="bold" color="error.main" gutterBottom>
          Thanh Toán Thất Bại
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Rất tiếc, giao dịch của bạn không thể hoàn thành
        </Typography>
      </Box>

      {/* Failure Alert */}
      <Alert severity="error" sx={{ mb: 4 }}>
        <Typography variant="body1" fontWeight="medium">
          Lý do: {getFailureReasonMessage(payment.failureReason)}
        </Typography>
      </Alert>

      {/* Payment Details */}
      <Card elevation={3} sx={{ mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Chi Tiết Giao Dịch
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Số tiền
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {formatAmount(payment.amount, payment.currency)}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Trạng thái
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <ErrorIcon color="error" />
                <Typography variant="h6" color="error.main">
                  Thất bại
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
                Thời gian tạo
              </Typography>
              <Typography variant="body1">
                {formatDate(payment.createdAt)}
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

            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Mã giao dịch
              </Typography>
              <Typography variant="body1" fontFamily="monospace">
                {payment.providerTransactionId}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Cách Khắc Phục
          </Typography>
          
          <List>
            {getTroubleshootingSteps(payment.failureReason).map((step, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <HelpIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={step} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<RefreshIcon />}
            onClick={handleRetryPayment}
            disabled={retrying}
          >
            {retrying ? 'Đang xử lý...' : 'Thử lại'}
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<CreditCardIcon />}
            onClick={() => navigate('/pricing')}
          >
            Chọn phương thức khác
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<HelpIcon />}
            onClick={() => navigate('/support')}
          >
            Liên hệ hỗ trợ
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

      {/* FAQ */}
      <Card elevation={1} sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Câu Hỏi Thường Gặp
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Tại sao thanh toán của tôi bị từ chối?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Thanh toán có thể bị từ chối do nhiều lý do như số dư không đủ, thông tin thẻ không chính xác, 
                hoặc ngân hàng từ chối giao dịch. Vui lòng kiểm tra lại thông tin và thử lại.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Tiền có bị trừ khỏi tài khoản không?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Nếu giao dịch thất bại, tiền sẽ không bị trừ khỏi tài khoản của bạn. 
                Trong trường hợp có tạm giữ, số tiền sẽ được hoàn lại trong 1-3 ngày làm việc.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Tôi có thể thử lại ngay không?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Có, bạn có thể thử lại ngay lập tức. Tuy nhiên, nếu giao dịch tiếp tục thất bại, 
                hãy chờ vài phút hoặc liên hệ ngân hàng để được hỗ trợ.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      {/* Support Information */}
      <Paper elevation={1} sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <WarningIcon color="warning" />
          <Typography variant="h6" fontWeight="bold">
            Cần Hỗ Trợ Khẩn Cấp?
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Đội ngũ hỗ trợ của chúng tôi sẵn sàng giúp bạn giải quyết vấn đề thanh toán:
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
                1900 1234 (24/7)
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default PaymentFailure;