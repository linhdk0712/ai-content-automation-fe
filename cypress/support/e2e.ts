// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Import Cypress code coverage
import '@cypress/code-coverage/support'

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  // that we expect in our error boundary tests
  if (err.message.includes('Test error')) {
    return false
  }
  
  // Let other errors fail the test
  return true
})

// Performance monitoring
Cypress.on('window:before:load', (win) => {
  // Add performance observer
  if ('PerformanceObserver' in win) {
    const observer = new win.PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          cy.log(`Page load time: ${entry.duration.toFixed(2)}ms`)
        }
      })
    })
    
    try {
      observer.observe({ entryTypes: ['navigation'] })
    } catch (e) {
      // Observer not supported
    }
  }
})

// Network monitoring
Cypress.on('window:before:load', (win) => {
  // Monitor fetch requests
  const originalFetch = win.fetch
  win.fetch = function(...args) {
    const startTime = performance.now()
    
    return originalFetch.apply(this, args).then((response) => {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      cy.log(`API call to ${args[0]} took ${duration.toFixed(2)}ms`)
      
      return response
    })
  }
})

// Viewport configuration for responsive testing
const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  large: { width: 1920, height: 1080 }
}

// Add custom viewport commands
Object.entries(viewports).forEach(([name, size]) => {
  Cypress.Commands.add(`set${name.charAt(0).toUpperCase() + name.slice(1)}Viewport`, () => {
    cy.viewport(size.width, size.height)
  })
})

// Memory leak detection
let initialMemory: number

Cypress.on('test:before:run', () => {
  cy.window().then((win) => {
    if ('memory' in win.performance) {
      initialMemory = (win.performance as any).memory.usedJSHeapSize
    }
  })
})

Cypress.on('test:after:run', () => {
  cy.window().then((win) => {
    if ('memory' in win.performance && initialMemory) {
      const finalMemory = (win.performance as any).memory.usedJSHeapSize
      const memoryIncrease = finalMemory - initialMemory
      
      if (memoryIncrease > 1024 * 1024) { // 1MB threshold
        cy.log(`Warning: Memory increased by ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)
      }
    }
  })
})

// Screenshot on failure configuration
Cypress.Screenshot.defaults({
  screenshotOnRunFailure: true,
  capture: 'viewport'
})

// Video configuration
Cypress.config('video', true)
Cypress.config('videoCompression', 32)

// Test retry configuration
Cypress.config('retries', {
  runMode: 2,
  openMode: 0
})

export {}