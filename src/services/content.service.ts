import {
  AIGenerationRequest,
  AIGenerationResponse,
  ApiError,
  BulkDeleteRequest,
  BulkOperationResponse,
  BulkPublishRequest,
  BulkScheduleRequest,
  ContentAnalysisRequest,
  ContentAnalysisResponse,
  ContentExportRequest,
  ContentExportResponse,
  ContentLibraryRequest,
  ContentLibraryStatsResponse,
  ContentPerformanceResponse,
  ContentPreviewRequest,
  ContentPreviewResponse,
  ContentResponse,
  ContentSearchRequest,
  ContentStatus,
  ContentTagResponse,
  ContentType,
  CreateContentRequest,
  DuplicateContentRequest,
  EngagementMetricsResponse,
  PaginatedResponse,
  PublishContentRequest,
  PublishResponse,
  RegenerateContentRequest,
  ResponseBase,
  ScheduleContentRequest,
  ScheduleResponse,
  UpdateContentRequest
} from '../types/api.types'
import { apiRequest } from './api'
import { toastService } from './toast.service'

// Loading state management
export interface LoadingState {
  isLoading: boolean
  operation?: string
  progress?: number
}

// Service response wrapper for better error handling
export interface ServiceResponse<T> {
  data?: T
  error?: ApiError
  loading: boolean
}

// Content filter interface for listing
export interface ContentFilter {
  status?: ContentStatus[]
  type?: ContentType[]
  userId?: string
  workspaceId?: string
  aiGenerated?: boolean
  dateRange?: {
    start: string
    end: string
  }
  search?: string
  tags?: string[]
}

export class ContentService {
  // Basic CRUD Operations with enhanced error handling and loading states
  async createContent(request: CreateContentRequest): Promise<ContentResponse> {
    try {
      const result = await apiRequest.post<ContentResponse>('/content', request)

      // Show success toast
      toastService.success('Content created successfully!', {
        title: 'Content Created'
      })

      return result
    } catch (error) {
      console.error('Failed to create content:', error)

      // Show error toast
      toastService.error(
        error instanceof Error ? error.message : 'Failed to create content. Please try again.',
        {
          title: 'Create Failed'
        }
      )

      throw error
    }
  }

  async getContent(id: number, workspaceId?: number): Promise<ContentResponse> {
    try {
      const params = new URLSearchParams()
      if (workspaceId) {
        params.append('workspaceId', workspaceId.toString())
      }

      const url = `/content/${id}${params.toString() ? `?${params.toString()}` : ''}`
      return await apiRequest.get<ContentResponse>(url)
    } catch (error) {
      console.error(`Failed to get content ${id}:`, error)
      throw error
    }
  }

  async updateContent(id: number, request: UpdateContentRequest): Promise<ContentResponse> {
    try {
      const result = await apiRequest.put<ContentResponse>(`/content/${id}`, request)

      // Show success toast
      toastService.success('Content updated successfully!', {
        title: 'Content Updated'
      })

      return result
    } catch (error) {
      console.error(`Failed to update content ${id}:`, error)

      // Show error toast
      toastService.error(
        error instanceof Error ? error.message : 'Failed to update content. Please try again.',
        {
          title: 'Update Failed'
        }
      )

      throw error
    }
  }

  async deleteContent(id: number, workspaceId?: number): Promise<void> {
    try {
      const params = new URLSearchParams()
      if (workspaceId) {
        params.append('workspaceId', workspaceId.toString())
      }

      const url = `/content/${id}${params.toString() ? `?${params.toString()}` : ''}`
      await apiRequest.delete<void>(url)

      // Show success toast
      toastService.success('Content deleted successfully!', {
        title: 'Content Deleted'
      })
    } catch (error) {
      console.error(`Failed to delete content ${id}:`, error)

      // Show error toast
      toastService.error(
        error instanceof Error ? error.message : 'Failed to delete content. Please try again.',
        {
          title: 'Delete Failed'
        }
      )

      throw error
    }
  }

