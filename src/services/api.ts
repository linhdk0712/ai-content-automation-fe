import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiError, ApiResponse, ResponseBase } from '../types/api.types'
import { toastService } from './toast.service'

// API Configuration - Use Vite env (browser-safe). Fallback to '/api' for dev proxy
const API_BASE_URL = 'http://180.93.138.113:8081/api/v1'

// Debug: Log API base URL
console.log('🔧 API_BASE_URL:', API_BASE_URL)
console.log('🔧 Current origin:', window.location.origin)
console.log('🔧 Full API URL will be:', window.location.origin + API_BASE_URL)

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

      console.log('Token refresh response:', response.data)

      // Handle ResponseBase format from backend
      const responseData = response.data

      // Check if it's ResponseBase format
      if (responseData && typeof responseData === 'object' &&
        'errorCode' in responseData && 'errorMessage' in responseData && 'data' in responseData) {
        const responseBase = responseData as ResponseBase<{ accessToken: string; refreshToken: string }>

        if (responseBase.errorCode || responseBase.errorMessage) {
          throw new Error(responseBase.errorMessage || 'Token refresh failed')
        }

        const authData = responseBase.data
        if (authData?.accessToken && authData?.refreshToken) {
          this.setTokens(authData.accessToken, authData.refreshToken)
          return authData.accessToken
        } else {
          throw new Error('Invalid refresh response - no auth data')
        }
      }
      // Handle legacy format (fallback)
      else {
        const authData = responseData as { accessToken: string; refreshToken: string }
        if (authData?.accessToken && authData?.refreshToken) {
          this.setTokens(authData.accessToken, authData.refreshToken)
          return authData.accessToken
        } else {
          throw new Error('Invalid refresh response - legacy format')
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
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
    config.headers = config.headers || {} as any
    config.headers['X-Request-ID'] = generateRequestId()

    // Add authentication token
    let token = TokenManager.getAccessToken()
    console.log('Request interceptor - Token available:', token ? 'Yes' : 'No')
    console.log('Request URL:', config.url)

    if (token) {
      console.log('Token preview:', token.substring(0, 20) + '...')

      // Check if token is expired and refresh if needed
      if (TokenManager.isTokenExpired(token)) {
        console.log('Token is expired, attempting refresh...')
        try {
          token = await TokenManager.refreshAccessToken()
          console.log('Token refreshed successfully')
        } catch (error) {
          console.warn('Token refresh failed:', error)
          // Continue with expired token, let the server handle it
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        console.log('Authorization header set for', config.url, ':', `Bearer ${token.substring(0, 20)}...`)
        console.log('Full headers:', config.headers)
      }
    } else {
      console.log('No token available - request will be unauthenticated for:', config.url)
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

    // Create API error
    const apiError = createApiError(error)

    // Show error toast for non-auth endpoints (to avoid spam during token refresh)
    if (!originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login') &&
      error.response?.status !== 401) {
      toastService.apiError(apiError)
    }

    return Promise.reject(apiError)
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
    const responseData = response.data

    // Check if it's new ErrorResponse format from GlobalExceptionHandler
    if (responseData && typeof responseData === 'object' &&
      'timestamp' in responseData && 'status' in responseData &&
      'error' in responseData && 'message' in responseData && 'path' in responseData) {
      const errorResponse = responseData as ApiError

      return {
        timestamp: errorResponse.timestamp,
        status: errorResponse.status,
        error: errorResponse.error,
        message: errorResponse.message,
        path: errorResponse.path,
        errorCode: errorResponse.errorCode,
        validationErrors: errorResponse.validationErrors,
        suggestions: errorResponse.suggestions,
        documentationUrl: errorResponse.documentationUrl,
        details: errorResponse.details,
        traceId: errorResponse.traceId
      }
    }

    // Check if it's ResponseBase format
    else if (responseData && typeof responseData === 'object' &&
      ('errorCode' in responseData && 'errorMessage' in responseData)) {
      const responseBase = responseData as ResponseBase<unknown>

      return {
        timestamp: new Date().toISOString(),
        status: response.status,
        error: 'API Error',
        message: responseBase.errorMessage || response.statusText || 'Request failed',
        path: response.config?.url || '',
        errorCode: responseBase.errorCode,
        details: responseBase.data as Record<string, unknown> | undefined
      }
    }

    // Check if it's legacy ApiResponse format
    else if (responseData && typeof responseData === 'object' && 'message' in responseData) {
      const apiResponse = responseData as ApiResponse<unknown>
      return {
        timestamp: new Date().toISOString(),
        status: response.status,
        error: 'Request Failed',
        message: apiResponse.message || response.statusText || 'Request failed',
        path: response.config?.url || '',
        errorCode: (apiResponse as any).error,
        details: apiResponse.data as Record<string, unknown> | undefined
      }
    }

    // Fallback for unknown response format
    else {
      return {
        timestamp: new Date().toISOString(),
        status: response.status,
        error: response.statusText || 'Request Failed',
        message: response.statusText || 'Request failed',
        path: response.config?.url || ''
      }
    }
  } else if (request) {
    // Network error
    return {
      timestamp: new Date().toISOString(),
      status: 0,
      error: 'Network Error',
      message: 'Network error - please check your connection',
      path: error.config?.url || '',
      errorCode: 'NETWORK_ERROR'
    }
  } else {
    // Request setup error
    return {
      timestamp: new Date().toISOString(),
      status: 0,
      error: 'Request Error',
      message: error.message || 'Request configuration error',
      path: '',
      errorCode: 'REQUEST_ERROR'
    }
  }
}

// Enhanced API helper functions with proper typing and error handling
export const apiRequest = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig & { showNotification?: boolean }): Promise<T> =>
    api.get(url, config).then(response => extractResponseData(response, config?.showNotification)) as Promise<T>,

  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig & { showNotification?: boolean }): Promise<T> =>
    api.post(url, data, config).then(response => extractResponseData(response, config?.showNotification)) as Promise<T>,

  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig & { showNotification?: boolean }): Promise<T> =>
    api.put(url, data, config).then(response => extractResponseData(response, config?.showNotification)) as Promise<T>,

  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig & { showNotification?: boolean }): Promise<T> =>
    api.patch(url, data, config).then(response => extractResponseData(response, config?.showNotification)) as Promise<T>,

  delete: <T = unknown>(url: string, config?: AxiosRequestConfig & { showNotification?: boolean }): Promise<T> =>
    api.delete(url, config).then(response => extractResponseData(response, config?.showNotification)) as Promise<T>,

  // Upload method for file uploads with progress tracking
  upload: <T = unknown>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void,
    showNotification?: boolean
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
    }).then(response => extractResponseData(response, showNotification)) as Promise<T>,
}

