// Enhanced React hook for API operations with loading states and error handling

import { useCallback, useEffect, useRef, useState } from 'react'
import { ServiceResponse } from '../services/api-service'
import { ProcessedError } from '../utils/error-handler'
import { useLoadingState } from '../utils/loading-manager.tsx'

// Hook options
export interface UseApiOptions<T> {
  immediate?: boolean // Execute immediately on mount
  loadingKey?: string // Custom loading key
  onSuccess?: (data: T) => void
  onError?: (error: ProcessedError) => void
  retries?: number // Number of retries on failure
  retryDelay?: number // Delay between retries in ms
  dependencies?: any[] // Dependencies to trigger re-execution
}

// Hook return type
export interface UseApiReturn<T, P extends any[] = []> {
  data: T | null
  error: ProcessedError | null
  loading: boolean
  execute: (...params: P) => Promise<ServiceResponse<T>>
  reset: () => void
  retry: () => void
}

// Main useApi hook
export function useApi<T, P extends any[] = []>(
  apiFunction: (...params: P) => Promise<ServiceResponse<T>>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T, P> {
  const {
    immediate = false,
    loadingKey,
    onSuccess,
    onError,
    retries = 0,
    retryDelay = 1000,
    dependencies = []
  } = options

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ProcessedError | null>(null)
  const [loading, setLoading] = useState(false)
  
  const lastParamsRef = useRef<P | null>(null)
  const retryCountRef = useRef(0)
  const mountedRef = useRef(true)

  // Use loading state manager if loadingKey is provided
  const { isLoading: globalLoading } = useLoadingState(loadingKey)

  const execute = useCallback(async (...params: P): Promise<ServiceResponse<T>> => {
    if (!mountedRef.current) return { loading: false, success: false }

    lastParamsRef.current = params
    setLoading(true)
    setError(null)

    try {
      const response = await apiFunction(...params)

      if (!mountedRef.current) return response

      if (response.success && response.data) {
        setData(response.data)
        setError(null)
        retryCountRef.current = 0
        onSuccess?.(response.data)
      } else if (response.error) {
        setError(response.error)
        setData(null)
        onError?.(response.error)
      }

      setLoading(false)
      return response
    } catch (err) {
      if (!mountedRef.current) return { loading: false, success: false }

      const errorResponse: ServiceResponse<T> = {
        loading: false,
        success: false,
        error: err as ProcessedError
      }

      setError(err as ProcessedError)
      setData(null)
      setLoading(false)
      onError?.(err as ProcessedError)

      return errorResponse
    }
  }, [apiFunction, onSuccess, onError])

  const retry = useCallback(() => {
    if (!lastParamsRef.current || retryCountRef.current >= retries) {
      return
    }

    retryCountRef.current++
    
    // Wait for retry delay and execute
    const performRetry = async () => {
      if (retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }

      if (mountedRef.current) {
        await execute(...(lastParamsRef.current as P))
      }
    }

    performRetry()
  }, [execute, retries, retryDelay])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
    retryCountRef.current = 0
    lastParamsRef.current = null
  }, [])

  // Execute immediately if requested
  useEffect(() => {
    if (immediate && mountedRef.current) {
      execute(...([] as unknown as P))
    }
  }, [immediate, execute])

  // Re-execute when dependencies change
  useEffect(() => {
    if (dependencies.length > 0 && lastParamsRef.current && mountedRef.current) {
      execute(...lastParamsRef.current)
    }
  }, dependencies)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return {
    data,
    error,
    loading: loading || (loadingKey ? (globalLoading ?? false) : false),
    execute,
    reset,
    retry
  }
}

// Specialized hooks for common patterns

// Hook for paginated data
export function usePaginatedApi<T>(
  apiFunction: (page: number, size: number, ...params: any[]) => Promise<ServiceResponse<{ content: T[], totalElements: number, totalPages: number }>>,
  options: UseApiOptions<{ content: T[], totalElements: number, totalPages: number }> & {
    initialPage?: number
    pageSize?: number
  } = {}
) {
  const { initialPage = 0, pageSize = 20, ...apiOptions } = options
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [allData, setAllData] = useState<T[]>([])
  const [hasMore, setHasMore] = useState(true)

  const {
    data,
    error,
    loading,
    execute: baseExecute,
    reset: baseReset
  } = useApi(apiFunction, apiOptions)

  const loadPage = useCallback(async (page: number, ...params: any[]) => {
    const response = await baseExecute(page, pageSize, ...params)
    
    if (response.success && response.data) {
      setCurrentPage(page)
      setHasMore(page < response.data.totalPages - 1)
      
      if (page === 0) {
        setAllData(response.data.content)
      } else {
        setAllData(prev => [...prev, ...response.data!.content])
      }
    }
    
    return response
  }, [baseExecute, pageSize])

  const loadMore = useCallback(async (...params: any[]) => {
    if (hasMore && !loading) {
      return loadPage(currentPage + 1, ...params)
    }
  }, [hasMore, loading, currentPage, loadPage])

  const refresh = useCallback(async (...params: any[]) => {
    setAllData([])
    setCurrentPage(0)
    setHasMore(true)
    return loadPage(0, ...params)
  }, [loadPage])

  const reset = useCallback(() => {
    baseReset()
    setAllData([])
    setCurrentPage(initialPage)
    setHasMore(true)
  }, [baseReset, initialPage])

  return {
    data: allData,
    pageData: data,
    error,
    loading,
    currentPage,
    hasMore,
    totalElements: data?.totalElements || 0,
    totalPages: data?.totalPages || 0,
    loadPage,
    loadMore,
    refresh,
    reset
  }
}