  async listContent(
    filter?: ContentFilter,
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<ContentResponse>> {
    try {
      const params = new URLSearchParams()

      // Add pagination parameters
      params.append('page', page.toString())
      params.append('size', size.toString())

      // Add filter parameters
      if (filter) {
        if (filter.status && filter.status.length > 0) {
          params.append('status', filter.status.join(','))
        }
        if (filter.type && filter.type.length > 0) {
          params.append('type', filter.type.join(','))
        }
        if (filter.workspaceId) {
          params.append('workspaceId', filter.workspaceId)
        }
        if (filter.aiGenerated !== undefined) {
          params.append('aiGenerated', filter.aiGenerated.toString())
        }
        if (filter.search) {
          params.append('search', filter.search)
        }
        if (filter.tags && filter.tags.length > 0) {
          params.append('tags', filter.tags.join(','))
        }
        if (filter.dateRange) {
          params.append('startDate', filter.dateRange.start)
          params.append('endDate', filter.dateRange.end)
        }
      }

      return await apiRequest.get<PaginatedResponse<ContentResponse>>(`/content?${params.toString()}`)
    } catch (error) {
      console.error('Failed to list content:', error)
      throw error
    }
  }

  // AI Generation with async support
  async generateWithAI(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    try {
      return await apiRequest.post<AIGenerationResponse>('/content/generate', request)
    } catch (error) {
      console.error('Failed to generate content with AI:', error)
      throw error
    }
  }

  async regenerateContent(id: number, request: RegenerateContentRequest): Promise<AIGenerationResponse> {
    try {
      return await apiRequest.post<AIGenerationResponse>(`/content/${id}/regenerate`, request)
    } catch (error) {
      console.error(`Failed to regenerate content ${id}:`, error)
      throw error
    }
  }

  // Check AI generation status
  async getGenerationStatus(generationId: string): Promise<AIGenerationResponse> {
    try {
      return await apiRequest.get<AIGenerationResponse>(`/content/generation/${generationId}/status`)
    } catch (error) {
      console.error(`Failed to get generation status ${generationId}:`, error)
      throw error
    }
  }

  // Enhanced Methods - Content Analysis
  async analyzeContent(id: number, request?: Partial<ContentAnalysisRequest>): Promise<ContentAnalysisResponse> {
    try {
      return await apiRequest.post<ContentAnalysisResponse>(`/content/${id}/analyze`, request || {})
    } catch (error) {
      console.error(`Failed to analyze content ${id}:`, error)
      throw error
    }
  }

  async analyzeText(text: string, analysisTypes?: string[], targetPlatforms?: string[]): Promise<ContentAnalysisResponse> {
    try {
      const request: ContentAnalysisRequest = {
        textContent: text,
        analysisTypes: analysisTypes as any,
        targetPlatforms
      }
      return await apiRequest.post<ContentAnalysisResponse>('/content/analyze-text', request)
    } catch (error) {
      console.error('Failed to analyze text:', error)
      throw error
    }
  }

  // Enhanced Methods - Content Preview
  async getContentPreview(id: number, platforms?: string[], customizations?: Record<string, any>): Promise<ContentPreviewResponse> {
    try {
      const request: ContentPreviewRequest = {
        platforms: platforms || ['facebook', 'twitter', 'instagram', 'linkedin'],
        customizations
      }
      return await apiRequest.post<ContentPreviewResponse>(`/content/${id}/preview`, request)
    } catch (error) {
      console.error(`Failed to get content preview ${id}:`, error)
      throw error
    }
  }

  async generatePreview(textContent: string, platforms: string[], customizations?: Record<string, any>): Promise<ContentPreviewResponse> {
    try {
      const request: ContentPreviewRequest = {
        textContent,
        platforms,
        customizations
      }
      return await apiRequest.post<ContentPreviewResponse>('/content/preview', request)
    } catch (error) {
      console.error('Failed to generate preview:', error)
      throw error
    }
  }

  // Enhanced Methods - Content Optimization (Note: These endpoints may not exist yet in backend)
  async optimizeContent(id: number, targetPlatforms?: string[]): Promise<any> {
    try {
      return await apiRequest.post(`/content/${id}/optimize`, {
        targetPlatforms
      })
    } catch (error) {
      console.error(`Failed to optimize content ${id}:`, error)
      throw error
    }
  }

  async optimizeText(text: string, targetPlatforms?: string[]): Promise<any> {
    try {
      return await apiRequest.post('/content/optimize-text', {
        text,
        targetPlatforms
      })
    } catch (error) {
      console.error('Failed to optimize text:', error)
      throw error
    }
  }

  // Content Collaboration (Note: These endpoints may not exist yet in backend)
  async addCollaborator(contentId: number, userId: number, role: string): Promise<void> {
    try {
      await apiRequest.post(`/content/${contentId}/collaborators`, {
        userId,
        role
      })
    } catch (error) {
      console.error(`Failed to add collaborator to content ${contentId}:`, error)
      throw error
    }
  }

  async removeCollaborator(contentId: number, userId: number): Promise<void> {
    try {
      await apiRequest.delete(`/content/${contentId}/collaborators/${userId}`)
    } catch (error) {
      console.error(`Failed to remove collaborator from content ${contentId}:`, error)
      throw error
    }
  }

  async getCollaborators(contentId: number): Promise<any[]> {
    try {
      return await apiRequest.get(`/content/${contentId}/collaborators`)
    } catch (error) {
      console.error(`Failed to get collaborators for content ${contentId}:`, error)
      throw error
    }
  }

  // Content Scheduling
  async scheduleContent(id: number, request: ScheduleContentRequest): Promise<ScheduleResponse> {
    try {
      return await apiRequest.post<ScheduleResponse>(`/content/${id}/schedule`, request)
    } catch (error) {
      console.error(`Failed to schedule content ${id}:`, error)
      throw error
    }
  }

  async unscheduleContent(id: number): Promise<void> {
    try {
      await apiRequest.post(`/content/${id}/unschedule`)
    } catch (error) {
      console.error(`Failed to unschedule content ${id}:`, error)
      throw error
    }
  }

  async getScheduledContent(workspaceId?: number): Promise<ScheduleResponse[]> {
    try {
      const params = new URLSearchParams()
      if (workspaceId) {
        params.append('workspaceId', workspaceId.toString())
      }

      const url = `/content/scheduled${params.toString() ? `?${params.toString()}` : ''}`
      return await apiRequest.get<ScheduleResponse[]>(url)
    } catch (error) {
      console.error('Failed to get scheduled content:', error)
      throw error
    }
  }

  // Content Publishing
  async publishContent(id: number, request: PublishContentRequest): Promise<PublishResponse> {
    try {
      return await apiRequest.post<PublishResponse>(`/content/${id}/publish`, request)
    } catch (error) {
      console.error(`Failed to publish content ${id}:`, error)
      throw error
    }
  }

  async getPublishingStatus(id: number): Promise<PublishResponse> {
    try {
      return await apiRequest.get<PublishResponse>(`/content/${id}/publishing-status`)
    } catch (error) {
      console.error(`Failed to get publishing status for content ${id}:`, error)
      throw error
    }
  }

  async getPublishHistory(id: number): Promise<PublishResponse[]> {
    try {
      return await apiRequest.get<PublishResponse[]>(`/content/${id}/publish-history`)
    } catch (error) {
      console.error(`Failed to get publish history for content ${id}:`, error)
      throw error
    }
  }

  // Content Performance and Analytics
  async getContentPerformance(id: number, timeRange = '30d'): Promise<ContentPerformanceResponse> {
    try {
      const params = new URLSearchParams()
      params.append('timeRange', timeRange)

      return await apiRequest.get<ContentPerformanceResponse>(`/content/${id}/performance?${params.toString()}`)
    } catch (error) {
      console.error(`Failed to get content performance ${id}:`, error)
      throw error
    }
  }

  async getEngagementMetrics(id: number, platform?: string): Promise<EngagementMetricsResponse> {
    try {
      const params = new URLSearchParams()
      if (platform) {
        params.append('platform', platform)
      }

      return await apiRequest.get<EngagementMetricsResponse>(`/content/${id}/engagement?${params.toString()}`)
    } catch (error) {
      console.error(`Failed to get engagement metrics ${id}:`, error)
      throw error
    }
  }

  async getContentInsights(id: number): Promise<any> {
    try {
      return await apiRequest.get(`/content/${id}/insights`)
    } catch (error) {
      console.error(`Failed to get content insights ${id}:`, error)
      throw error
    }
  }

  // Content Templates (Note: These endpoints may not exist yet in backend)
  async saveAsTemplate(id: number, templateName: string, description?: string): Promise<any> {
    try {
      return await apiRequest.post(`/content/${id}/save-as-template`, {
        name: templateName,
        description
      })
    } catch (error) {
      console.error(`Failed to save content ${id} as template:`, error)
      throw error
    }
  }

  async createFromTemplate(templateId: number, customizations?: Record<string, any>): Promise<ContentResponse> {
    try {
      return await apiRequest.post<ContentResponse>('/content/from-template', {
        templateId,
        customizations
      })
    } catch (error) {
      console.error(`Failed to create content from template ${templateId}:`, error)
      throw error
    }
  }

  // Content Export (Note: These endpoints may not exist yet in backend)
  async exportContent(id: number, format: 'pdf' | 'docx' | 'html' | 'markdown'): Promise<Blob> {
    try {
      return await apiRequest.get(`/content/${id}/export/${format}`, {
        responseType: 'blob'
      })
    } catch (error) {
      console.error(`Failed to export content ${id}:`, error)
      throw error
    }
  }

  async bulkExport(contentIds: number[], format: 'pdf' | 'docx' | 'html' | 'markdown'): Promise<Blob> {
    try {
      return await apiRequest.post('/content/bulk-export', {
        contentIds,
        format
      }, {
        responseType: 'blob'
      })
    } catch (error) {
      console.error('Failed to bulk export content:', error)
      throw error
    }
  }

  // Content Search
  async searchContent(query: string, filters?: ContentFilter, page = 0, size = 20): Promise<PaginatedResponse<ContentResponse>> {
    try {
      const params = new URLSearchParams()
      params.append('q', query)
      params.append('page', page.toString())
      params.append('size', size.toString())

      if (filters) {
        if (filters.status && filters.status.length > 0) {
          params.append('status', filters.status.join(','))
        }
        if (filters.type && filters.type.length > 0) {
          params.append('type', filters.type.join(','))
        }
        if (filters.workspaceId) {
          params.append('workspaceId', filters.workspaceId)
        }
        if (filters.aiGenerated !== undefined) {
          params.append('aiGenerated', filters.aiGenerated.toString())
        }
        if (filters.tags && filters.tags.length > 0) {
          params.append('tags', filters.tags.join(','))
        }
        if (filters.dateRange) {
          params.append('startDate', filters.dateRange.start)
          params.append('endDate', filters.dateRange.end)
        }
      }

      return await apiRequest.get<PaginatedResponse<ContentResponse>>(`/content/search?${params.toString()}`)
    } catch (error) {
      console.error('Failed to search content:', error)
      throw error
    }
  }

  // Content Duplication
  async duplicateContent(id: number, request: DuplicateContentRequest): Promise<ContentResponse> {
    try {
      return await apiRequest.post<ContentResponse>(`/content/${id}/duplicate`, request)
    } catch (error) {
      console.error(`Failed to duplicate content ${id}:`, error)
      throw error
    }
  }

  // Content Approval Workflow (Note: These endpoints may not exist yet in backend)
  async submitForReview(id: number, reviewers: number[]): Promise<void> {
    try {
      await apiRequest.post(`/content/${id}/submit-review`, {
        reviewers
      })
    } catch (error) {
      console.error(`Failed to submit content ${id} for review:`, error)
      throw error
    }
  }

  async approveContent(id: number, comments?: string): Promise<void> {
    try {
      await apiRequest.post(`/content/${id}/approve`, {
        comments
      })
    } catch (error) {
      console.error(`Failed to approve content ${id}:`, error)
      throw error
    }
  }

  async rejectContent(id: number, reason: string): Promise<void> {
    try {
      await apiRequest.post(`/content/${id}/reject`, {
        reason
      })
    } catch (error) {
      console.error(`Failed to reject content ${id}:`, error)
      throw error
    }
  }

  // Content Comments (Note: These endpoints may not exist yet in backend)
  async addComment(contentId: number, comment: string, parentId?: number): Promise<any> {
    try {
      return await apiRequest.post(`/content/${contentId}/comments`, {
        comment,
        parentId
      })
    } catch (error) {
      console.error(`Failed to add comment to content ${contentId}:`, error)
      throw error
    }
  }

  async getComments(contentId: number): Promise<any[]> {
    try {
      return await apiRequest.get(`/content/${contentId}/comments`)
    } catch (error) {
      console.error(`Failed to get comments for content ${contentId}:`, error)
      throw error
    }
  }

  async updateComment(contentId: number, commentId: number, comment: string): Promise<any> {
    try {
      return await apiRequest.put(`/content/${contentId}/comments/${commentId}`, {
        comment
      })
    } catch (error) {
      console.error(`Failed to update comment ${commentId}:`, error)
      throw error
    }
  }

  async deleteComment(contentId: number, commentId: number): Promise<void> {
    try {
      await apiRequest.delete(`/content/${contentId}/comments/${commentId}`)
    } catch (error) {
      console.error(`Failed to delete comment ${commentId}:`, error)
      throw error
    }
  }

  // Bulk Operations
  async bulkUpdateStatus(contentIds: number[], status: ContentStatus, workspaceId?: number): Promise<BulkOperationResponse> {
    try {
      return await apiRequest.post<BulkOperationResponse>('/content/bulk-update-status', {
        contentIds,
        status,
        workspaceId
      })
    } catch (error) {
      console.error('Failed to bulk update status:', error)
      throw error
    }
  }

  async bulkDelete(request: BulkDeleteRequest): Promise<BulkOperationResponse> {
    try {
      return await apiRequest.post<BulkOperationResponse>('/content/bulk/delete', request)
    } catch (error) {
      console.error('Failed to bulk delete content:', error)
      throw error
    }
  }

  async bulkPublish(request: BulkPublishRequest): Promise<BulkOperationResponse> {
    try {
      return await apiRequest.post<BulkOperationResponse>('/content/bulk/publish', request)
    } catch (error) {
      console.error('Failed to bulk publish content:', error)
      throw error
    }
  }

  async bulkSchedule(request: BulkScheduleRequest): Promise<BulkOperationResponse> {
    try {
      return await apiRequest.post<BulkOperationResponse>('/content/bulk/schedule', request)
    } catch (error) {
      console.error('Failed to bulk schedule content:', error)
      throw error
    }
  }

  // Get bulk operation status
  async getBulkOperationStatus(operationId: string): Promise<BulkOperationResponse> {
    try {
      return await apiRequest.get<BulkOperationResponse>(`/content/bulk/operation/${operationId}/status`)
    } catch (error) {
      console.error(`Failed to get bulk operation status ${operationId}:`, error)
      throw error
    }
  }

  // Content Library Operations
  async getContentLibrary(request: ContentLibraryRequest): Promise<PaginatedResponse<ContentResponse>> {
    try {
      return await apiRequest.post<PaginatedResponse<ContentResponse>>('/content-library/list', request)
    } catch (error) {
      console.error('Failed to get content library:', error)
      throw error
    }
  }

  async searchContentLibrary(request: ContentSearchRequest): Promise<PaginatedResponse<ContentResponse>> {
    try {
      return await apiRequest.post<PaginatedResponse<ContentResponse>>('/content-library/search', request)
    } catch (error) {
      console.error('Failed to search content library:', error)
      throw error
    }
  }

  async toggleFavorite(contentId: number): Promise<void> {
    try {
      await apiRequest.post(`/content-library/${contentId}/toggle-favorite`)
    } catch (error) {
      console.error(`Failed to toggle favorite for content ${contentId}:`, error)
      throw error
    }
  }

  async getUserFavorites(page = 0, size = 20, sortBy = 'updatedAt', sortDirection = 'desc'): Promise<PaginatedResponse<ContentResponse>> {
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('size', size.toString())
      params.append('sortBy', sortBy)
      params.append('sortDirection', sortDirection)

      return await apiRequest.get<PaginatedResponse<ContentResponse>>(`/content-library/favorites?${params.toString()}`)
    } catch (error) {
      console.error('Failed to get user favorites:', error)
      throw error
    }
  }

