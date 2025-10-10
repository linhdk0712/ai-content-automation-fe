import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Route preloader hook - preloads routes based on current location and user behavior
 */
export const useRoutePreloader = () => {
  const location = useLocation()

  useEffect(() => {
    const preloadRoutes = async () => {
      const currentPath = location.pathname

      // Preload likely next routes based on current route
      const preloadMap: Record<string, () => Promise<any>[]> = {
        '/': () => [
          import('../pages/content/ContentLibrary'),
          import('../pages/content/ContentCreator')
        ],
        '/login': () => [
          import('../pages/Dashboard')
        ],
        '/dashboard': () => [
          import('../pages/content/ContentLibrary'),
          import('../pages/content/ContentCreator'),
          import('../pages/analytics/Analytics')
        ],
        '/content': () => [
          import('../pages/content/ContentCreator'),
          import('../pages/analytics/Analytics')
        ],
        '/content/create': () => [
          import('../pages/content/ContentLibrary'),
          import('../pages/templates/Templates')
        ],
        '/templates': () => [
          import('../pages/content/ContentCreator')
        ]
      }

      const preloader = preloadMap[currentPath]
      if (preloader) {
        const promises = preloader()
        Promise.allSettled(promises).catch(error => {
          console.warn('Route preloading failed:', error)
        })
      }
    }

    // Debounce preloading
    const timer = setTimeout(preloadRoutes, 1000)
    return () => clearTimeout(timer)
  }, [location.pathname])
}

/**
 * Link hover preloader - preloads routes when user hovers over navigation links
 */
export const useLinkHoverPreloader = () => {
  useEffect(() => {
    const preloadOnHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a[href]') as HTMLAnchorElement
      
      if (!link) return

      const href = link.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('#')) return

      // Route-to-component mapping
      const routeImportMap: Record<string, () => Promise<unknown>> = {
        '/dashboard': () => import('../pages/Dashboard'),
        '/content': () => import('../pages/content/ContentLibrary'),
        '/content/create': () => import('../pages/content/ContentCreator'),
        '/analytics': () => import('../pages/analytics/Analytics'),
        '/templates': () => import('../pages/templates/Templates'),
        '/settings': () => import('../pages/settings/Settings'),
        '/pricing': () => import('../pages/pricing/Pricing')
      }

      const preloader = routeImportMap[href]
      if (preloader) {
        handlePreloadError(preloader, href)
      }
    }

    // Add hover listeners to all navigation links
    document.addEventListener('mouseover', preloadOnHover)
    
    return () => {
      document.removeEventListener('mouseover', preloadOnHover)
    }
  }, [])
}

/**
 * Intersection observer preloader - preloads routes when user scrolls near navigation elements
 */
export const useIntersectionPreloader = () => {
  useEffect(() => {
    const routeImportMap: Record<string, () => Promise<unknown>> = {
      'dashboard': () => import('../pages/Dashboard'),
      'content': () => import('../pages/content/ContentLibrary'),
      'content-creator': () => import('../pages/content/ContentCreator'),
      'analytics': () => import('../pages/analytics/Analytics'),
      'templates': () => import('../pages/templates/Templates'),
      'settings': () => import('../pages/settings/Settings')
    }

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          handlePreload(entry.target as HTMLElement)
        }
      })
    }
    
    const handlePreload = (element: HTMLElement) => {
      const preloadAttr = element.getAttribute('data-preload')
      
      if (preloadAttr) {
        const preloader = routeImportMap[preloadAttr]
        if (preloader) {
          preloader().catch(error => {
            console.warn(`Failed to preload ${preloadAttr}:`, error)
          })
        }
      }
    }

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: '100px' // Start preloading 100px before element comes into view
    })

    // Observe elements with data-preload attribute
    const preloadElements = document.querySelectorAll('[data-preload]')
    preloadElements.forEach(element => observer.observe(element))

    return () => {
      observer.disconnect()
    }
  }, [])
}

/**
 * Critical resource preloader - preloads essential components immediately
 */
export const preloadCriticalResources = async () => {
  const criticalResources = [
    import('../components/common/Header'),
    import('../components/common/Sidebar'),
    import('../components/common/NotificationContainer'),
    import('../pages/Dashboard'),
    import('../pages/content/ContentLibrary')
  ]

  try {
    await Promise.allSettled(criticalResources)
    console.log('Critical resources preloaded successfully')
  } catch (error) {
    console.warn('Some critical resources failed to preload:', error)
  }
}

/**
 * Bundle preloader - preloads vendor chunks that are likely to be needed
 */
export const preloadVendorChunks = () => {
  // These would be actual chunk URLs from your build
  const vendorChunks = [
    '/assets/mui-core-*.js',
    '/assets/react-router-*.js',
    '/assets/query-*.js'
  ]

  vendorChunks.forEach(chunk => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'script'
    link.href = chunk
    document.head.appendChild(link)
  })
}
function handlePreloadError(preloader: () => Promise<unknown>, href: string) {
    preloader()
        .then(() => {
            console.log(`Preloaded route: ${href}`);
        })
        .catch((error) => {
            console.warn(`Failed to preload route ${href}:`, error);
        });
}
