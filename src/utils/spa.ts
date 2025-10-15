// SPA utilities for better performance and UX

// Preload route components
export const preloadRoute = async (routeImport: () => Promise<any>) => {
  try {
    await routeImport()
  } catch (error) {
    console.warn('Failed to preload route:', error)
  }
}

// Prefetch data for routes
export const prefetchRouteData = async (queryClient: any, queries: any[]) => {
  try {
    await Promise.all(
      queries.map(query => queryClient.prefetchQuery(query))
    )
  } catch (error) {
    console.warn('Failed to prefetch route data:', error)
  }
}

// Handle browser back/forward navigation
export const handleBrowserNavigation = () => {
  // Smooth scroll to top on route change
  window.scrollTo({ top: 0, behavior: 'smooth' })
  
  // Clear any temporary UI states
  document.querySelectorAll('[data-temporary]').forEach(el => {
    el.remove()
  })
}

// Optimize images for SPA
export const optimizeImage = (src: string, width?: number, height?: number) => {
  const img = new Image()
  img.loading = 'lazy'
  img.decoding = 'async'
  
  if (width) img.width = width
  if (height) img.height = height
  
  return new Promise((resolve, reject) => {
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Debounce function for search and input optimization
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function for scroll and resize events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) => {
  if (!('IntersectionObserver' in window)) {
    // Fallback for browsers without IntersectionObserver
    return {
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {}
    }
  }
  
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  })
}

// Virtual scrolling helper for large lists
export const calculateVirtualScrollItems = (
  containerHeight: number,
  itemHeight: number,
  scrollTop: number,
  totalItems: number,
  overscan = 5
) => {
  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    totalItems - 1
  )
  
  const start = Math.max(0, visibleStart - overscan)
  const end = Math.min(totalItems - 1, visibleEnd + overscan)
  
  return {
    start,
    end,
    offsetY: start * itemHeight
  }
}

// Memory management for SPA
export const cleanupMemory = () => {
  // Clear any global timers
  const highestTimeoutId = setTimeout(() => {}, 0)
  for (let i = 0; i < highestTimeoutId; i++) {
    clearTimeout(i)
  }
  
  // Clear any global intervals
  const highestIntervalId = setInterval(() => {}, 0)
  for (let i = 0; i < highestIntervalId; i++) {
    clearInterval(i)
  }
  
  // Force garbage collection if available
  if (window.gc) {
    window.gc()
  }
}

// Performance monitoring
export const measurePerformance = (name: string, fn: () => void | Promise<void>) => {
  const start = performance.now()
  
  const result = fn()
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const end = performance.now()
      console.log(`${name} took ${end - start} milliseconds`)
    })
  } else {
    const end = performance.now()
    console.log(`${name} took ${end - start} milliseconds`)
    return result
  }
}

// Local storage with expiration for SPA caching
export const localStorageWithExpiry = {
  set: (key: string, value: any, ttl: number) => {
    const now = new Date()
    const item = {
      value: value,
      expiry: now.getTime() + ttl
    }
    localStorage.setItem(key, JSON.stringify(item))
  },
  
  get: (key: string) => {
    const itemStr = localStorage.getItem(key)
    if (!itemStr) return null
    
    try {
      const item = JSON.parse(itemStr)
      const now = new Date()
      
      if (now.getTime() > item.expiry) {
        localStorage.removeItem(key)
        return null
      }
      
      return item.value
    } catch {
      return null
    }
  },
  
  remove: (key: string) => {
    localStorage.removeItem(key)
  }
}