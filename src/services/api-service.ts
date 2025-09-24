// Comprehensive API service wrapper with enhanced error handling and loading states

import { apiRequest } from './api'
import { loadingManager, LoadingKeys, LoadingOptions } from '../utils/loading-manager.tsx'
import { ErrorHandler, ProcessedError } from '../utils/error-handler'
import { ApiResponse, ApiError, PaginatedResponse } from '../types/api.types'

// Service response wrapper
export interface ServiceResponse<T> {
  data?: T
  error?: ProcessedError
  loading: boolean
  success: boolean
}

// Base API service class with common functionality
export abstract class BaseApiService {
  protected serviceName: string

  constructor(serviceName: string) {
    this.serviceName = serviceName
  }

  // Enhanced API call wrapper with loading states and error handling
  protected async executeRequest<T>(
    operation: () => Promise<T>,
    loadingKey: string,
    loadingOptions?: LoadingOptions
  ): Promise<ServiceResponse<T>> {
    try {
      // Start loading
      loadingManager.startLoading(loadingKey, {
        operation: `${this.serviceName} operation`,
        ...loadingOptions
      })

      // Execute the operation
      const data = await operation()

      // Stop loading
      loadingManager.stopLoading(loadingKey)

      return {
        data,
        loading: false,
        success: true
      }
    } catch (error) {
      // Stop loading
      loadingManager.stopLoading(loadingKey)

      // Process error
      const processedError = ErrorHandler.processError(error)
      ErrorHandler.logError(processedError, `${this.serviceName}.${loadingKey}`)

      return {
        error: processedError,
        loading: false,
        success: false
      }
    }
  }

  // GET request wrapper
  protected async get<T>(
    url: string,
    loadingKey: string,
    options?: {
      params?: Record<string, any>
      loadingOptions?: LoadingOptions
    }
  ): Promise<ServiceResponse<T>> {
    return this.executeRequest(
      () => {
        const queryParams = options?.params ? this.buildQueryParams(options.params) : ''
        const fullUrl = queryParams ? `${url}?${queryParams}` : url
        return apiRequest.get<T>(fullUrl)
      },
      loadingKey,
      options?.loadingOptions
    )
  }

  // POST request wrapper
  protected async post<T>(
    url: string,
    data: any,
    loadingKey: string,
    options?: {
      loadingOptions?: LoadingOptions
    }
  ): Promise<ServiceResponse<T>> {
    return this.executeRequest(
      () => apiRequest.post<T>(url, data),
      loadingKey,
      options?.loadingOptions
    )
  }

  // PUT request wrapper
  protected async put<T>(
    url: string,
    data: any,
    loadingKey: string,
    options?: {
      loadingOptions?: LoadingOptions
    }
  ): Promise<ServiceResponse<T>> {
    return this.executeRequest(
      () => apiRequest.put<T>(url, data),
      loadingKey,
      options?.loadingOptions
    )
  }

  // DELETE request wrapper
  protected async delete<T>(
    url: string,
    loadingKey: string,
    options?: {
      loadingOptions?: LoadingOptions
    }
  ): Promise<ServiceResponse<T>> {
    return this.executeRequest(
      () => apiRequest.delete<T>(url),
      loadingKey,
      options?.loadingOptions
    )
  }

  // File upload wrapper
  protected async upload<T>(
    url: string,
    formData: FormData,
    loadingKey: string,
    options?: {
      onProgress?: (progress: number) => void
      loadingOptions?: LoadingOptions
    }
  ): Promise<ServiceResponse<T>> {
    return this.executeRequest(
      () => {
        const onProgress = options?.onProgress || ((progress) => {
          loadingManager.updateProgress(loadingKey, progress)
        })
        return apiRequest.upload<T>(url, formData, onProgress)
      },
      loadingKey,
      {
        showProgress: true,
        ...options?.loadingOptions
      }
    )
  }

  // Paginated request wrapper
  protected async getPaginated<T>(
    url: string,
    loadingKey: string,
    options?: {
      page?: number
      size?: number
      params?: Record<string, any>
      loadingOptions?: LoadingOptions
    }
  ): Promise<ServiceResponse<PaginatedResponse<T>>> {
    const params = {
      page: options?.page || 0,
      size: options?.size || 20,
      ...options?.params
    }

    return this.get<PaginatedResponse<T>>(url, loadingKey, {
      params,
      loadingOptions: options?.loadingOptions
    })
  }

