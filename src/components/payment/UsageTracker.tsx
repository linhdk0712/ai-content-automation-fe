import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  Chip,
  Button,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Upgrade as UpgradeIcon,
  Refresh as RefreshIcon,
  SmartToy as AIIcon,
  VideoLibrary as VideoIcon,
  Storage as StorageIcon,
  Api as ApiIcon
} from '@mui/icons-material';

interface UsageQuota {
  resourceType: string;
  limit: number;
  used: number;
  remaining: number;
  usagePercentage: number;
  quotaExceeded: boolean;
  resetPeriod: string;
  nextResetDate: string;
  canUpgrade: boolean;
  upgradeMessage?: string;
}

interface UsageStats {
  period: string;
  usageByResource: Record<string, number>;
  limitsByResource: Record<string, number>;
}

interface UsageTrackerProps {
  userId: string;
  onUpgradeClick?: () => void;
  refreshInterval?: number;
}

const UsageTracker: React.FC<UsageTrackerProps> = ({
  userId,
  onUpgradeClick,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [quotas, setQuotas] = useState<Record<string, UsageQuota>>({});
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const resourceTypes = [
    {
      key: 'ai_generations',
      name: 'Tạo nội dung AI',
      icon: <AIIcon />,
      color: '#2196F3',
      unit: 'lần'
    },
    {
      key: 'video_minutes',
      name: 'Video AI',
      icon: <VideoIcon />,
      color: '#FF9800',
      unit: 'phút'
    },
    {
      key: 'storage_gb',
      name: 'Lưu trữ',
      icon: <StorageIcon />,
      color: '#4CAF50',
      unit: 'GB'
    },
    {
      key: 'api_calls',
      name: 'API Calls',
      icon: <ApiIcon />,
      color: '#9C27B0',
      unit: 'calls'
    }
  ];

  useEffect(() => {
    fetchUsageData();
    
    const interval = setInterval(() => {
      fetchUsageData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [userId, refreshInterval]);

  const fetchUsageData = async () => {
    try {
      // Fetch quota data for each resource type
      const quotaPromises = resourceTypes.map(async (resource) => {
        const response = await fetch(`/api/v1/subscriptions/usage/quota/${userId}?resourceType=${resource.key}`);
        const data = await response.json();
        return { [resource.key]: data };
      });

      const quotaResults = await Promise.all(quotaPromises);
      const quotaData = quotaResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setQuotas(quotaData);

      // Fetch usage stats
      const statsResponse = await fetch(`/api/v1/subscriptions/usage/stats/${userId}?period=current_month`);
      const statsData = await statsResponse.json();
      setStats(statsData);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsageColor = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage < 70) return 'success';
    if (percentage < 90) return 'warning';
    return 'error';
  };

  const getUsageIcon = (percentage: number, exceeded: boolean) => {
    if (exceeded) return <ErrorIcon color="error" />;
    if (percentage >= 90) return <WarningIcon color="warning" />;
    if (percentage >= 70) return <InfoIcon color="warning" />;
    return <CheckCircleIcon color="success" />;
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString));
  };

  const getResourceInfo = (resourceKey: string) => {
    return resourceTypes.find(r => r.key === resourceKey);
  };

  const hasHighUsage = Object.values(quotas).some(quota => quota.usagePercentage >= 80);
  const hasExceededQuota = Object.values(quotas).some(quota => quota.quotaExceeded);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Theo Dõi Sử Dụng
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="caption" color="text.secondary">
            Cập nhật lần cuối: {lastUpdated.toLocaleTimeString('vi-VN')}
          </Typography>
          <Tooltip title="Làm mới">
            <IconButton size="small" onClick={fetchUsageData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Alerts */}
      {hasExceededQuota && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          onUpgradeClick && (
            <Button color="inherit" size="small" onClick={onUpgradeClick}>
              Nâng cấp ngay
            </Button>
          )
        }>
          <Typography variant="body2">
            Bạn đã vượt quá giới hạn sử dụng một số tài nguyên. Vui lòng nâng cấp gói để tiếp tục sử dụng.
          </Typography>
        </Alert>
      )}

      {hasHighUsage && !hasExceededQuota && (
        <Alert severity="warning" sx={{ mb: 2 }} action={
          onUpgradeClick && (
            <Button color="inherit" size="small" onClick={onUpgradeClick}>
              Xem gói nâng cấp
            </Button>
          )
        }>
          <Typography variant="body2">
            Bạn đã sử dụng hơn 80% quota của một số tài nguyên. Hãy cân nhắc nâng cấp gói.
          </Typography>
        </Alert>
      )}

      {/* Usage Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {resourceTypes.map((resource) => {
          const quota = quotas[resource.key];
          if (!quota) return null;

          const resourceInfo = getResourceInfo(resource.key);
          const usageColor = getUsageColor(quota.usagePercentage);

          return (
            <Grid item xs={12} sm={6} md={3} key={resource.key}>
              <Card 
                elevation={quota.quotaExceeded ? 4 : 2}
                sx={{ 
                  height: '100%',
                  border: quota.quotaExceeded ? '2px solid' : 'none',
                  borderColor: quota.quotaExceeded ? 'error.main' : 'transparent'
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ color: resource.color }}>
                        {resource.icon}
                      </Box>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {resource.name}
                      </Typography>
                    </Box>
                    {getUsageIcon(quota.usagePercentage, quota.quotaExceeded)}
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6" fontWeight="bold">
                        {formatNumber(quota.used)} / {formatNumber(quota.limit)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {quota.usagePercentage.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(quota.usagePercentage, 100)}
                      color={usageColor}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: 'grey.200'
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Còn lại: {formatNumber(quota.remaining)} {resource.unit}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Reset: {formatDate(quota.nextResetDate)}
                    </Typography>
                  </Box>

                  {quota.quotaExceeded && (
                    <Chip
                      label="Vượt quota"
                      color="error"
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Detailed Usage Statistics */}
      {stats && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Thống Kê Chi Tiết - {stats.period === 'current_month' ? 'Tháng Hiện Tại' : stats.period}
            </Typography>
            
            <List>
              {resourceTypes.map((resource, index) => {
                const used = stats.usageByResource[resource.key] || 0;
                const limit = stats.limitsByResource[resource.key] || 0;
                const percentage = limit > 0 ? (used / limit) * 100 : 0;
                
                return (
                  <React.Fragment key={resource.key}>
                    <ListItem>
                      <ListItemIcon sx={{ color: resource.color }}>
                        {resource.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body1">
                              {resource.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatNumber(used)} / {formatNumber(limit)} {resource.unit}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box mt={1}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(percentage, 100)}
                              color={getUsageColor(percentage)}
                              sx={{ height: 4, borderRadius: 2 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < resourceTypes.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Prompt */}
      {(hasHighUsage || hasExceededQuota) && onUpgradeClick && (
        <Paper elevation={2} sx={{ p: 3, mt: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Cần Thêm Tài Nguyên?
              </Typography>
              <Typography variant="body2">
                Nâng cấp gói để có thêm quota và tính năng cao cấp
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<UpgradeIcon />}
              onClick={onUpgradeClick}
              size="large"
            >
              Nâng Cấp Ngay
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default UsageTracker;