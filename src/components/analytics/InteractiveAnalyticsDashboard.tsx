import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  MenuItem,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Breadcrumbs,
  Link,
  Fab,
  Zoom,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  TrendingUp,
  TrendingDown,
  MoreVert,
  FilterList,
  Download,
  Refresh,
  Fullscreen,
  FullscreenExit,
  Compare,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface MetricData {
  id: string;
  name: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  trend: Array<{ date: string; value: number }>;
  drillDownData?: Record<string, any>;
}

interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'funnel' | 'treemap';
  title: string;
  data: any[];
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
  filters?: Record<string, any>;
  drillDownLevels?: string[];
  currentLevel?: number;
}

interface DrillDownPath {
  level: string;
  value: string;
  label: string;
}

interface InteractiveAnalyticsDashboardProps {
  metrics: MetricData[];
  charts: ChartConfig[];
  onMetricClick?: (metric: MetricData, drillDownPath: DrillDownPath[]) => void;
  onChartInteraction?: (chart: ChartConfig, dataPoint: any, drillDownPath: DrillDownPath[]) => void;
  onExport?: (type: 'pdf' | 'excel' | 'csv', data: any) => void;
  refreshInterval?: number;
}

const DashboardContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.default,
  minHeight: '100vh',
}));

const MetricCard = styled(Card)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const ChartContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: 400,
  position: 'relative',
  '&.fullscreen': {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    height: '100vh',
    borderRadius: 0,
  },
}));

const DrillDownBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiLink-root': {
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
}));

const FloatingControls = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  zIndex: 1000,
}));

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff', '#ffff00'];

