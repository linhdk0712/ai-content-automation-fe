import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiError, ApiResponse } from '../types/api.types'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

// Local helper types for request metadata
interface RequestMetadata {
  retryCount: number
  startTime?: number
}

interface RequestWithMeta extends AxiosRequestConfig {
  metadata?: RequestMetadata
  _retry?: boolean
}

// Default retry configuration
export interface RetryConfig {
  maxRetries: number
  retryDelay: number
  retryCondition?: (error: AxiosError) => boolean
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryCondition: (error: AxiosError) => {
    return !error.response || error.response.status >= 500 || error.response.status === 429
  }
}

// Create axios instance with enhanced configuration
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: (status) => status < 500, // Don't throw for client errors
})

// Token management utilities
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'accessToken'
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken'
  private static refreshPromise: Promise<string> | null = null

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY)
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY)
  }

  static setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken)
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY)
    localStorage.removeItem(this.REFRESH_TOKEN_KEY)
    this.refreshPromise = null
  }

  static async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    this.refreshPromise = this.performTokenRefresh(refreshToken)

    try {
      const newAccessToken = await this.refreshPromise
      return newAccessToken
    } finally {
      this.refreshPromise = null
    }
  }

  private static async performTokenRefresh(refreshToken: string): Promise<string> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      })

      // Handle direct response structure from backend
      const authData = response.data as { accessToken: string; refreshToken: string }
      if (authData?.accessToken && authData?.refreshToken) {
        this.setTokens(authData.accessToken, authData.refreshToken)
        return authData.accessToken
      } else {
        throw new Error('Invalid refresh response')
      }
    } catch (error) {
      this.clearTokens()
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw error instanceof Error ? error : new Error('Token refresh failed')
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { exp: number }
      const currentTime = Date.now() / 1000
      return payload.exp <= currentTime
    } catch {
      return true
    }
  }
}