  async bulkStar(contentIds: number[]): Promise<BulkOperationResponse> {
    try {
      return await apiRequest.post<BulkOperationResponse>('/content-library/bulk/star', contentIds)
    } catch (error) {
      console.error('Failed to bulk star content:', error)
      throw error
    }
  }

  async bulkArchive(contentIds: number[]): Promise<BulkOperationResponse> {
    try {
      return await apiRequest.post<BulkOperationResponse>('/content-library/bulk/archive', contentIds)
    } catch (error) {
      console.error('Failed to bulk archive content:', error)
      throw error
    }
  }

  async bulkDeleteLibrary(contentIds: number[]): Promise<BulkOperationResponse> {
    try {
      return await apiRequest.post<BulkOperationResponse>('/content-library/bulk/delete', contentIds)
    } catch (error) {
      console.error('Failed to bulk delete content:', error)
      throw error
    }
  }

  async getLibraryStats(workspaceId?: number): Promise<ContentLibraryStatsResponse> {
    try {
      const params = new URLSearchParams()
      if (workspaceId) {
        params.append('workspaceId', workspaceId.toString())
      }

      return await apiRequest.get<ContentLibraryStatsResponse>(`/content-library/stats?${params.toString()}`)
    } catch (error) {
      console.error('Failed to get library stats:', error)
      throw error
    }
  }

