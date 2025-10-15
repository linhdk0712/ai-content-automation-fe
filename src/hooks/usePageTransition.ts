import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionState {
  isTransitioning: boolean
  previousPath: string | null
  currentPath: string
}

export const usePageTransition = (transitionDuration = 300) => {
  const location = useLocation()
  const [state, setState] = useState<PageTransitionState>({
    isTransitioning: false,
    previousPath: null,
    currentPath: location.pathname,
  })

  useEffect(() => {
    if (location.pathname !== state.currentPath) {
      // Start transition
      setState(prev => ({
        isTransitioning: true,
        previousPath: prev.currentPath,
        currentPath: location.pathname,
      }))

      // End transition after duration
      const timer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isTransitioning: false,
        }))
      }, transitionDuration)

      return () => clearTimeout(timer)
    }
  }, [location.pathname, state.currentPath, transitionDuration])

  return state
}

// Hook for preloading routes
export const useRoutePreloader = () => {
  const preloadRoute = async (routeImport: () => Promise<any>) => {
    try {
      await routeImport()
    } catch (error) {
      console.warn('Failed to preload route:', error)
    }
  }

  return { preloadRoute }
}

// Hook for managing page focus for accessibility in SPA
export const usePageFocus = () => {
  const location = useLocation()

  useEffect(() => {
    // Focus management for SPA navigation
    const mainContent = document.querySelector('main') || document.querySelector('#main-content')
    if (mainContent) {
      mainContent.focus()
    } else {
      // Fallback: focus the first focusable element
      const firstFocusable = document.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (firstFocusable instanceof HTMLElement) {
        firstFocusable.focus()
      }
    }

    // Announce page change to screen readers
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = `Navigated to ${document.title}`
    document.body.appendChild(announcement)

    // Clean up announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }, [location.pathname])
}