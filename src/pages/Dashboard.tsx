import {
  Analytics,
  AutoAwesome,
  CalendarToday,
  Description,
  Image,
  Notifications,
  Refresh,
  Schedule,
  Settings,
  ThumbUp,
  TrendingDown,
  TrendingUp,
  Visibility
} from '@mui/icons-material'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  Typography
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts'
import { useAuth } from '../hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    recentActivity,
    upcomingPosts,
    performanceData,
    quickStats,
    error,
    isLoading,
    loadDashboardData,
    refreshDashboard
  } = useDashboard()

  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Debug logging to track data
  useEffect(() => {
    console.log('🔍 Dashboard Debug Info:')
    console.log('- isLoading:', isLoading)
    console.log('- error:', error)
    console.log('- quickStats:', quickStats)
    console.log('- performanceData:', performanceData)
    console.log('- recentActivity:', recentActivity)
    console.log('- upcomingPosts:', upcomingPosts)
  }, [isLoading, error, quickStats, performanceData, recentActivity, upcomingPosts])

  const handleRefresh = async () => {
    setRefreshing(true)
    refreshDashboard()
    setRefreshing(false)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp color="success" fontSize="small" />
    if (change < 0) return <TrendingDown color="error" fontSize="small" />
    return null
  }

  const renderMetricCard = (title: string, value: number, change: number, icon: React.ReactElement) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4">
              {formatNumber(value)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {getTrendIcon(change)}
              <Typography
                variant="body2"
                color={change >= 0 ? 'success.main' : 'error.main'}
                sx={{ ml: 0.5 }}
              >
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                vs last month
              </Typography>
            </Box>
          </Box>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading dashboard...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={handleRefresh}>
          Retry
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Welcome back, {user?.firstName || user?.username}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your content today
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh dashboard">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => navigate('/settings')}
          >
            Settings
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Total Reach',
            quickStats?.[0]?.totalReach || 0,
            quickStats?.[0]?.reachChange || 0,
            <Visibility />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Engagement',
            quickStats?.[1]?.totalEngagement || 0,
            quickStats?.[1]?.engagementChange || 0,
            <ThumbUp />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Content Created',
            quickStats?.[2]?.contentCreated || 0,
            quickStats?.[2]?.contentChange || 0,
            <Description />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Posts Scheduled',
            quickStats?.[3]?.postsScheduled || 0,
            quickStats?.[3]?.scheduledChange || 0,
            <Schedule />
          )}
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Performance Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Performance Overview
                </Typography>
                <Button size="small" onClick={() => navigate('/analytics')}>
                  View Details
                </Button>
              </Box>

              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area
                      type="monotone"
                      dataKey="engagement"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="reach"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AutoAwesome />}
                    onClick={() => navigate('/content/create')}
                    sx={{ mb: 1 }}
                  >
                    Generate Content
                  </Button>
                </Grid>

                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Schedule />}
                    onClick={() => navigate('/social/calendar')}
                  >
                    Schedule Post
                  </Button>
                </Grid>

                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Image />}
                    onClick={() => navigate('/media/generator')}
                  >
                    Generate Image
                  </Button>
                </Grid>

                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Analytics />}
                    onClick={() => navigate('/analytics')}
                  >
                    View Analytics
                  </Button>
                </Grid>

                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Description />}
                    onClick={() => navigate('/templates')}
                  >
                    Browse Templates
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Posts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Upcoming Posts
                </Typography>
                <Button size="small" onClick={() => navigate('/social/queue')}>
                  View All
                </Button>
              </Box>

              {upcomingPosts?.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Schedule sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No upcoming posts scheduled
                  </Typography>
                </Box>
              ) : (
                <List>
                  {upcomingPosts?.slice(0, 5).map((post, index) => (
                    <ListItem key={index} divider>
                      <ListItemAvatar>
                        <Avatar>
                          <CalendarToday />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={post.title}
                        secondary={`${post.platform} • ${new Date(post.scheduledAt).toLocaleString()}`}
                      />
                      <Chip
                        label={post.status}
                        size="small"
                        color={post.status === 'scheduled' ? 'primary' : 'default'}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>

              {recentActivity?.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No recent activity
                  </Typography>
                </Box>
              ) : (
                <List>
                  {recentActivity?.slice(0, 5).map((activity, index) => (
                    <ListItem key={index} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: activity.type === 'content_created' ? 'success.main' : 'primary.main' }}>
                          {activity.type === 'content_created' ? <Description /> : <Schedule />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.title}
                        secondary={activity.description}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {activity.timestamp}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard