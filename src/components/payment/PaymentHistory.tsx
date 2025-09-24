import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Receipt as ReceiptIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'EXPIRED';
  paymentMethod: string;
  paymentProvider: string;
  description: string;
  createdAt: string;
  processedAt?: string;
  failureReason?: string;
  refundedAmount?: number;
  invoiceNumber?: string;
  providerTransactionId: string;
}

interface PaymentHistoryProps {
  userId: string;
  onDownloadInvoice?: (paymentId: string) => void;
  onRefundRequest?: (paymentId: string) => void;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  userId,
  onDownloadInvoice,
  onRefundRequest
}) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPaymentForMenu, setSelectedPaymentForMenu] = useState<PaymentRecord | null>(null);

  useEffect(() => {
    fetchPayments();
  }, [page, rowsPerPage, searchTerm, statusFilter, startDate, endDate]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: rowsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && { endDate: endDate.toISOString() })
      });

      const response = await fetch(`/api/v1/payments/history/${userId}?${params}`);
      const data = await response.json();
      
      setPayments(data.content || []);
      setTotalCount(data.totalElements || 0);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, payment: PaymentRecord) => {
    setAnchorEl(event.currentTarget);
    setSelectedPaymentForMenu(payment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPaymentForMenu(null);
  };

  const handleViewDetails = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setDetailsOpen(true);
    handleMenuClose();
  };

  const handleDownloadInvoice = (paymentId: string) => {
    if (onDownloadInvoice) {
      onDownloadInvoice(paymentId);
    }
    handleMenuClose();
  };

  const handleRefundRequest = (paymentId: string) => {
    if (onRefundRequest) {
      onRefundRequest(paymentId);
    }
    handleMenuClose();
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
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
      case 'CANCELLED':
      case 'EXPIRED':
        return 'error';
      case 'PROCESSING':
        return 'warning';
      case 'REFUNDED':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ xử lý';
      case 'PROCESSING':
        return 'Đang xử lý';
      case 'COMPLETED':
        return 'Thành công';
      case 'FAILED':
        return 'Thất bại';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'REFUNDED':
        return 'Đã hoàn tiền';
      case 'EXPIRED':
        return 'Hết hạn';
      default:
        return status;
    }
  };

  const getPaymentMethodLabel = (method: string, provider: string) => {
    if (provider === 'VNPAY') {
      return method === 'VNPAY_QR' ? 'VNPay QR' : 'VNPay Bank';
    } else if (provider === 'MOMO') {
      return method === 'MOMO_QR' ? 'MoMo QR' : 'MoMo Wallet';
    }
    return method;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight="bold">
              Lịch Sử Thanh Toán
            </Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchPayments}
              disabled={loading}
            >
              Làm mới
            </Button>
          </Box>

          {/* Filters */}
          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Trạng thái"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="COMPLETED">Thành công</MenuItem>
                  <MenuItem value="PENDING">Chờ xử lý</MenuItem>
                  <MenuItem value="FAILED">Thất bại</MenuItem>
                  <MenuItem value="REFUNDED">Đã hoàn tiền</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="Từ ngày"
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="Đến ngày"
                  value={endDate}
                  onChange={setEndDate}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setStartDate(null);
                      setEndDate(null);
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Payment Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã giao dịch</TableCell>
                  <TableCell>Số tiền</TableCell>
                  <TableCell>Phương thức</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Ngày tạo</TableCell>
                  <TableCell>Mô tả</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {payment.providerTransactionId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatAmount(payment.amount, payment.currency)}
                      </Typography>
                      {payment.refundedAmount && payment.refundedAmount > 0 && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Hoàn: {formatAmount(payment.refundedAmount, payment.currency)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getPaymentMethodLabel(payment.paymentMethod, payment.paymentProvider)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(payment.status)}
                        color={getStatusColor(payment.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(payment.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {payment.description}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, payment)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Số dòng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`
            }
          />

          {/* Action Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => selectedPaymentForMenu && handleViewDetails(selectedPaymentForMenu)}>
              <ReceiptIcon sx={{ mr: 1 }} fontSize="small" />
              Xem chi tiết
            </MenuItem>
            {selectedPaymentForMenu?.invoiceNumber && (
              <MenuItem onClick={() => selectedPaymentForMenu && handleDownloadInvoice(selectedPaymentForMenu.id)}>
                <DownloadIcon sx={{ mr: 1 }} fontSize="small" />
                Tải hóa đơn
              </MenuItem>
            )}
            {selectedPaymentForMenu?.status === 'COMPLETED' && (
              <MenuItem onClick={() => selectedPaymentForMenu && handleRefundRequest(selectedPaymentForMenu.id)}>
                <RefreshIcon sx={{ mr: 1 }} fontSize="small" />
                Yêu cầu hoàn tiền
              </MenuItem>
            )}
          </Menu>

          {/* Payment Details Dialog */}
          <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Chi Tiết Giao Dịch</DialogTitle>
            <DialogContent>
              {selectedPayment && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Mã giao dịch
                      </Typography>
                      <Typography variant="body1" fontFamily="monospace">
                        {selectedPayment.providerTransactionId}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Trạng thái
                      </Typography>
                      <Chip
                        label={getStatusLabel(selectedPayment.status)}
                        color={getStatusColor(selectedPayment.status) as any}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Số tiền
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {formatAmount(selectedPayment.amount, selectedPayment.currency)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Phương thức thanh toán
                      </Typography>
                      <Typography variant="body1">
                        {getPaymentMethodLabel(selectedPayment.paymentMethod, selectedPayment.paymentProvider)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Mô tả
                      </Typography>
                      <Typography variant="body1">
                        {selectedPayment.description}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Ngày tạo
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedPayment.createdAt)}
                      </Typography>
                    </Grid>
                    {selectedPayment.processedAt && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Ngày xử lý
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(selectedPayment.processedAt)}
                        </Typography>
                      </Grid>
                    )}
                    {selectedPayment.failureReason && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Lý do thất bại
                        </Typography>
                        <Typography variant="body1" color="error">
                          {selectedPayment.failureReason}
                        </Typography>
                      </Grid>
                    )}
                    {selectedPayment.refundedAmount && selectedPayment.refundedAmount > 0 && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Số tiền đã hoàn
                        </Typography>
                        <Typography variant="body1" color="info.main">
                          {formatAmount(selectedPayment.refundedAmount, selectedPayment.currency)}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>Đóng</Button>
              {selectedPayment?.invoiceNumber && (
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => selectedPayment && handleDownloadInvoice(selectedPayment.id)}
                >
                  Tải hóa đơn
                </Button>
              )}
            </DialogActions>
          </Dialog>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};

export default PaymentHistory;