  // Retry wrapper for failed requests
  protected async withRetry<T>(
    operation: () => Promise<ServiceResponse<T>>,
    maxRetries = 3,
    delay = 1000
  ): Promise<ServiceResponse<T>> {
    let lastResponse: ServiceResponse<T>

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      lastResponse = await operation()

      if (lastResponse.success || !lastResponse.error?.retryable) {
        return lastResponse
      }

      if (attempt < maxRetries) {
        await this.sleep(delay * Math.pow(2, attempt - 1)) // Exponential backoff
      }
    }

    return lastResponse!
  }

  // Utility methods
  private buildQueryParams(params: Record<string, any>): string {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, String(v)))
        } else if (typeof value === 'object') {
          searchParams.append(key, JSON.stringify(value))
        } else {
          searchParams.append(key, String(value))
        }
      }
    })

    return searchParams.toString()
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Batch operations helper
  protected async executeBatch<T>(
    operations: Array<() => Promise<T>>,
    loadingKey: string,
    options?: {
      concurrency?: number
      loadingOptions?: LoadingOptions
    }
  ): Promise<ServiceResponse<T[]>> {
    const concurrency = options?.concurrency || 5
    const results: T[] = []
    const errors: ProcessedError[] = []

    try {
      loadingManager.startLoading(loadingKey, {
        operation: 'Batch operation',
        showProgress: true,
        ...options?.loadingOptions
      })

      // Process operations in batches
      for (let i = 0; i < operations.length; i += concurrency) {
        const batch = operations.slice(i, i + concurrency)
        const batchPromises = batch.map(async (operation) => {
          try {
            return await operation()
          } catch (error) {
            const processedError = ErrorHandler.processError(error)
            errors.push(processedError)
            throw error
          }
        })

        const batchResults = await Promise.allSettled(batchPromises)
        
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            results.push(result.value)
          }
        })

        // Update progress
        const progress = Math.round(((i + batch.length) / operations.length) * 100)
        loadingManager.updateProgress(loadingKey, progress)
      }

      loadingManager.stopLoading(loadingKey)

      if (errors.length > 0 && results.length === 0) {
        // All operations failed
        return {
          error: errors[0], // Return first error
          loading: false,
          success: false
        }
      }

      return {
        data: results,
        loading: false,
        success: true
      }
    } catch (error) {
      loadingManager.stopLoading(loadingKey)
      const processedError = ErrorHandler.processError(error)
      
      return {
        error: processedError,
        loading: false,
        success: false
      }
    }
  }
}

// Enhanced content service using the base service
export class EnhancedContentService extends BaseApiService {
  constructor() {
    super('ContentService')
  }

  async createContent(request: any): Promise<ServiceResponse<any>> {
    return this.post('/content', request, LoadingKeys.CONTENT_CREATE, {
      loadingOptions: {
        operation: 'Creating content',
        message: 'Please wait while we create your content...'
      }
    })
  }

  async getContent(id: number, workspaceId?: number): Promise<ServiceResponse<any>> {
    return this.get(`/content/${id}`, `content.get.${id}`, {
      params: workspaceId ? { workspaceId } : undefined,
      loadingOptions: {
        operation: 'Loading content',
        message: 'Fetching content details...'
      }
    })
  }

  async updateContent(id: number, request: any): Promise<ServiceResponse<any>> {
    return this.put(`/content/${id}`, request, `content.update.${id}`, {
      loadingOptions: {
        operation: 'Updating content',
        message: 'Saving your changes...'
      }
    })
  }

  async deleteContent(id: number, workspaceId?: number): Promise<ServiceResponse<void>> {
    return this.delete(`/content/${id}`, `content.delete.${id}`, {
      loadingOptions: {
        operation: 'Deleting content',
        message: 'Removing content...'
      }
    })
  }

  async listContent(options?: {
    page?: number
    size?: number
    filters?: Record<string, any>
  }): Promise<ServiceResponse<PaginatedResponse<any>>> {
    return this.getPaginated('/content', LoadingKeys.CONTENT_LIST, {
      page: options?.page,
      size: options?.size,
      params: options?.filters,
      loadingOptions: {
        operation: 'Loading content list',
        message: 'Fetching your content...'
      }
    })
  }

