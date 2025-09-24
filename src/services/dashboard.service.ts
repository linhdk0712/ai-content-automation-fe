import { api } from './api'

export interface DashboardDataResponse {
  totalContent: number
  publishedContent: number
  draftContent: number
  scheduledContent: number
  performanceData: any[]
  quickStats: any[]
  recentActivity: any[]
  upcomingPosts: any[]
}

class DashboardService {
  async getDashboardData(userId: number, timeRange: string = '30d'): Promise<DashboardDataResponse> {
    try {
      const response = await api.get(`/dashboard?userId=${userId}&timeRange=${timeRange}`)
      return response.data as DashboardDataResponse
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      throw error
    }
  }

  async getQuickStats(userId: number): Promise<any[]> {
    try {
      const response = await api.get(`/dashboard/quick-stats?userId=${userId}`)
      return response.data as any[]
    } catch (error) {
      console.error('Error fetching quick stats:', error)
      throw error
    }
  }

  async getRecentActivity(userId: number, limit: number = 10): Promise<any[]> {
    try {
      const response = await api.get(`/dashboard/recent-activity?userId=${userId}&limit=${limit}`)
      return response.data as any[]
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      throw error
    }
  }

  async getUpcomingPosts(userId: number): Promise<any[]> {
    try {
      const response = await api.get(`/dashboard/upcoming-posts?userId=${userId}`)
      return response.data as any[]
    } catch (error) {
      console.error('Error fetching upcoming posts:', error)
      throw error
    }
  }

  async getPerformanceData(userId: number, timeRange: string = '30d'): Promise<any[]> {
    try {
      const response = await api.get(`/dashboard/performance?userId=${userId}&timeRange=${timeRange}`)
      return response.data as any[]
    } catch (error) {
      console.error('Error fetching performance data:', error)
      throw error
    }
  }
}

export const dashboardService = new DashboardService()
