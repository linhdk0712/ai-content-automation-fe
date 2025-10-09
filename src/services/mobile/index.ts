// Facade module consolidating mobile-related services into a single entry point.
// This keeps existing modules intact while providing a unified API surface.

import * as mobileAnalytics from '../mobileAnalytics.service'
import * as mobileCache from '../mobileCache.service'
import * as mobileOptimization from '../mobileOptimization.service'

export { mobileAnalytics, mobileCache, mobileOptimization }

// Optional convenience facade for consumers who prefer an object interface
export const mobileServices = {
  analytics: { ...mobileAnalytics },
  optimization: { ...mobileOptimization },
  cache: { ...mobileCache }
}