  async getPopularTags(limit = 20): Promise<ContentTagResponse[]> {
    try {
      const params = new URLSearchParams()
      params.append('limit', limit.toString())

      return await apiRequest.get<ContentTagResponse[]>(`/content-library/tags/popular?${params.toString()}`)
    } catch (error) {
      console.error('Failed to get popular tags:', error)
      throw error
    }
  }

  async exportContentLibrary(request: ContentExportRequest): Promise<ContentExportResponse> {
    try {
      return await apiRequest.post<ContentExportResponse>('/content-library/export', request)
    } catch (error) {
      console.error('Failed to export content library:', error)
      throw error
    }
  }

  async getRecentContent(page = 0, size = 20): Promise<PaginatedResponse<ContentResponse>> {
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('size', size.toString())

      return await apiRequest.get<PaginatedResponse<ContentResponse>>(`/content-library/recent?${params.toString()}`)
    } catch (error) {
      console.error('Failed to get recent content:', error)
      throw error
    }
  }

  async getContentByType(contentType: ContentType, page = 0, size = 20): Promise<PaginatedResponse<ContentResponse>> {
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('size', size.toString())

      return await apiRequest.get<PaginatedResponse<ContentResponse>>(`/content-library/by-type/${contentType}?${params.toString()}`)
    } catch (error) {
      console.error(`Failed to get content by type ${contentType}:`, error)
      throw error
    }
  }

  // Content Statistics
  async getContentStatistics(workspaceId?: number): Promise<any> {
    try {
      const params = new URLSearchParams()
      if (workspaceId) {
        params.append('workspaceId', workspaceId.toString())
      }

      return await apiRequest.get(`/content/statistics?${params.toString()}`)
    } catch (error) {
      console.error('Failed to get content statistics:', error)
      throw error
    }
  }

  async getUserContentStatistics(userId: number): Promise<any> {
    try {
      return await apiRequest.get(`/content/statistics/user/${userId}`)
    } catch (error) {
      console.error(`Failed to get user content statistics ${userId}:`, error)
      throw error
    }
  }

  // Utility methods for loading states and error handling
  createLoadingState(operation?: string): LoadingState {
    return {
      isLoading: true,
      operation,
      progress: 0
    }
  }

  createServiceResponse<T>(data?: T, error?: ApiError, loading = false): ServiceResponse<T> {
    return {
      data,
      error,
      loading
    }
  }

  // File upload helper
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<string> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await apiRequest.upload<{ url: string }>('/content/upload', formData, onProgress)
      return response.url
    } catch (error) {
      console.error('Failed to upload file:', error)
      throw error
    }
  }

  // Batch file upload
  async uploadFiles(files: File[], onProgress?: (progress: number) => void): Promise<string[]> {
    try {
      const formData = new FormData()
      files.forEach((file, index) => {
        formData.append(`files[${index}]`, file)
      })

      const response = await apiRequest.upload<{ urls: string[] }>('/content/upload/batch', formData, onProgress)
      return response.urls
    } catch (error) {
      console.error('Failed to upload files:', error)
      throw error
    }
  }

  // Generation History Methods - Method declarations
  async getGenerationHistory(page?: number, size?: number): Promise<GenerationHistoryEntry[]> {
    // Implementation is added via prototype below
    throw new Error('Method not implemented')
  }

  async getMonthlyUsageStats(): Promise<MonthlyUsageStats> {
    // Implementation is added via prototype below
    throw new Error('Method not implemented')
  }

  async deleteGenerationHistory(requestId: string): Promise<void> {
    // Implementation is added via prototype below
    throw new Error('Method not implemented')
  }

  async exportGenerationHistory(format: string): Promise<Blob> {
    // Implementation is added via prototype below
    throw new Error('Method not implemented')
  }
}