// Enhanced request interceptor with retry logic
api.interceptors.request.use(
  async (config) => {
    // Add request ID for tracking
    config.headers = config.headers ?? {}
    config.headers['X-Request-ID'] = generateRequestId()

    // Add authentication token
    let token = TokenManager.getAccessToken()

    if (token) {
      // Check if token is expired and refresh if needed
      if (TokenManager.isTokenExpired(token)) {
        try {
          token = await TokenManager.refreshAccessToken()
        } catch (error) {
          console.warn('Token refresh failed:', error)
          // Continue with expired token, let the server handle it
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    // Add retry configuration to request
    (config as any).metadata = {
      retryCount: 0,
      startTime: Date.now(),
      ...(config as any).metadata,
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Enhanced response interceptor with comprehensive error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful requests in development
    if (import.meta.env.DEV) {
      const duration = Date.now() - ((response.config as RequestWithMeta).metadata?.startTime || 0)
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`)
    }

    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RequestWithMeta | undefined

    if (!originalRequest) {
      return Promise.reject(createApiError(error))
    }

    // Initialize retry metadata if not present
    if (!originalRequest.metadata) {
      originalRequest.metadata = { retryCount: 0 }
    }

    // Handle 401 Unauthorized with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const newToken = await TokenManager.refreshAccessToken()
        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch {
        console.warn('Token refresh failed, redirecting to login')
        return Promise.reject(createApiError(error))
      }
    }

    // Handle rate limiting with exponential backoff
    if (error.response?.status === 429) {
      const retryAfterHeader = (error.response.headers as Record<string, string | undefined>)['retry-after']
      const retryAfter = Number.parseInt(retryAfterHeader || '1', 10)
      const delay = Math.min(retryAfter * 1000, 30000) // Max 30 seconds

      if ((originalRequest.metadata.retryCount) < DEFAULT_RETRY_CONFIG.maxRetries) {
        originalRequest.metadata.retryCount++

        console.warn(`Rate limited. Retrying after ${delay}ms (attempt ${originalRequest.metadata.retryCount})`)

        await sleep(delay)
        return api(originalRequest)
      }
    }

    // Handle server errors with retry logic
    if (shouldRetry(error) && (originalRequest.metadata.retryCount) < DEFAULT_RETRY_CONFIG.maxRetries) {
      originalRequest.metadata.retryCount++

      const delay = calculateRetryDelay(originalRequest.metadata.retryCount)

      console.warn(`Request failed, retrying in ${delay}ms (attempt ${originalRequest.metadata.retryCount})`)

      await sleep(delay)
      return api(originalRequest)
    }

    // Log error in development
    if (import.meta.env.DEV) {
      const duration = Date.now() - (originalRequest.metadata?.startTime || 0)
      console.error(`❌ ${originalRequest.method?.toUpperCase()} ${originalRequest.url} - ${error.response?.status || 'Network Error'} (${duration}ms)`)
    }

    return Promise.reject(createApiError(error))
  }
)

// Utility functions
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function shouldRetry(error: AxiosError): boolean {
  return DEFAULT_RETRY_CONFIG.retryCondition?.(error) || false
}

function calculateRetryDelay(retryCount: number): number {
  // Exponential backoff with jitter
  const baseDelay = DEFAULT_RETRY_CONFIG.retryDelay
  const exponentialDelay = baseDelay * Math.pow(2, retryCount - 1)
  const jitter = Math.random() * 0.1 * exponentialDelay
  return Math.min(exponentialDelay + jitter, 10000) // Max 10 seconds
}

function createApiError(error: AxiosError): ApiError {
  const response = error.response
  const request = error.request

  if (response) {
    // Server responded with error status
    const apiResponse = response.data as ApiResponse<unknown>
    return {
      message: apiResponse?.message || response.statusText || 'Request failed',
      status: response.status,
      code: apiResponse?.error,
      details: apiResponse?.data as Record<string, unknown> | undefined,
      timestamp: new Date().toISOString(),
      path: response.config?.url || ''
    }
  } else if (request) {
    // Network error
    return {
      message: 'Network error - please check your connection',
      status: 0,
      code: 'NETWORK_ERROR',
      timestamp: new Date().toISOString(),
      path: error.config?.url || ''
    }
  } else {
    // Request setup error
    return {
      message: error.message || 'Request configuration error',
      status: 0,
      code: 'REQUEST_ERROR',
      timestamp: new Date().toISOString(),
      path: ''
    }
  }
}

// Enhanced API helper functions with proper typing and error handling
export const apiRequest = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.get(url, config).then(extractResponseData) as Promise<T>,

  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    api.post(url, data, config).then(extractResponseData) as Promise<T>,

  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    api.put(url, data, config).then(extractResponseData) as Promise<T>,

  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    api.patch(url, data, config).then(extractResponseData) as Promise<T>,

  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.delete(url, config).then(extractResponseData) as Promise<T>,

  // Upload method for file uploads with progress tracking
  upload: <T = unknown>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<T> =>
    api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    }).then(extractResponseData) as Promise<T>,
}

// Helper function to extract data from API response
function extractResponseData<T = unknown>(response: AxiosResponse<ApiResponse<T> | T>): T {
  const apiResponse = response.data
  console.log("apiResponse", apiResponse)
  // Check if response follows ApiResponse wrapper format
  if (typeof apiResponse === 'object' && apiResponse !== null && 'success' in apiResponse) {
    const wrappedResponse = apiResponse as ApiResponse<T>
    if (wrappedResponse.success && wrappedResponse.data !== undefined) {
      return wrappedResponse.data
    } else if (wrappedResponse.success && wrappedResponse.data === undefined) {
      // For responses that have success: true but no data field, return the response itself
      // This handles cases where the response is the actual data with success field
      return apiResponse as T
    } else {
      throw new Error(wrappedResponse.message || 'Request failed')
    }
  } else {
    // Response is direct data (not wrapped in ApiResponse format)
    return apiResponse as T
  }
}

// Export enhanced API instance and utilities
export { api, TokenManager }
export default api