  async generateWithAI(request: any): Promise<ServiceResponse<any>> {
    return this.post('/content/generate', request, LoadingKeys.AI_GENERATE, {
      loadingOptions: {
        operation: 'Generating content with AI',
        message: 'AI is creating your content...',
        estimatedDuration: 30000 // 30 seconds
      }
    })
  }

  async publishContent(id: number, request: any): Promise<ServiceResponse<any>> {
    return this.post(`/content/${id}/publish`, request, LoadingKeys.CONTENT_PUBLISH, {
      loadingOptions: {
        operation: 'Publishing content',
        message: 'Publishing to selected platforms...',
        estimatedDuration: 15000 // 15 seconds
      }
    })
  }

  async bulkDelete(contentIds: number[]): Promise<ServiceResponse<any>> {
    return this.post('/content/bulk/delete', { contentIds }, LoadingKeys.BULK_DELETE, {
      loadingOptions: {
        operation: 'Bulk delete',
        message: `Deleting ${contentIds.length} items...`,
        showProgress: true
      }
    })
  }

  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<ServiceResponse<{ url: string }>> {
    const formData = new FormData()
    formData.append('file', file)

    return this.upload('/content/upload', formData, LoadingKeys.FILE_UPLOAD, {
      onProgress,
      loadingOptions: {
        operation: 'Uploading file',
        message: `Uploading ${file.name}...`,
        showProgress: true
      }
    })
  }

  // Search with debouncing
  async searchContent(
    query: string,
    options?: {
      filters?: Record<string, any>
      page?: number
      size?: number
    }
  ): Promise<ServiceResponse<PaginatedResponse<any>>> {
    // Use a debounced loading key to prevent too many loading states
    const loadingKey = `${LoadingKeys.CONTENT_SEARCH}.${query}`
    
    return this.get('/content/search', loadingKey, {
      params: {
        q: query,
        page: options?.page || 0,
        size: options?.size || 20,
        ...options?.filters
      },
      loadingOptions: {
        operation: 'Searching content',
        message: `Searching for "${query}"...`
      }
    })
  }
}

// Enhanced auth service using the base service
export class EnhancedAuthService extends BaseApiService {
  constructor() {
    super('AuthService')
  }

  async login(usernameOrEmail: string, password: string): Promise<ServiceResponse<any>> {
    return this.post('/auth/login', { usernameOrEmail, password }, LoadingKeys.LOGIN, {
      loadingOptions: {
        operation: 'Signing in',
        message: 'Authenticating...'
      }
    })
  }

  async register(request: any): Promise<ServiceResponse<any>> {
    return this.post('/auth/register', request, LoadingKeys.REGISTER, {
      loadingOptions: {
        operation: 'Creating account',
        message: 'Setting up your account...'
      }
    })
  }

  async logout(): Promise<ServiceResponse<void>> {
    return this.post('/auth/logout', {}, LoadingKeys.LOGOUT, {
      loadingOptions: {
        operation: 'Signing out',
        message: 'Logging out...'
      }
    })
  }

  async getCurrentUser(): Promise<ServiceResponse<any>> {
    return this.get('/auth/me', 'auth.current-user', {
      loadingOptions: {
        operation: 'Loading profile',
        message: 'Fetching user profile...'
      }
    })
  }
}

// Service factory
export class ApiServiceFactory {
  private static instances = new Map<string, BaseApiService>()

  static getContentService(): EnhancedContentService {
    if (!this.instances.has('content')) {
      this.instances.set('content', new EnhancedContentService())
    }
    return this.instances.get('content') as EnhancedContentService
  }

  static getAuthService(): EnhancedAuthService {
    if (!this.instances.has('auth')) {
      this.instances.set('auth', new EnhancedAuthService())
    }
    return this.instances.get('auth') as EnhancedAuthService
  }
}

// Export singleton instances
export const enhancedContentService = ApiServiceFactory.getContentService()
export const enhancedAuthService = ApiServiceFactory.getAuthService()

export default ApiServiceFactory