// Export singleton instance
export const contentService = new ContentService()

// Enhanced content service hooks for React components
export function useContentService() {
  return {
    // Basic CRUD operations
    createContent: (request: CreateContentRequest) =>
      contentService.createContent(request),

    getContent: (id: number, workspaceId?: number) =>
      contentService.getContent(id, workspaceId),

    updateContent: (id: number, request: UpdateContentRequest) =>
      contentService.updateContent(id, request),

    deleteContent: (id: number, workspaceId?: number) =>
      contentService.deleteContent(id, workspaceId),

    listContent: (filter?: ContentFilter, page?: number, size?: number) =>
      contentService.listContent(filter, page, size),

    // AI operations
    generateWithAI: (request: AIGenerationRequest) =>
      contentService.generateWithAI(request),

    regenerateContent: (id: number, request: RegenerateContentRequest) =>
      contentService.regenerateContent(id, request),

    // Analysis and preview
    analyzeContent: (id: number, request?: Partial<ContentAnalysisRequest>) =>
      contentService.analyzeContent(id, request),

    getContentPreview: (id: number, platforms?: string[], customizations?: Record<string, any>) =>
      contentService.getContentPreview(id, platforms, customizations),

    // Publishing and scheduling
    publishContent: (id: number, request: PublishContentRequest) =>
      contentService.publishContent(id, request),

    scheduleContent: (id: number, request: ScheduleContentRequest) =>
      contentService.scheduleContent(id, request),

    // Performance and analytics
    getContentPerformance: (id: number, timeRange?: string) =>
      contentService.getContentPerformance(id, timeRange),

    getEngagementMetrics: (id: number, platform?: string) =>
      contentService.getEngagementMetrics(id, platform),

    // Bulk operations
    bulkDelete: (request: BulkDeleteRequest) =>
      contentService.bulkDelete(request),

    bulkPublish: (request: BulkPublishRequest) =>
      contentService.bulkPublish(request),

    bulkSchedule: (request: BulkScheduleRequest) =>
      contentService.bulkSchedule(request),

    // Search and filtering
    searchContent: (query: string, filters?: ContentFilter, page?: number, size?: number) =>
      contentService.searchContent(query, filters, page, size),

    // File operations
    uploadFile: (file: File, onProgress?: (progress: number) => void) =>
      contentService.uploadFile(file, onProgress),

    uploadFiles: (files: File[], onProgress?: (progress: number) => void) =>
      contentService.uploadFiles(files, onProgress),

    // Utility methods
    createLoadingState: (operation?: string) =>
      contentService.createLoadingState(operation),

    createServiceResponse: <T>(data?: T, error?: ApiError, loading?: boolean) =>
      contentService.createServiceResponse(data, error, loading)
  }
}