export const InteractiveAnalyticsDashboard: React.FC<InteractiveAnalyticsDashboardProps> = ({
  metrics,
  charts,
  onMetricClick,
  onChartInteraction,
  onExport,
  refreshInterval = 30000,
}) => {
  const [drillDownPath, setDrillDownPath] = useState<DrillDownPath[]>([]);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
  });
  const [chartFilters, setChartFilters] = useState<Record<string, any>>({});
  const [compareMode, setCompareMode] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  const handleMetricDrillDown = useCallback((metric: MetricData, level?: string, value?: string) => {
    if (level && value) {
      const newPath = [...drillDownPath, { level, value, label: `${level}: ${value}` }];
      setDrillDownPath(newPath);
      onMetricClick?.(metric, newPath);
    } else {
      onMetricClick?.(metric, drillDownPath);
    }
  }, [drillDownPath, onMetricClick]);

  const handleChartDrillDown = useCallback((chart: ChartConfig, dataPoint: any) => {
    if (chart.drillDownLevels && chart.currentLevel !== undefined) {
      const nextLevel = chart.drillDownLevels[chart.currentLevel + 1];
      if (nextLevel) {
        const newPath = [...drillDownPath, {
          level: nextLevel,
          value: dataPoint[chart.xAxis || 'name'],
          label: `${nextLevel}: ${dataPoint[chart.xAxis || 'name']}`,
        }];
        setDrillDownPath(newPath);
        onChartInteraction?.(chart, dataPoint, newPath);
      }
    }
  }, [drillDownPath, onChartInteraction]);

  const handleBreadcrumbClick = useCallback((index: number) => {
    const newPath = drillDownPath.slice(0, index + 1);
    setDrillDownPath(newPath);
  }, [drillDownPath]);

  const resetDrillDown = useCallback(() => {
    setDrillDownPath([]);
  }, []);

  const renderChart = useCallback((chart: ChartConfig) => {
    const isFullscreen = fullscreenChart === chart.id;
    const height = isFullscreen ? window.innerHeight - 200 : 300;

    const commonProps = {
      width: '100%',
      height,
      data: chart.data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    switch (chart.type) {
      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
              <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xAxis || 'name'} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={chart.yAxis || 'value'}
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6, onClick: (_event: any, payload?: any) => handleChartDrillDown(chart, (payload as any)?.payload || (payload as any)) }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xAxis || 'name'} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey={chart.yAxis || 'value'}
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <RechartsBarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xAxis || 'name'} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar
                dataKey={chart.yAxis || 'value'}
                fill="#8884d8"
                onClick={(data) => handleChartDrillDown(chart, data)}
                cursor="pointer"
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer {...commonProps}>
            <RechartsPieChart>
              <RechartsTooltip />
              <Legend />
              <RechartsPieChart data={chart.data} cx="50%" cy="50%" outerRadius={80}>
                {chart.data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    onClick={() => handleChartDrillDown(chart, entry)}
                    cursor="pointer"
                  />
                ))}
              </RechartsPieChart>
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer {...commonProps}>
            <ScatterChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xAxis || 'x'} />
              <YAxis dataKey={chart.yAxis || 'y'} />
              <RechartsTooltip />
              <Legend />
              <Scatter
                name="Data Points"
                data={chart.data}
                fill="#8884d8"
                onClick={(data) => handleChartDrillDown(chart, (data as any))}
              />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'funnel':
        return (
          <ResponsiveContainer {...commonProps}>
            <FunnelChart>
              <RechartsTooltip />
              <Funnel
                dataKey={chart.yAxis || 'value'}
                data={chart.data}
                isAnimationActive
              >
                <LabelList position="center" fill="#fff" stroke="none" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        );

      case 'treemap':
        return (
          <ResponsiveContainer {...commonProps}>
            <Treemap
              data={chart.data}
              dataKey={chart.yAxis || 'value'}
              aspectRatio={4 / 3}
              stroke="#fff"
              fill="#8884d8"
            />
          </ResponsiveContainer>
        );

      default:
        return <Typography>Unsupported chart type: {chart.type}</Typography>;
    }
  }, [fullscreenChart, handleChartDrillDown]);

  const filteredCharts = useMemo(() => {
    return charts.filter(chart => {
      if (Object.keys(chartFilters).length === 0) return true;
      
      return Object.entries(chartFilters).every(([key, value]) => {
        if (!value) return true;
        return chart.data.some(item => item[key] === value);
      });
    });
  }, [charts, chartFilters]);

  const exportData = useCallback((type: 'pdf' | 'excel' | 'csv') => {
    const exportData = {
      metrics,
      charts: filteredCharts,
      drillDownPath,
      dateRange,
      filters: chartFilters,
    };
    onExport?.(type, exportData);
  }, [metrics, filteredCharts, drillDownPath, dateRange, chartFilters, onExport]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DashboardContainer>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Analytics Dashboard
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<FilterList />}
              onClick={() => setFilterDialogOpen(true)}
              variant="outlined"
            >
              Filters
            </Button>
            
            <Button
              startIcon={<Compare />}
              onClick={() => setCompareMode(!compareMode)}
              variant={compareMode ? 'contained' : 'outlined'}
            >
              Compare
            </Button>
            
            <Button
              startIcon={<Download />}
              onClick={() => exportData('pdf')}
              variant="outlined"
            >
              Export
            </Button>
            
            <IconButton onClick={() => window.location.reload()}>
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        {/* Drill-down Breadcrumbs */}
        {drillDownPath.length > 0 && (
          <DrillDownBreadcrumbs>
            <Link onClick={resetDrillDown}>
              Dashboard
            </Link>
            {drillDownPath.map((path, index) => (
              <Link key={index} onClick={() => handleBreadcrumbClick(index)}>
                {path.label}
              </Link>
            ))}
          </DrillDownBreadcrumbs>
        )}

        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {metrics.map((metric) => (
            <Grid item xs={12} sm={6} md={3} key={metric.id}>
              <MetricCard onClick={() => handleMetricDrillDown(metric)}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        {metric.name}
                      </Typography>
                      <Typography variant="h4" component="div">
                        {metric.value.toLocaleString()}
                      </Typography>
                    </Box>
                    <Chip
                      icon={metric.changeType === 'increase' ? <TrendingUp /> : <TrendingDown />}
                      label={`${metric.change > 0 ? '+' : ''}${metric.change}%`}
                      color={metric.changeType === 'increase' ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                  
                  {/* Mini trend chart */}
                  <Box sx={{ mt: 2, height: 60 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metric.trend}>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={metric.changeType === 'increase' ? '#4caf50' : '#f44336'}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </MetricCard>
            </Grid>
          ))}
        </Grid>

        {/* Charts Grid */}
        <Grid container spacing={3}>
          {filteredCharts.map((chart) => (
            <Grid item xs={12} md={6} lg={4} key={chart.id}>
              <ChartContainer className={fullscreenChart === chart.id ? 'fullscreen' : ''}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{chart.title}</Typography>
                  
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => setFullscreenChart(
                        fullscreenChart === chart.id ? null : chart.id
                      )}
                    >
                      {fullscreenChart === chart.id ? <FullscreenExit /> : <Fullscreen />}
                    </IconButton>
                    
                    <IconButton size="small">
                      <MoreVert />
                    </IconButton>
                  </Box>
                </Box>
                
                {renderChart(chart)}
                
                {chart.drillDownLevels && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
                    {chart.drillDownLevels.map((level, index) => (
                      <Chip
                        key={level}
                        label={level}
                        size="small"
                        variant={index === (chart.currentLevel || 0) ? 'filled' : 'outlined'}
                        color="primary"
                      />
                    ))}
                  </Box>
                )}
              </ChartContainer>
            </Grid>
          ))}
        </Grid>

        {/* Floating Controls */}
        <FloatingControls>
          <Zoom in={true}>
            <Fab color="primary" size="small" onClick={() => setFilterDialogOpen(true)}>
              <FilterList />
            </Fab>
          </Zoom>
          
          <Zoom in={true} style={{ transitionDelay: '100ms' }}>
            <Fab color="secondary" size="small" onClick={() => exportData('excel')}>
              <Download />
            </Fab>
          </Zoom>
          
          <Zoom in={true} style={{ transitionDelay: '200ms' }}>
            <Fab size="small" onClick={() => window.location.reload()}>
              <Refresh />
            </Fab>
          </Zoom>
        </FloatingControls>

        {/* Filter Dialog */}
        <Dialog
          open={filterDialogOpen}
          onClose={() => setFilterDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Dashboard Filters</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Start Date"
                  value={dateRange.start}
                  onChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="End Date"
                  value={dateRange.end}
                  onChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Platform</InputLabel>
                  <Select
                    value={chartFilters.platform || ''}
                    onChange={(e) => setChartFilters(prev => ({ ...prev, platform: e.target.value }))}
                  >
                    <MenuItem value="">All Platforms</MenuItem>
                    <MenuItem value="facebook">Facebook</MenuItem>
                    <MenuItem value="instagram">Instagram</MenuItem>
                    <MenuItem value="twitter">Twitter</MenuItem>
                    <MenuItem value="linkedin">LinkedIn</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Content Type</InputLabel>
                  <Select
                    value={chartFilters.contentType || ''}
                    onChange={(e) => setChartFilters(prev => ({ ...prev, contentType: e.target.value }))}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="text">Text</MenuItem>
                    <MenuItem value="image">Image</MenuItem>
                    <MenuItem value="video">Video</MenuItem>
                    <MenuItem value="carousel">Carousel</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setChartFilters({});
                setDateRange({ start: null, end: null });
              }}
              variant="outlined"
            >
              Clear All
            </Button>
            <Button onClick={() => setFilterDialogOpen(false)} variant="contained">
              Apply Filters
            </Button>
          </DialogActions>
        </Dialog>
      </DashboardContainer>
    </LocalizationProvider>
  );
};

export default InteractiveAnalyticsDashboard;