// Helper function to extract data from API response
function extractResponseData<T = unknown>(
  response: AxiosResponse<ResponseBase<T> | ApiResponse<T> | T>,
  showNotification: boolean = false
): T {
  const apiResponse = response.data
  console.log("Raw API Response:", apiResponse)
  console.log("Response URL:", response.config?.url)
  console.log("Response Status:", response.status)

  // Check if response follows new ResponseBase format
  // ResponseBase has specific structure: { errorCode, errorMessage, data }
  // All three fields must be present (even if null)
  const isObject = typeof apiResponse === 'object' && apiResponse !== null
  const hasErrorCode = isObject && 'errorCode' in apiResponse
  const hasErrorMessage = isObject && 'errorMessage' in apiResponse
  const hasData = isObject && 'data' in apiResponse
  const hasResponseBaseStructure = hasErrorCode && hasErrorMessage && hasData

  console.log("ResponseBase detection:", {
    isObject,
    hasErrorCode,
    hasErrorMessage,
    hasData,
    hasResponseBaseStructure,
    keys: isObject ? Object.keys(apiResponse) : []
  })

  if (hasResponseBaseStructure) {
    const responseBase = apiResponse as ResponseBase<T>

    console.log("Processing ResponseBase:", {
      errorCode: responseBase.errorCode,
      errorMessage: responseBase.errorMessage,
      hasData: responseBase.data !== null && responseBase.data !== undefined,
      dataType: typeof responseBase.data,
      fullResponse: responseBase
    })

    // Show toast based on response
    if (showNotification) {
      try {
        toastService.response(
          response.status,
          responseBase.errorCode,
          responseBase.errorMessage,
          response.status >= 200 && response.status < 300 ? 'Operation completed successfully' : undefined
        )
      } catch (toastError) {
        console.error('Toast error:', toastError)
        // Don't let toast errors break the API call
      }
    }

    // Simple rule: errorCode = "SUCCESS" means success, anything else is an error
    if (responseBase.errorCode !== 'SUCCESS') {
      console.log("Error response detected:", {
        errorCode: responseBase.errorCode,
        errorMessage: responseBase.errorMessage
      })
      const error = new Error(responseBase.errorMessage || 'Request failed')
        ; (error as any).code = responseBase.errorCode
        ; (error as any).status = response.status
      throw error
    } else {
      console.log("Success response detected:", {
        errorCode: responseBase.errorCode,
        errorMessage: responseBase.errorMessage
      })
    }

    // Return data if available, otherwise return the whole response as T
    if (responseBase.data !== null && responseBase.data !== undefined) {
      return responseBase.data
    } else {
      // For cases where data is null but operation was successful
      return null as T
    }
  }

  // Check if response follows legacy ApiResponse wrapper format
  else if (typeof apiResponse === 'object' && apiResponse !== null && 'success' in apiResponse) {
    const wrappedResponse = apiResponse as ApiResponse<T>

    // Show toast for legacy format
    if (showNotification) {
      if (wrappedResponse.success) {
        toastService.success(wrappedResponse.message || 'Operation completed successfully')
      } else {
        toastService.error(wrappedResponse.message || 'Request failed')
      }
    }

    if (wrappedResponse.success && wrappedResponse.data !== undefined) {
      return wrappedResponse.data
    } else if (wrappedResponse.success && wrappedResponse.data === undefined) {
      // For responses that have success: true but no data field, return the response itself
      return apiResponse as T
    } else {
      throw new Error(wrappedResponse.message || 'Request failed')
    }
  }

  // Response is direct data (not wrapped) or unknown format
  else {
    console.log("Treating as direct data response")

    // Show generic success toast for direct data responses
    if (showNotification && response.status >= 200 && response.status < 300) {
      toastService.success('Operation completed successfully')
    }

    // For login endpoint, if we get an object with accessToken, treat it as AuthResponse
    if (response.config?.url?.includes('/auth/login') &&
      isObject && 'accessToken' in apiResponse) {
      console.log("Detected direct AuthResponse format")
      return apiResponse as T
    }

    return apiResponse as T
  }
}

// Export enhanced API instance and utilities
export { api, TokenManager }
export default api