// Hook for search operations with debouncing
export function useSearchApi<T>(
  searchFunction: (query: string, ...params: any[]) => Promise<ServiceResponse<T>>,
  options: UseApiOptions<T> & {
    debounceMs?: number
    minQueryLength?: number
  } = {}
) {
  const { debounceMs = 300, minQueryLength = 2, ...apiOptions } = options
  const [query, setQuery] = useState('')
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()

  const {
    data,
    error,
    loading,
    execute: baseExecute,
    reset
  } = useApi(searchFunction, apiOptions)

  const search = useCallback((searchQuery: string, ...params: any[]) => {
    setQuery(searchQuery)

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    if (searchQuery.length < minQueryLength) {
      reset()
      return
    }

    debounceTimeoutRef.current = setTimeout(() => {
      baseExecute(searchQuery, ...params)
    }, debounceMs)
  }, [baseExecute, debounceMs, minQueryLength, reset])

  const clearSearch = useCallback(() => {
    setQuery('')
    reset()
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
  }, [reset])

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  return {
    data,
    error,
    loading,
    query,
    search,
    clearSearch,
    reset
  }
}

// Hook for file upload operations
export function useFileUpload<T>(
  uploadFunction: (file: File, onProgress?: (progress: number) => void) => Promise<ServiceResponse<T>>,
  options: UseApiOptions<T> = {}
) {
  const [progress, setProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<T[]>([])

  const {
    data,
    error,
    loading,
    execute: baseExecute,
    reset: baseReset
  } = useApi(uploadFunction, options)

  const upload = useCallback(async (file: File) => {
    setProgress(0)
    
    const response = await baseExecute(file, (progressValue: number) => {
      setProgress(progressValue)
    })

    if (response.success && response.data) {
      setUploadedFiles(prev => [...prev, response.data!])
    }

    return response
  }, [baseExecute])

  const uploadMultiple = useCallback(async (files: File[]) => {
    const results: ServiceResponse<T>[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const result = await upload(file)
      results.push(result)
      
      // Update overall progress
      setProgress(Math.round(((i + 1) / files.length) * 100))
    }
    
    return results
  }, [upload])

  const reset = useCallback(() => {
    baseReset()
    setProgress(0)
    setUploadedFiles([])
  }, [baseReset])

  return {
    data,
    error,
    loading,
    progress,
    uploadedFiles,
    upload,
    uploadMultiple,
    reset
  }
}

// Hook for optimistic updates
export function useOptimisticApi<T, P extends any[] = []>(
  apiFunction: (...params: P) => Promise<ServiceResponse<T>>,
  optimisticUpdate: (currentData: T | null, ...params: P) => T | null,
  options: UseApiOptions<T> = {}
) {
  const [optimisticData, setOptimisticData] = useState<T | null>(null)
  const [isOptimistic, setIsOptimistic] = useState(false)

  const {
    data: actualData,
    error,
    loading,
    execute: baseExecute,
    reset: baseReset
  } = useApi(apiFunction, options)

  const execute = useCallback(async (...params: P) => {
    // Apply optimistic update
    const newOptimisticData = optimisticUpdate(actualData, ...params)
    setOptimisticData(newOptimisticData)
    setIsOptimistic(true)

    try {
      const response = await baseExecute(...params)
      
      // Clear optimistic state
      setIsOptimistic(false)
      setOptimisticData(null)
      
      return response
    } catch (error) {
      // Revert optimistic update on error
      setIsOptimistic(false)
      setOptimisticData(null)
      throw error
    }
  }, [actualData, optimisticUpdate, baseExecute])

  const reset = useCallback(() => {
    baseReset()
    setOptimisticData(null)
    setIsOptimistic(false)
  }, [baseReset])

  return {
    data: isOptimistic ? optimisticData : actualData,
    error,
    loading,
    isOptimistic,
    execute,
    reset
  }
}

export default useApi