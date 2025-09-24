// Loading state management utility
import React from 'react'

export interface LoadingState {
  isLoading: boolean
  operation?: string
  progress?: number
  message?: string
  startTime?: number
  estimatedDuration?: number
}

export interface LoadingOptions {
  operation?: string
  message?: string
  estimatedDuration?: number
  showProgress?: boolean
}

// Global loading state manager
class LoadingManager {
  private loadingStates = new Map<string, LoadingState>()
  private listeners = new Set<(states: Map<string, LoadingState>) => void>()

  // Start loading for a specific key
  startLoading(key: string, options: LoadingOptions = {}): void {
    const loadingState: LoadingState = {
      isLoading: true,
      operation: options.operation,
      message: options.message,
      progress: options.showProgress ? 0 : undefined,
      startTime: Date.now(),
      estimatedDuration: options.estimatedDuration
    }

    this.loadingStates.set(key, loadingState)
    this.notifyListeners()
  }

  // Update loading progress
  updateProgress(key: string, progress: number, message?: string): void {
    const state = this.loadingStates.get(key)
    if (state) {
      state.progress = Math.max(0, Math.min(100, progress))
      if (message) {
        state.message = message
      }
      this.notifyListeners()
    }
  }

  // Update loading message
  updateMessage(key: string, message: string): void {
    const state = this.loadingStates.get(key)
    if (state) {
      state.message = message
      this.notifyListeners()
    }
  }

  // Stop loading for a specific key
  stopLoading(key: string): void {
    this.loadingStates.delete(key)
    this.notifyListeners()
  }

  // Get loading state for a specific key
  getLoadingState(key: string): LoadingState | null {
    return this.loadingStates.get(key) || null
  }

  // Check if any operation is loading
  isAnyLoading(): boolean {
    return this.loadingStates.size > 0
  }

  // Check if specific key is loading
  isLoading(key: string): boolean {
    return this.loadingStates.has(key)
  }

  // Get all loading states
  getAllLoadingStates(): Map<string, LoadingState> {
    return new Map(this.loadingStates)
  }

  // Clear all loading states
  clearAll(): void {
    this.loadingStates.clear()
    this.notifyListeners()
  }

  // Subscribe to loading state changes
  subscribe(listener: (states: Map<string, LoadingState>) => void): () => void {
    this.listeners.add(listener)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(new Map(this.loadingStates))
      } catch (error) {
        console.error('Error in loading state listener:', error)
      }
    })
  }

  // Get estimated remaining time
  getEstimatedRemainingTime(key: string): number | null {
    const state = this.loadingStates.get(key)
    if (!state || !state.startTime || !state.estimatedDuration) {
      return null
    }

    const elapsed = Date.now() - state.startTime
    const remaining = state.estimatedDuration - elapsed
    return Math.max(0, remaining)
  }

  // Get elapsed time
  getElapsedTime(key: string): number | null {
    const state = this.loadingStates.get(key)
    if (!state || !state.startTime) {
      return null
    }

    return Date.now() - state.startTime
  }
}

// Singleton instance
export const loadingManager = new LoadingManager()

