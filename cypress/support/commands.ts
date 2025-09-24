/// <reference types="cypress" />

// Custom command declarations
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with email and password
       */
      login(email: string, password: string): Chainable<void>
      
      /**
       * Custom command to logout
       */
      logout(): Chainable<void>
      
      /**
       * Custom command to create test content
       */
      createContent(title: string, content: string, type?: string): Chainable<void>
      
      /**
       * Custom command to wait for API response
       */
      waitForApi(alias: string, timeout?: number): Chainable<void>
      
      /**
       * Custom command to check accessibility
       */
      checkA11y(context?: string, options?: any): Chainable<void>
      
      /**
       * Custom command to measure performance
       */
      measurePerformance(name: string): Chainable<void>
      
      /**
       * Custom command to simulate network conditions
       */
      simulateNetworkCondition(condition: 'slow' | 'offline'): Chainable<void>
      
      /**
       * Custom command to tab through elements
       */
      tab(): Chainable<JQuery<HTMLElement>>
    }
  }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login')
    
    // Mock successful login response
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: {
          id: '1',
          email: email,
          name: 'Test User',
          role: 'user'
        },
        token: 'jwt-token-123',
        refreshToken: 'refresh-token-123'
      }
    }).as('loginRequest')
    
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type(password)
    cy.get('button[type="submit"]').click()
    
    cy.wait('@loginRequest')
    cy.url().should('include', '/dashboard')
  })
})

// Logout command
Cypress.Commands.add('logout', () => {
  cy.intercept('POST', '/api/auth/logout', {
    statusCode: 200,
    body: { message: 'Logged out successfully' }
  }).as('logoutRequest')
  
  cy.get('[data-testid="user-menu"]').click()
  cy.get('[data-testid="logout-button"]').click()
  
  cy.wait('@logoutRequest')
  cy.url().should('include', '/login')
})

// Create content command
Cypress.Commands.add('createContent', (title: string, content: string, type = 'text') => {
  cy.intercept('POST', '/api/content', {
    statusCode: 201,
    body: {
      id: '1',
      title: title,
      textContent: content,
      type: type,
      status: 'draft',
      createdAt: new Date().toISOString()
    }
  }).as('createContentRequest')
  
  cy.visit('/content/create')
  cy.get('input[name="title"]').type(title)
  cy.get('textarea[name="content"]').type(content)
  
  if (type !== 'text') {
    cy.get('[data-testid="content-type-select"]').click()
    cy.get(`[data-value="${type}"]`).click()
  }
  
  cy.get('button[data-testid="save-content"]').click()
  cy.wait('@createContentRequest')
})

// Wait for API command with timeout
Cypress.Commands.add('waitForApi', (alias: string, timeout = 10000) => {
  cy.wait(alias, { timeout })
})

// Accessibility check command
Cypress.Commands.add('checkA11y', (context?: string, options = {}) => {
  const defaultOptions = {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa']
    },
    ...options
  }
  
  // Basic accessibility checks
  if (context) {
    cy.get(context).within(() => {
      // Check for images without alt text
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt')
      })
      
      // Check for buttons without accessible names
      cy.get('button').each(($btn) => {
        cy.wrap($btn).should('satisfy', ($el) => {
          return $el.attr('aria-label') || $el.text().trim() || $el.attr('title')
        })
      })
      
      // Check for form inputs with labels
      cy.get('input, textarea, select').each(($input) => {
        const id = $input.attr('id')
        const ariaLabel = $input.attr('aria-label')
        const ariaLabelledBy = $input.attr('aria-labelledby')
        
        if (id) {
          cy.get(`label[for="${id}"]`).should('exist')
        } else {
          expect(ariaLabel || ariaLabelledBy).to.exist
        }
      })
    })
  } else {
    // Run checks on entire page
    cy.get('img').should('have.attr', 'alt')
    cy.get('[role="button"], button').should('be.visible')
  }
})

// Performance measurement command
Cypress.Commands.add('measurePerformance', (name: string) => {
  cy.window().then((win) => {
    win.performance.mark(`${name}-start`)
  })
  
  // Return a function to end the measurement
  return cy.window().then((win) => {
    return () => {
      win.performance.mark(`${name}-end`)
      win.performance.measure(name, `${name}-start`, `${name}-end`)
      
      const measure = win.performance.getEntriesByName(name, 'measure')[0]
      cy.log(`Performance: ${name} took ${measure.duration.toFixed(2)}ms`)
      
      // Clean up
      win.performance.clearMarks(`${name}-start`)
      win.performance.clearMarks(`${name}-end`)
      win.performance.clearMeasures(name)
      
      return measure.duration
    }
  })
})

// Network condition simulation
Cypress.Commands.add('simulateNetworkCondition', (condition: 'slow' | 'offline') => {
  if (condition === 'offline') {
    // Intercept all API calls and fail them
    cy.intercept('**', { forceNetworkError: true })
  } else if (condition === 'slow') {
    // Add delay to all API calls
    cy.intercept('**/api/**', (req) => {
      req.reply((res) => {
        res.delay(2000) // 2 second delay
      })
    })
  }
})

// Tab navigation command
Cypress.Commands.add('tab', { prevSubject: 'element' }, (subject) => {
  return cy.wrap(subject).trigger('keydown', { key: 'Tab' })
})

// Global before hook for common setup
beforeEach(() => {
  // Mock common API endpoints
  cy.intercept('GET', '/api/user/profile', {
    statusCode: 200,
    body: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      subscription: {
        plan: 'pro',
        status: 'active'
      }
    }
  }).as('getUserProfile')
  
  cy.intercept('GET', '/api/templates', {
    statusCode: 200,
    body: []
  }).as('getTemplates')
  
  cy.intercept('GET', '/api/content', {
    statusCode: 200,
    body: {
      data: [],
      total: 0,
      page: 1,
      limit: 10
    }
  }).as('getContent')
})

// Global after hook for cleanup
afterEach(() => {
  // Clear any performance marks/measures
  cy.window().then((win) => {
    win.performance.clearMarks()
    win.performance.clearMeasures()
  })
})

export {}