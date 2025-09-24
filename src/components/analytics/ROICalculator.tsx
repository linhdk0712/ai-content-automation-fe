import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  Download, 
  Edit, 
  Save,
  Target,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';

interface ROICalculatorProps {
  userId: number;
  filters: any;
}

interface CostItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  type: 'fixed' | 'variable';
  period: 'monthly' | 'yearly' | 'one-time';
}

interface RevenueItem {
  id: string;
  source: string;
  description: string;
  amount: number;
  attribution: number; // Percentage attributed to content marketing
  period: 'monthly' | 'yearly' | 'one-time';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const DEFAULT_COSTS: CostItem[] = [
  { id: '1', category: 'AI Tools', description: 'OpenAI, Claude, Gemini subscriptions', amount: 200, type: 'fixed', period: 'monthly' },
  { id: '2', category: 'Design Tools', description: 'Canva Pro, Adobe Creative Suite', amount: 100, type: 'fixed', period: 'monthly' },
  { id: '3', category: 'Social Media Tools', description: 'Scheduling and analytics tools', amount: 150, type: 'fixed', period: 'monthly' },
  { id: '4', category: 'Staff Time', description: 'Content creation and management', amount: 2000, type: 'variable', period: 'monthly' },
  { id: '5', category: 'Advertising', description: 'Paid social media promotion', amount: 500, type: 'variable', period: 'monthly' }
];

const DEFAULT_REVENUE: RevenueItem[] = [
  { id: '1', source: 'Direct Sales', description: 'Sales attributed to social media', amount: 5000, attribution: 60, period: 'monthly' },
  { id: '2', source: 'Lead Generation', description: 'Qualified leads from content', amount: 3000, attribution: 80, period: 'monthly' },
  { id: '3', source: 'Brand Partnerships', description: 'Sponsored content revenue', amount: 1500, attribution: 100, period: 'monthly' },
  { id: '4', source: 'Affiliate Marketing', description: 'Commission from affiliate links', amount: 800, attribution: 90, period: 'monthly' }
];

export const ROICalculator: React.FC<ROICalculatorProps> = ({
  userId,
  filters
}) => {
  const [costs, setCosts] = useState<CostItem[]>(DEFAULT_COSTS);
  const [revenue, setRevenue] = useState<RevenueItem[]>(DEFAULT_REVENUE);
  const [editingCost, setEditingCost] = useState<string | null>(null);
  const [editingRevenue, setEditingRevenue] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'monthly' | 'yearly'>('monthly');
  const [viewMode, setViewMode] = useState<'calculator' | 'trends' | 'breakdown'>('calculator');

  const {
    roiData,
    loading,
    fetchROIData
  } = useAnalytics();

  useEffect(() => {
    fetchROIData(userId, filters);
  }, [userId, filters, fetchROIData]);

  const calculateTotalCosts = (): number => {
    return costs.reduce((total, cost) => {
      let amount = cost.amount;
      if (cost.period === 'yearly' && timeframe === 'monthly') {
        amount = amount / 12;
      } else if (cost.period === 'monthly' && timeframe === 'yearly') {
        amount = amount * 12;
      }
      return total + amount;
    }, 0);
  };

  const calculateTotalRevenue = (): number => {
    return revenue.reduce((total, rev) => {
      let amount = (rev.amount * rev.attribution) / 100;
      if (rev.period === 'yearly' && timeframe === 'monthly') {
        amount = amount / 12;
      } else if (rev.period === 'monthly' && timeframe === 'yearly') {
        amount = amount * 12;
      }
      return total + amount;
    }, 0);
  };

  const calculateROI = (): number => {
    const totalRevenue = calculateTotalRevenue();
    const totalCosts = calculateTotalCosts();
    if (totalCosts === 0) return 0;
    return ((totalRevenue - totalCosts) / totalCosts) * 100;
  };

  const calculateProfit = (): number => {
    return calculateTotalRevenue() - calculateTotalCosts();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (num: number): string => {
    return num.toFixed(1) + '%';
  };

  const getCostBreakdownData = () => {
    const categoryTotals: { [key: string]: number } = {};
    
    costs.forEach(cost => {
      let amount = cost.amount;
      if (cost.period === 'yearly' && timeframe === 'monthly') {
        amount = amount / 12;
      } else if (cost.period === 'monthly' && timeframe === 'yearly') {
        amount = amount * 12;
      }
      
      categoryTotals[cost.category] = (categoryTotals[cost.category] || 0) + amount;
    });

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / calculateTotalCosts()) * 100
    }));
  };

  const getRevenueBreakdownData = () => {
    const sourceTotals: { [key: string]: number } = {};
    
    revenue.forEach(rev => {
      let amount = (rev.amount * rev.attribution) / 100;
      if (rev.period === 'yearly' && timeframe === 'monthly') {
        amount = amount / 12;
      } else if (rev.period === 'monthly' && timeframe === 'yearly') {
        amount = amount * 12;
      }
      
      sourceTotals[rev.source] = (sourceTotals[rev.source] || 0) + amount;
    });

    return Object.entries(sourceTotals).map(([source, amount]) => ({
      source,
      amount,
      percentage: (amount / calculateTotalRevenue()) * 100
    }));
  };

  const updateCost = (id: string, field: keyof CostItem, value: any) => {
    setCosts(prev => prev.map(cost => 
      cost.id === id ? { ...cost, [field]: value } : cost
    ));
  };

  const updateRevenue = (id: string, field: keyof RevenueItem, value: any) => {
    setRevenue(prev => prev.map(rev => 
      rev.id === id ? { ...rev, [field]: value } : rev
    ));
  };

  const roi = calculateROI();
  const profit = calculateProfit();
  const totalCosts = calculateTotalCosts();
  const totalRevenue = calculateTotalRevenue();

  return (
    <Box>
      {/* Header Controls */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">
          ROI Calculator & Analysis
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
            >
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<Download />}
            size="small"
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* View Mode Tabs */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Button
          variant={viewMode === 'calculator' ? 'contained' : 'text'}
          onClick={() => setViewMode('calculator')}
          sx={{ mr: 1 }}
          startIcon={<Calculator />}
        >
          Calculator
        </Button>
        <Button
          variant={viewMode === 'breakdown' ? 'contained' : 'text'}
          onClick={() => setViewMode('breakdown')}
          sx={{ mr: 1 }}
          startIcon={<PieChartIcon />}
        >
          Breakdown
        </Button>
        <Button
          variant={viewMode === 'trends' ? 'contained' : 'text'}
          onClick={() => setViewMode('trends')}
          startIcon={<BarChart3 />}
        >
          Trends
        </Button>
      </Box>

      {/* ROI Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Investment
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(totalCosts)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {timeframe}
                  </Typography>
                </Box>
                <DollarSign size={40} color="#f44336" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(totalRevenue)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {timeframe}
                  </Typography>
                </Box>
                <DollarSign size={40} color="#4caf50" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Net Profit
                  </Typography>
                  <Typography variant="h5" color={profit >= 0 ? 'success.main' : 'error.main'}>
                    {formatCurrency(profit)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {timeframe}
                  </Typography>
                </Box>
                {profit >= 0 ? (
                  <TrendingUp size={40} color="#4caf50" />
                ) : (
                  <TrendingDown size={40} color="#f44336" />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    ROI
                  </Typography>
                  <Typography variant="h5" color={roi >= 0 ? 'success.main' : 'error.main'}>
                    {formatPercentage(roi)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Return on Investment
                  </Typography>
                </Box>
                <Target size={40} color={roi >= 0 ? '#4caf50' : '#f44336'} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Calculator View */}
      {viewMode === 'calculator' && (
        <Grid container spacing={3}>
          {/* Costs Table */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Investment Breakdown
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {costs.map((cost) => (
                        <TableRow key={cost.id}>
                          <TableCell>
                            {editingCost === cost.id ? (
                              <TextField
                                size="small"
                                value={cost.category}
                                onChange={(e) => updateCost(cost.id, 'category', e.target.value)}
                              />
                            ) : (
                              cost.category
                            )}
                          </TableCell>
                          <TableCell>
                            {editingCost === cost.id ? (
                              <TextField
                                size="small"
                                value={cost.description}
                                onChange={(e) => updateCost(cost.id, 'description', e.target.value)}
                              />
                            ) : (
                              cost.description
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {editingCost === cost.id ? (
                              <TextField
                                size="small"
                                type="number"
                                value={cost.amount}
                                onChange={(e) => updateCost(cost.id, 'amount', Number(e.target.value))}
                                InputProps={{ startAdornment: '$' }}
                              />
                            ) : (
                              <>
                                {formatCurrency(cost.amount)}
                                <Typography variant="caption" display="block">
                                  {cost.period}
                                </Typography>
                              </>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {editingCost === cost.id ? (
                              <IconButton
                                size="small"
                                onClick={() => setEditingCost(null)}
                              >
                                <Save size={16} />
                              </IconButton>
                            ) : (
                              <IconButton
                                size="small"
                                onClick={() => setEditingCost(cost.id)}
                              >
                                <Edit size={16} />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Total Investment: {formatCurrency(totalCosts)} / {timeframe}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Revenue Table */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue Breakdown
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Source</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Attribution</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {revenue.map((rev) => (
                        <TableRow key={rev.id}>
                          <TableCell>
                            {editingRevenue === rev.id ? (
                              <TextField
                                size="small"
                                value={rev.source}
                                onChange={(e) => updateRevenue(rev.id, 'source', e.target.value)}
                              />
                            ) : (
                              rev.source
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRevenue === rev.id ? (
                              <TextField
                                size="small"
                                value={rev.description}
                                onChange={(e) => updateRevenue(rev.id, 'description', e.target.value)}
                              />
                            ) : (
                              rev.description
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {editingRevenue === rev.id ? (
                              <TextField
                                size="small"
                                type="number"
                                value={rev.amount}
                                onChange={(e) => updateRevenue(rev.id, 'amount', Number(e.target.value))}
                                InputProps={{ startAdornment: '$' }}
                              />
                            ) : (
                              <>
                                {formatCurrency(rev.amount)}
                                <Typography variant="caption" display="block">
                                  {rev.period}
                                </Typography>
                              </>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {editingRevenue === rev.id ? (
                              <TextField
                                size="small"
                                type="number"
                                value={rev.attribution}
                                onChange={(e) => updateRevenue(rev.id, 'attribution', Number(e.target.value))}
                                InputProps={{ endAdornment: '%' }}
                              />
                            ) : (
                              `${rev.attribution}%`
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {editingRevenue === rev.id ? (
                              <IconButton
                                size="small"
                                onClick={() => setEditingRevenue(null)}
                              >
                                <Save size={16} />
                              </IconButton>
                            ) : (
                              <IconButton
                                size="small"
                                onClick={() => setEditingRevenue(rev.id)}
                              >
                                <Edit size={16} />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Total Revenue: {formatCurrency(totalRevenue)} / {timeframe}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Breakdown View */}
      {viewMode === 'breakdown' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Cost Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getCostBreakdownData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => `${props.category} ${Number(props.percentage).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {getCostBreakdownData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getRevenueBreakdownData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => `${props.source} ${Number(props.percentage).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {getRevenueBreakdownData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ROI Analysis
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center" p={2}>
                      <Typography variant="h3" color={roi >= 100 ? 'success.main' : roi >= 0 ? 'warning.main' : 'error.main'}>
                        {formatPercentage(roi)}
                      </Typography>
                      <Typography variant="h6" gutterBottom>
                        Return on Investment
                      </Typography>
                      <Chip
                        label={roi >= 100 ? 'Excellent' : roi >= 50 ? 'Good' : roi >= 0 ? 'Break Even' : 'Loss'}
                        color={roi >= 100 ? 'success' : roi >= 0 ? 'warning' : 'error'}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Alert severity={roi >= 100 ? 'success' : roi >= 0 ? 'warning' : 'error'}>
                      <Typography variant="subtitle2" gutterBottom>
                        ROI Analysis:
                      </Typography>
                      {roi >= 100 && (
                        <Typography variant="body2">
                          Excellent ROI! Your content marketing is generating strong returns. Consider scaling your investment.
                        </Typography>
                      )}
                      {roi >= 0 && roi < 100 && (
                        <Typography variant="body2">
                          Positive ROI but room for improvement. Focus on optimizing high-performing content types and reducing inefficient spending.
                        </Typography>
                      )}
                      {roi < 0 && (
                        <Typography variant="body2">
                          Negative ROI indicates losses. Review your strategy, reduce costs, or improve revenue attribution tracking.
                        </Typography>
                      )}
                    </Alert>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Trends View */}
      {viewMode === 'trends' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ROI Trend Analysis
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart 
                    data={roiData?.profitabilityTrends || [
                      { date: '2024-01', profit: 1200, roi: 45 },
                      { date: '2024-02', profit: 1800, roi: 65 },
                      { date: '2024-03', profit: 2200, roi: 78 },
                      { date: '2024-04', profit: 2800, roi: 95 },
                      { date: '2024-05', profit: 3200, roi: 110 },
                      { date: '2024-06', profit: 3600, roi: 125 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" tickFormatter={formatCurrency} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
                    <RechartsTooltip 
                      formatter={(value: number, name: string) => [
                        name === 'profit' ? formatCurrency(value) : `${value}%`,
                        name === 'profit' ? 'Profit' : 'ROI'
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="profit" fill="#8884d8" name="Profit" />
                    <Line yAxisId="right" type="monotone" dataKey="roi" stroke="#ff7300" strokeWidth={3} name="ROI %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};