// React hook for loading states
export function useLoadingState(key?: string) {
  const [loadingStates, setLoadingStates] = React.useState<Map<string, LoadingState>>(
    loadingManager.getAllLoadingStates()
  )

  React.useEffect(() => {
    const unsubscribe = loadingManager.subscribe(setLoadingStates)
    return unsubscribe
  }, [])

  const startLoading = React.useCallback((loadingKey: string, options?: LoadingOptions) => {
    loadingManager.startLoading(loadingKey, options)
  }, [])

  const stopLoading = React.useCallback((loadingKey: string) => {
    loadingManager.stopLoading(loadingKey)
  }, [])

  const updateProgress = React.useCallback((loadingKey: string, progress: number, message?: string) => {
    loadingManager.updateProgress(loadingKey, progress, message)
  }, [])

  const updateMessage = React.useCallback((loadingKey: string, message: string) => {
    loadingManager.updateMessage(loadingKey, message)
  }, [])

  // If a specific key is provided, return state for that key
  if (key) {
    const specificState = loadingStates.get(key)
    return {
      isLoading: !!specificState,
      loadingState: specificState || null,
      startLoading: (options?: LoadingOptions) => startLoading(key, options),
      stopLoading: () => stopLoading(key),
      updateProgress: (progress: number, message?: string) => updateProgress(key, progress, message),
      updateMessage: (message: string) => updateMessage(key, message)
    }
  }

  // Return global loading state
  return {
    loadingStates,
    isAnyLoading: loadingStates.size > 0,
    startLoading,
    stopLoading,
    updateProgress,
    updateMessage,
    clearAll: () => loadingManager.clearAll()
  }
}

// Higher-order component for loading states
export function withLoading<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  loadingKey: string
) {
  return function LoadingWrapper(props: P) {
    const { isLoading, loadingState } = useLoadingState(loadingKey)

    if (isLoading && loadingState) {
      return <LoadingIndicator loadingState={loadingState} />
    }

    return <WrappedComponent {...props} />
  }
}

// Loading indicator component
interface LoadingIndicatorProps {
  loadingState: LoadingState
  className?: string
}

function LoadingIndicator({ loadingState, className = '' }: LoadingIndicatorProps) {
  const { operation, message, progress } = loadingState

  return (
    <div className={`loading-indicator ${className}`}>
      <div className="loading-spinner" />
      {operation && <div className="loading-operation">{operation}</div>}
      {message && <div className="loading-message">{message}</div>}
      {progress !== undefined && (
        <div className="loading-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-text">{Math.round(progress)}%</div>
        </div>
      )}
    </div>
  )
}

// Async operation wrapper with loading states
export async function withLoadingState<T>(
  key: string,
  operation: () => Promise<T>,
  options: LoadingOptions = {}
): Promise<T> {
  try {
    loadingManager.startLoading(key, options)
    const result = await operation()
    loadingManager.stopLoading(key)
    return result
  } catch (error) {
    loadingManager.stopLoading(key)
    throw error
  }
}

// Debounced loading state (useful for search operations)
export function useDebouncedLoading(key: string, delay = 300) {
  const timeoutRef = React.useRef<NodeJS.Timeout>()
  
  const startDebouncedLoading = React.useCallback((options?: LoadingOptions) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      loadingManager.startLoading(key, options)
    }, delay)
  }, [key, delay])

  const stopDebouncedLoading = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    loadingManager.stopLoading(key)
  }, [key])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    startDebouncedLoading,
    stopDebouncedLoading
  }
}

// Loading state keys for common operations
export const LoadingKeys = {
  // Authentication
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  REGISTER: 'auth.register',
  REFRESH_TOKEN: 'auth.refresh',
  
  // Content operations
  CONTENT_CREATE: 'content.create',
  CONTENT_UPDATE: 'content.update',
  CONTENT_DELETE: 'content.delete',
  CONTENT_LIST: 'content.list',
  CONTENT_SEARCH: 'content.search',
  
  // AI operations
  AI_GENERATE: 'ai.generate',
  AI_REGENERATE: 'ai.regenerate',
  AI_ANALYZE: 'ai.analyze',
  
  // Publishing
  CONTENT_PUBLISH: 'content.publish',
  CONTENT_SCHEDULE: 'content.schedule',
  
  // File operations
  FILE_UPLOAD: 'file.upload',
  FILE_DOWNLOAD: 'file.download',
  
  // Bulk operations
  BULK_DELETE: 'bulk.delete',
  BULK_PUBLISH: 'bulk.publish',
  BULK_SCHEDULE: 'bulk.schedule'
} as const

export type LoadingKey = typeof LoadingKeys[keyof typeof LoadingKeys]

export default loadingManager