// Generation History Methods - Updated to match API response
export interface GenerationHistoryEntry {
  id: number;
  requestId: string;
  generatedContent: string;
  generatedTitle: string;
  aiProvider: string;
  industry: string;
  contentType: string;
  generationCost: number;
  tokensUsed: number;
  qualityScore: number;
  readabilityScore: number;
  responseTimeMs: number;
  createdAt: string;
  success: boolean;
  errorMessage?: string;
  prompt?: string;
  // Additional fields from API
  language?: string;
  tone?: string;
  targetAudience?: string;
  aiModel?: string;
  sentimentScore?: number;
  templateName?: string;
  updatedAt?: string;
  workspaceId?: number;
  workspaceName?: string;
  contentId?: number;
  contentTitle?: string;
  templateId?: number;
}

export interface MonthlyUsageStats {
  totalGenerations: number;
  totalTokensUsed: number;
  totalCost: number;
  remainingQuota?: number;
  averageQualityScore: number;
  averageResponseTime: number;
  mostUsedProvider: string;
  mostUsedIndustry?: string;
  mostUsedContentType?: string;
  successfulGenerations: number;
  failedGenerations: number;
  successRate: number;
  usageByProvider?: {
    [key: string]: {
      count: number;
      tokensUsed: number;
      cost: number;
      averageResponseTime: number;
      successRate: number;
      averageQualityScore: number;
    };
  };
  usageByContentType?: any;
  usageByIndustry?: any;
}

