import { useCallback, useEffect, useState } from 'react'
import { dashboardService } from '../services/dashboard.service'
import { useAnalytics } from './useAnalytics'
import { useAuth } from './useAuth'
import { useNotifications } from './useNotifications'

// Dashboard data types
export interface DashboardStats {
  totalContent: number
  publishedContent: number
  draftContent: number
  scheduledContent: number
  totalViews: number
  totalEngagement: number
  conversionRate: number
  revenue: number
}

export interface RecentActivity {
  id: string
  type: 'content_created' | 'content_published' | 'content_scheduled' | 'user_registered'
  title: string
  description: string
  timestamp: string
  user?: {
    name: string
    avatar?: string
  }
}

export interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  path: string
  color: string
}

export interface DashboardData {
  stats: DashboardStats
  recentActivity: RecentActivity[]
  quickActions: QuickAction[]
  performanceMetrics: {
    contentPerformance: Array<{
      id: string
      title: string
      views: number
      engagement: number
      conversionRate: number
    }>
    audienceGrowth: Array<{
      date: string
      followers: number
      engagement: number
    }>
  }
  loadDashboardData: () => Promise<void>
  upcomingPosts: any[]
  performanceData: any[]
  quickStats: any[]
}

export interface DashboardReturn {
  dashboardData: DashboardData | null
  isLoading: boolean
  error: string | null
  refreshDashboard: () => void
  stats?: DashboardStats
  recentActivity?: RecentActivity[]
  quickActions?: QuickAction[]
  performanceMetrics?: DashboardData['performanceMetrics']
  unreadNotifications: number
  upcomingPosts: any[]
  performanceData: any[]
  quickStats: any[]
  loadDashboardData: () => Promise<void>
}

export const useDashboard = (): DashboardReturn => {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useAnalytics()
  const { unreadCount } = useNotifications()

  // API service for dashboard data

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      
      // Fetch dashboard data from API
      const dashboardResponse = await dashboardService.getDashboardData(user.id, '30d')
      
      // Transform API response to match expected format
      const transformedData: DashboardData = {
        stats: {
          totalContent: dashboardResponse.totalContent || 0,
          publishedContent: dashboardResponse.publishedContent || 0,
          draftContent: dashboardResponse.draftContent || 0,
          scheduledContent: dashboardResponse.scheduledContent || 0,
          totalViews: 0, // Will be calculated from performance data
          totalEngagement: 0, // Will be calculated from performance data
          conversionRate: 0, // Will be calculated from performance data
          revenue: 0 // Will be calculated from performance data
        },
        recentActivity: dashboardResponse.recentActivity || [],
        quickActions: [
          {
            id: 'create-content',
            title: 'Create Content',
            description: 'Generate new content using AI',
            icon: 'create',
            path: '/content/create',
            color: '#1976d2'
          },
          {
            id: 'schedule-post',
            title: 'Schedule Post',
            description: 'Schedule content for later',
            icon: 'schedule',
            path: '/content/schedule',
            color: '#388e3c'
          },
          {
            id: 'view-analytics',
            title: 'View Analytics',
            description: 'Check performance metrics',
            icon: 'analytics',
            path: '/analytics',
            color: '#f57c00'
          },
          {
            id: 'manage-templates',
            title: 'Manage Templates',
            description: 'Create and edit templates',
            icon: 'template',
            path: '/templates',
            color: '#7b1fa2'
          }
        ],
        performanceMetrics: {
          contentPerformance: [],
          audienceGrowth: []
        },
        loadDashboardData: fetchDashboardData,
        upcomingPosts: dashboardResponse.upcomingPosts || [],
        performanceData: dashboardResponse.performanceData || [],
        quickStats: dashboardResponse.quickStats || []
      }
      
      setDashboardData(transformedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  const refreshDashboard = useCallback(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user, fetchDashboardData])

  return {
    dashboardData,
    isLoading,
    error,
    refreshDashboard,
    // Additional dashboard-specific functionality
    stats: dashboardData?.stats,
    recentActivity: dashboardData?.recentActivity,
    quickActions: dashboardData?.quickActions,
    performanceMetrics: dashboardData?.performanceMetrics,
    unreadNotifications: unreadCount,
    upcomingPosts: dashboardData?.upcomingPosts,
    performanceData: dashboardData?.performanceData,
    quickStats: dashboardData?.quickStats,
    loadDashboardData: fetchDashboardData
  } as DashboardReturn
}
