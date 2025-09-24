import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Insights,
  Star,
  AccessTime,
  BarChart,
} from '@mui/icons-material';
import { useOptimalTimes, useAudienceInsights } from '../../hooks/useScheduling';
import { OptimalTimeRecommendation, AudienceInsight } from '../../types/scheduling';

interface OptimalTimeAnalyzerProps {
  open: boolean;
  onClose: () => void;
  platforms: string[];
}

const OptimalTimeAnalyzer: React.FC<OptimalTimeAnalyzerProps> = ({
  open,
  onClose,
  platforms: initialPlatforms,
}) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(initialPlatforms);
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');

  const { data: optimalTimes, isLoading: loadingOptimalTimes } = useOptimalTimes(selectedPlatforms);
  const { data: audienceInsights, isLoading: loadingInsights } = useAudienceInsights(selectedPlatforms);

  const availablePlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'];
  const timezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ];

  const topRecommendations = useMemo(() => {
    if (!optimalTimes) return [];
    return optimalTimes
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [optimalTimes]);

  const platformInsights = useMemo(() => {
    if (!audienceInsights) return {};
    return audienceInsights.reduce((acc, insight) => {
      acc[insight.platform] = insight;
      return acc;
    }, {} as Record<string, AudienceInsight>);
  }, [audienceInsights]);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: selectedTimezone,
    }).format(date);
  };

  const formatDay = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      timeZone: selectedTimezone,
    }).format(date);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const renderPlatformCard = (platform: string, insight?: AudienceInsight) => (
    <Card key={platform} sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ textTransform: 'capitalize', flexGrow: 1 }}>
            {platform}
          </Typography>
          {insight && (
            <Chip
              label={`${insight.engagementRate.toFixed(1)}%`}
              color="primary"
              size="small"
            />
          )}
        </Box>

        {insight && (
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Peak Hours
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {insight.peakHours.map(hour => (
                  <Chip
                    key={hour}
                    label={`${hour}:00`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Audience Size
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <People fontSize="small" />
                <Typography variant="body2">
                  {insight.audienceSize.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Top Locations
              </Typography>
              {Object.entries(insight.demographics.locations)
                .slice(0, 3)
                .map(([location, percentage]) => (
                  <Box key={location} display="flex" justifyContent="space-between">
                    <Typography variant="caption">{location}</Typography>
                    <Typography variant="caption">{percentage}%</Typography>
                  </Box>
                ))}
            </Box>
          </Stack>
        )}
      </CardContent>
    </Card>
  );

  const renderRecommendationItem = (recommendation: OptimalTimeRecommendation, index: number) => (
    <ListItem key={index} divider>
      <ListItemIcon>
        <Box display="flex" alignItems="center" gap={1}>
          <Star color={index < 3 ? 'primary' : 'disabled'} />
          <Typography variant="h6" color="primary">
            #{index + 1}
          </Typography>
        </Box>
      </ListItemIcon>
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
              {recommendation.platform}
            </Typography>
            <Chip
              label={`${recommendation.score}/100`}
              color={getScoreColor(recommendation.score)}
              size="small"
            />
          </Box>
        }
        secondary={
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <AccessTime fontSize="small" />
              <Typography variant="body2">
                {formatDay(recommendation.time)} at {formatTime(recommendation.time)}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {recommendation.reasoning}
            </Typography>
            <Box display="flex" gap={2}>
              <Typography variant="caption">
                Audience: {recommendation.audienceSize.toLocaleString()}
              </Typography>
              <Typography variant="caption">
                Engagement: {recommendation.engagementRate.toFixed(1)}%
              </Typography>
            </Box>
          </Stack>
        }
      />
    </ListItem>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Insights />
          Optimal Time Analyzer
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          {/* Controls */}
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Platforms</InputLabel>
                  <Select
                    multiple
                    value={selectedPlatforms}
                    onChange={(e) => setSelectedPlatforms(e.target.value as string[])}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                    title="Platforms"
                  >
                    {availablePlatforms.map((platform) => (
                      <MenuItem key={platform} value={platform}>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={selectedTimezone}
                    onChange={(e) => setSelectedTimezone(e.target.value)}
                    title="Timezone"
                  >
                    {timezones.map((tz) => (
                      <MenuItem key={tz} value={tz}>
                        {tz}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Loading States */}
          {(loadingOptimalTimes || loadingInsights) && (
            <Box>
              <Typography variant="body2" gutterBottom>
                Analyzing audience data and engagement patterns...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {/* Top Recommendations */}
          {topRecommendations.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                <Box display="flex" alignItems="center" gap={1}>
                  <TrendingUp />
                  Top Recommendations
                </Box>
              </Typography>
              <List>
                {topRecommendations.map((recommendation, index) =>
                  renderRecommendationItem(recommendation, index)
                )}
              </List>
            </Paper>
          )}

          {/* Platform Insights */}
          {selectedPlatforms.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                <Box display="flex" alignItems="center" gap={1}>
                  <BarChart />
                  Platform Insights
                </Box>
              </Typography>
              <Grid container spacing={2}>
                {selectedPlatforms.map(platform =>
                  renderPlatformCard(platform, platformInsights[platform])
                )}
              </Grid>
            </Box>
          )}

          {/* AI Insights */}
          {optimalTimes && optimalTimes.length > 0 && (
            <Alert severity="info" icon={<Insights />}>
              <Typography variant="subtitle2" gutterBottom>
                AI-Powered Insights
              </Typography>
              <Typography variant="body2">
                Based on your audience data, the best times to post are during weekday evenings 
                and weekend mornings. Consider your audience's timezone and adjust accordingly.
              </Typography>
            </Alert>
          )}

          {/* No Data State */}
          {!loadingOptimalTimes && !loadingInsights && selectedPlatforms.length === 0 && (
            <Alert severity="warning">
              Please select at least one platform to analyze optimal posting times.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" disabled={selectedPlatforms.length === 0}>
          Apply Recommendations
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OptimalTimeAnalyzer;