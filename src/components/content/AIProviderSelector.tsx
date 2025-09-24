import {
  AttachMoney,
  CheckCircle,
  Error,
  Info,
  Speed,
  Star,
  Warning
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Skeleton,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAIProviders } from '../../hooks/useAIProviders';

interface AIProviderSelectorProps {
  selectedProvider: string;
  onProviderSelect: (provider: string) => void;
  optimizationCriteria: string;
  sx?: any;
}

const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({
  selectedProvider,
  onProviderSelect,
  optimizationCriteria,
  sx
}) => {
  const {
    providers,
    providerStatuses,
    recommendations,
    isLoading,
    error,
    loadProviders,
    getProviderRecommendations
  } = useAIProviders();

  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadProviders();
    getProviderRecommendations(optimizationCriteria);
  }, [loadProviders, getProviderRecommendations, optimizationCriteria]);

  const getStatusIcon = (status: any) => {
    if (!status) return <Warning color="warning" />;
    
    switch (status.status) {
      case 'HEALTHY':
        return <CheckCircle color="success" />;
      case 'DEGRADED':
        return <Warning color="warning" />;
      case 'DOWN':
        return <Error color="error" />;
      default:
        return <Warning color="warning" />;
    }
  };

  const getStatusColor = (status: any) => {
    if (!status) return 'warning';
    
    switch (status.status) {
      case 'HEALTHY':
        return 'success';
      case 'DEGRADED':
        return 'warning';
      case 'DOWN':
        return 'error';
      default:
        return 'warning';
    }
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}/1K tokens`;
  };

  const formatResponseTime = (time: number) => {
    return `${(time / 1000).toFixed(1)}s`;
  };

  const getOptimizationScore = (provider: any, criteria: string) => {
    switch (criteria) {
      case 'QUALITY':
        return provider.qualityScore * 10;
      case 'COST':
        return (1 - (provider.costPer1KTokens / 0.06)) * 100;
      case 'SPEED':
        return (1 - (provider.averageResponseTime / 10000)) * 100;
      default:
        // Balanced score
        const qualityScore = provider.qualityScore * 10;
        const costScore = (1 - (provider.costPer1KTokens / 0.06)) * 100;
        const speedScore = (1 - (provider.averageResponseTime / 10000)) * 100;
        return (qualityScore * 0.4 + costScore * 0.3 + speedScore * 0.3);
    }
  };

  const renderProviderCard = (provider: any) => {
    const status = providerStatuses[provider.name];
    const score = getOptimizationScore(provider, optimizationCriteria);
    const isRecommended = Array.isArray(recommendations)
      ? recommendations.some(rec => rec.providerName === provider.name)
      : false;

    return (
      <Card
        key={provider.name}
        sx={{
          cursor: 'pointer',
          border: selectedProvider === provider.name ? 2 : 1,
          borderColor: selectedProvider === provider.name ? 'primary.main' : 'divider',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: 2
          }
        }}
        onClick={() => onProviderSelect(provider.name)}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {provider.name}
            </Typography>
            {isRecommended && (
              <Chip
                label="Recommended"
                color="primary"
                size="small"
                sx={{ mr: 1 }}
              />
            )}
            <Tooltip title={status?.status || 'Unknown'}>
              {getStatusIcon(status)}
            </Tooltip>
          </Box>

          {/* Provider Metrics */}
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Star color="primary" fontSize="small" />
                <Typography variant="caption" display="block">
                  Quality
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {provider.qualityScore}/10
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <AttachMoney color="primary" fontSize="small" />
                <Typography variant="caption" display="block">
                  Cost
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatCost(provider.costPer1KTokens)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Speed color="primary" fontSize="small" />
                <Typography variant="caption" display="block">
                  Speed
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatResponseTime(provider.averageResponseTime)}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Optimization Score */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption">
                {optimizationCriteria} Score
              </Typography>
              <Typography variant="caption">
                {Math.round(score)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, Math.max(0, score))}
              color={score > 80 ? 'success' : score > 60 ? 'warning' : 'error'}
            />
          </Box>

          {/* Status and Response Time */}
          {status && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Chip
                label={status.status}
                color={getStatusColor(status)}
                size="small"
                variant="outlined"
              />
              {status.responseTimeMs && (
                <Typography variant="caption" color="text.secondary">
                  Last check: {formatResponseTime(status.responseTimeMs)}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Box sx={sx}>
        <Typography variant="subtitle2" gutterBottom>
          AI Provider Selection
        </Typography>
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={4} key={i}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={sx}>
        Failed to load AI providers: {error}
      </Alert>
    );
  }

  return (
    <Box sx={sx}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          AI Provider Selection
        </Typography>
        <Tooltip title="Provider information and real-time status">
          <IconButton size="small" onClick={() => setShowDetails(!showDetails)}>
            <Info />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Quick Selection Dropdown */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Select Provider</InputLabel>
        <Select
          value={selectedProvider}
          onChange={(e) => onProviderSelect(e.target.value)}
          label="Select Provider"
        >
          <MenuItem value="">
            <em>Auto-select (Recommended)</em>
          </MenuItem>
          {providers.map((provider) => (
            <MenuItem key={provider.name} value={provider.name}>
              {provider.name}
              {Array.isArray(recommendations) && recommendations.some(rec => rec.providerName === provider.name) && (
                <Chip label="★" size="small" sx={{ ml: 1 }} />
              )}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Detailed Provider Cards */}
      {showDetails && (
        <Grid container spacing={2}>
          {providers.map((provider) => (
            <Grid item xs={12} sm={6} md={4} key={provider.name}>
              {renderProviderCard(provider)}
            </Grid>
          ))}
        </Grid>
      )}

      {/* Recommendations */}
      {Array.isArray(recommendations) && recommendations.length > 0 && !showDetails && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            Recommended for {optimizationCriteria.toLowerCase()} optimization:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {recommendations.slice(0, 3).map((rec) => (
              <Tooltip key={rec.providerName} title={rec.reason}>
                <Chip
                  label={`${rec.providerName} (${Math.round(rec.score)}%)`}
                  onClick={() => onProviderSelect(rec.providerName)}
                  color={selectedProvider === rec.providerName ? 'primary' : 'default'}
                  variant={selectedProvider === rec.providerName ? 'filled' : 'outlined'}
                  size="small"
                />
              </Tooltip>
            ))}
          </Box>
        </Box>
      )}

      {/* Auto-selection Info */}
      {!selectedProvider && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Auto-selection will choose the optimal provider based on your optimization criteria and current availability.
        </Alert>
      )}
    </Box>
  );
};

export default AIProviderSelector;