// Add generation history methods to ContentService class
ContentService.prototype.getGenerationHistory = async function (page: number = 0, size: number = 10): Promise<GenerationHistoryEntry[]> {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());

    console.log('Calling generation history API with params:', params.toString());
    const response = await apiRequest.get<any>(`/content/generation-history?${params.toString()}`);
    console.log('Generation history API response:', response);

    // The API interceptor already processes ResponseBase and returns responseBase.data
    // So response is actually the 'data' field from ResponseBase: { content: [...], pageable: {...}, ... }
    const historyData = response.content || [];
    console.log('Extracted history data:', historyData);
    return historyData;
  } catch (error) {
    console.error('Failed to get generation history:', error);
    throw error;
  }
};

ContentService.prototype.getMonthlyUsageStats = async function (): Promise<MonthlyUsageStats> {
  try {
    console.log('Calling monthly usage stats API');
    const response = await apiRequest.get<any>('/content/generation-history/stats');
    console.log('Monthly usage stats API response:', response);

    // The API interceptor already processes ResponseBase and returns responseBase.data
    // So response is actually the 'data' field from ResponseBase
    const statsData = response || {
      totalGenerations: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      remainingQuota: 1000,
      averageQualityScore: 0,
      averageResponseTime: 0,
      mostUsedProvider: '',
      mostUsedIndustry: '',
      mostUsedContentType: '',
      successfulGenerations: 0,
      failedGenerations: 0,
      successRate: 0
    };
    console.log('Extracted stats data:', statsData);
    return statsData;
  } catch (error) {
    console.error('Failed to get monthly usage stats:', error);
    throw error;
  }
};

ContentService.prototype.deleteGenerationHistory = async function (requestId: string): Promise<void> {
  try {
    await apiRequest.delete(`/content/generation-history/${requestId}`);
  } catch (error) {
    console.error('Failed to delete generation history:', error);
    throw error;
  }
};

ContentService.prototype.exportGenerationHistory = async function (format: string): Promise<Blob> {
  try {
    return await apiRequest.get(`/content/generation-history/export/${format}`, {
      responseType: 'blob'
    });
  } catch (error) {
    console.error('Failed to export generation history:', error);
    throw error;
  }
};