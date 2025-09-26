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
    <Card sx={{
      height: '100%',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
      }
    }}>
      <CardContent sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%'
        }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              color="textSecondary"
              gutterBottom
              variant="body2"
              sx={{
                fontWeight: 500,
                mb: 1,
                fontSize: '0.75rem'
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 1.5,
                fontSize: { xs: '1.25rem', md: '1.5rem' }
              }}
            >
              {formatNumber(value)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getTrendIcon(change)}
              <Typography
                variant="caption"
                color={change >= 0 ? 'success.main' : 'error.main'}
                sx={{
                  ml: 0.5,
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              >
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  ml: 1,
                  fontSize: '0.7rem'
                }}
              >
                vs last month
              </Typography>
            </Box>
          </Box>
          <Avatar sx={{
            bgcolor: 'primary.main',
            width: { xs: 48, md: 56 },
            height: { xs: 48, md: 56 },
            ml: 2
          }}>
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
    <Box sx={{
      px: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
      py: { xs: 1, sm: 1.5, md: 2 },
      maxWidth: '1600px',
      mx: 'auto',
      width: '100%',
      minHeight: 'calc(100vh - 64px)'
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: { xs: 1.5, md: 2 },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}>
        <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: 700,
              mb: 1,
              fontSize: { xs: '1.5rem', md: '1.75rem' }
            }}
          >
            Welcome back, {user?.firstName || user?.username}!
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.85rem', md: '0.9rem' } }}
          >
            Here's what's happening with your content today
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Tooltip title="Refresh dashboard">
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                bgcolor: 'background.paper',
                boxShadow: 1,
                '&:hover': { boxShadow: 2 }
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => navigate('/settings')}
            sx={{
              borderRadius: 2,
              px: 3
            }}
          >
            Settings
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }} sx={{ mb: { xs: 1.5, md: 2 } }}>
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

      <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }}>
        {/* Performance Chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{
            height: 'fit-content',
            mr: { lg: 1 }
          }}>
            <CardContent sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1.5
              }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    fontSize: '1rem'
                  }}
                >
                  Performance Overview
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/analytics')}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none'
                  }}
                >
                  View Details
                </Button>
              </Box>

              <Box sx={{ height: { xs: 180, md: 220 }, mt: 1 }}>
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
          <Card sx={{
            height: 'fit-content',
            ml: { lg: 1 }
          }}>
            <CardContent sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 1.5,
                  fontSize: '1rem'
                }}
              >
                Quick Actions
              </Typography>

              <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AutoAwesome />}
                    onClick={() => navigate('/content/create')}
                    sx={{
                      py: 1,
                      borderRadius: 2,
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                      }
                    }}
                  >
                    Generate Content
                  </Button>
                </Grid>

                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Schedule fontSize="small" />}
                    onClick={() => navigate('/social/calendar')}
                    sx={{
                      py: 1,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.8rem'
                    }}
                  >
                    Schedule Post
                  </Button>
                </Grid>

                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Image fontSize="small" />}
                    onClick={() => navigate('/media/generator')}
                    sx={{
                      py: 1,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.8rem'
                    }}
                  >
                    Generate Image
                  </Button>
                </Grid>

                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Analytics fontSize="small" />}
                    onClick={() => navigate('/analytics')}
                    sx={{
                      py: 1,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.8rem'
                    }}
                  >
                    View Analytics
                  </Button>
                </Grid>

                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Description fontSize="small" />}
                    onClick={() => navigate('/templates')}
                    sx={{
                      py: 1,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.8rem'
                    }}
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
          <Card sx={{
            height: 'fit-content',
            mr: { md: 1 }
          }}>
            <CardContent sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1.5
              }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    fontSize: '1rem'
                  }}
                >
                  Upcoming Posts
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/social/queue')}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none'
                  }}
                >
                  View All
                </Button>
              </Box>

              {upcomingPosts?.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Schedule sx={{
                    fontSize: 40,
                    color: 'text.secondary',
                    mb: 1,
                    opacity: 0.7
                  }} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: '0.85rem' }}
                  >
                    No upcoming posts scheduled
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {upcomingPosts?.slice(0, 5).map((post, index) => (
                    <ListItem
                      key={index}
                      divider={index < 4}
                      sx={{
                        px: 0,
                        py: 1,
                        '&:last-child': {
                          borderBottom: 'none'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                          <CalendarToday fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              mb: 0.5,
                              fontSize: '0.85rem'
                            }}
                          >
                            {post.title}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: '0.75rem' }}
                          >
                            {post.platform} • {new Date(post.scheduledAt).toLocaleString()}
                          </Typography>
                        }
                      />
                      <Chip
                        label={post.status}
                        size="small"
                        color={post.status === 'scheduled' ? 'primary' : 'default'}
                        sx={{ ml: 1 }}
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
          <Card sx={{
            height: 'fit-content',
            ml: { md: 1 }
          }}>
            <CardContent sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 1.5,
                  fontSize: '1rem'
                }}
              >
                Recent Activity
              </Typography>

              {recentActivity?.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Notifications sx={{
                    fontSize: 40,
                    color: 'text.secondary',
                    mb: 1,
                    opacity: 0.7
                  }} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: '0.85rem' }}
                  >
                    No recent activity
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {recentActivity?.slice(0, 5).map((activity, index) => (
                    <ListItem
                      key={index}
                      divider={index < 4}
                      sx={{
                        px: 0,
                        py: 1,
                        '&:last-child': {
                          borderBottom: 'none'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{
                          bgcolor: activity.type === 'content_created' ? 'success.main' : 'primary.main',
                          width: 36,
                          height: 36
                        }}>
                          {activity.type === 'content_created' ? <Description fontSize="small" /> : <Schedule fontSize="small" />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              mb: 0.5,
                              fontSize: '0.85rem'
                            }}
                          >
                            {activity.title}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: '0.75rem' }}
                          >
                            {activity.description}
                          </Typography>
                        }
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          ml: 1,
                          fontSize: '0.7rem'
                        }}
                      >
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