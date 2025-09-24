describe('Visual Regression Tests', () => {
  beforeEach(() => {
    // Set viewport for consistent screenshots
    cy.viewport(1920, 1080)
    
    // Login and setup test data
    cy.task('db:seed')
    cy.login('test@example.com', 'password123')
  })

  afterEach(() => {
    cy.task('db:cleanup')
  })

  describe('Dashboard Views', () => {
    it('should match dashboard layout', () => {
      cy.visit('/dashboard')
      
      // Wait for all components to load
      cy.get('[data-testid="dashboard-stats"]').should('be.visible')
      cy.get('[data-testid="recent-content"]').should('be.visible')
      cy.get('[data-testid="analytics-chart"]').should('be.visible')
      
      // Hide dynamic elements (dates, real-time data)
      cy.get('[data-testid="current-time"]').invoke('css', 'visibility', 'hidden')
      cy.get('[data-testid="live-metrics"]').invoke('css', 'visibility', 'hidden')
      
      // Take full page screenshot
      cy.screenshot('dashboard-full-page', { 
        capture: 'fullPage',
        overwrite: true 
      })
      
      // Take viewport screenshot
      cy.screenshot('dashboard-viewport', { 
        capture: 'viewport',
        overwrite: true 
      })
    })

    it('should match dashboard in dark mode', () => {
      // Switch to dark mode
      cy.get('[data-testid="theme-toggle"]').click()
      cy.get('[data-theme="dark"]').should('exist')
      
      cy.visit('/dashboard')
      
      // Wait for theme to apply
      cy.wait(500)
      
      // Hide dynamic elements
      cy.get('[data-testid="current-time"]').invoke('css', 'visibility', 'hidden')
      cy.get('[data-testid="live-metrics"]').invoke('css', 'visibility', 'hidden')
      
      cy.screenshot('dashboard-dark-mode', { 
        capture: 'fullPage',
        overwrite: true 
      })
    })

    it('should match mobile dashboard layout', () => {
      cy.viewport('iphone-x')
      cy.visit('/dashboard')
      
      // Wait for mobile layout
      cy.get('[data-testid="mobile-nav"]').should('be.visible')
      cy.get('[data-testid="dashboard-mobile"]').should('be.visible')
      
      // Hide dynamic elements
      cy.get('[data-testid="current-time"]').invoke('css', 'visibility', 'hidden')
      
      cy.screenshot('dashboard-mobile', { 
        capture: 'fullPage',
        overwrite: true 
      })
    })
  })

  describe('Content Creation Interface', () => {
    it('should match content creator layout', () => {
      cy.visit('/content/create')
      
      // Wait for form to load
      cy.get('[data-testid="content-creator"]').should('be.visible')
      cy.get('[data-testid="ai-providers"]').should('be.visible')
      
      cy.screenshot('content-creator-initial', { 
        capture: 'fullPage',
        overwrite: true 
      })
    })

    it('should match AI generation interface', () => {
      cy.visit('/content/create')
      
      // Switch to AI tab
      cy.get('[data-testid="ai-generation-tab"]').click()
      
      // Fill prompt to show cost estimation
      cy.get('[data-testid="ai-prompt"]')
        .type('Write a blog post about AI content creation')
      
      // Wait for cost estimation
      cy.get('[data-testid="cost-estimation"]').should('be.visible')
      
      cy.screenshot('ai-generation-interface', { 
        capture: 'fullPage',
        overwrite: true 
      })
    })

    it('should match template selection modal', () => {
      cy.visit('/content/create')
      
      // Open template modal
      cy.get('[data-testid="use-template"]').click()
      
      // Wait for templates to load
      cy.get('[data-testid="template-modal"]').should('be.visible')
      cy.get('[data-testid="template-grid"]').should('be.visible')
      
      cy.screenshot('template-selection-modal', { 
        capture: 'viewport',
        overwrite: true 
      })
    })

    it('should match content preview modal', () => {
      cy.visit('/content/create')
      
      // Fill form
      cy.get('[data-testid="content-title"]')
        .type('Visual Regression Test Content')
      
      cy.get('[data-testid="content-body"]')
        .type('This is test content for visual regression testing. It includes multiple paragraphs and formatting to test the preview layout.\n\nSecond paragraph with more content to test scrolling and layout.')
      
      // Open preview
      cy.get('[data-testid="preview-button"]').click()
      
      // Wait for preview to render
      cy.get('[data-testid="preview-modal"]').should('be.visible')
      
      cy.screenshot('content-preview-modal', { 
        capture: 'viewport',
        overwrite: true 
      })
    })
  })

  describe('Analytics Dashboard', () => {
    it('should match analytics overview', () => {
      cy.visit('/analytics')
      
      // Wait for charts to load
      cy.get('[data-testid="analytics-dashboard"]').should('be.visible')
      cy.get('[data-testid="performance-chart"]').should('be.visible')
      cy.get('[data-testid="engagement-metrics"]').should('be.visible')
      
      // Hide dynamic timestamps
      cy.get('[data-testid="last-updated"]').invoke('css', 'visibility', 'hidden')
      
      cy.screenshot('analytics-overview', { 
        capture: 'fullPage',
        overwrite: true 
      })
    })

    it('should match detailed analytics view', () => {
      cy.visit('/analytics')
      
      // Switch to detailed view
      cy.get('[data-testid="detailed-view-tab"]').click()
      
      // Wait for detailed charts
      cy.get('[data-testid="detailed-analytics"]').should('be.visible')
      cy.get('[data-testid="roi-calculator"]').should('be.visible')
      
      // Hide dynamic elements
      cy.get('[data-testid="real-time-data"]').invoke('css', 'visibility', 'hidden')
      
      cy.screenshot('analytics-detailed', { 
        capture: 'fullPage',
        overwrite: true 
      })
    })
  })

  describe('Form States and Interactions', () => {
    it('should match form validation states', () => {
      cy.visit('/content/create')
      
      // Trigger validation errors
      cy.get('[data-testid="save-content"]').click()
      
      // Wait for validation errors to appear
      cy.get('[data-testid="title-error"]').should('be.visible')
      cy.get('[data-testid="content-error"]').should('be.visible')
      
      cy.screenshot('form-validation-errors', { 
        capture: 'viewport',
        overwrite: true 
      })
    })

    it('should match loading states', () => {
      cy.visit('/content/create')
      
      // Switch to AI generation
      cy.get('[data-testid="ai-generation-tab"]').click()
      
      // Fill prompt
      cy.get('[data-testid="ai-prompt"]')
        .type('Generate content for testing')
      
      // Intercept API to delay response
      cy.intercept('POST', '/api/v1/content/generate', (req) => {
        req.reply((res) => {
          res.delay(2000)
          res.send({ fixture: 'generated-content.json' })
        })
      }).as('generateContent')
      
      // Start generation
      cy.get('[data-testid="generate-content"]').click()
      
      // Capture loading state
      cy.get('[data-testid="generation-loading"]').should('be.visible')
      
      cy.screenshot('ai-generation-loading', { 
        capture: 'viewport',
        overwrite: true 
      })
    })

    it('should match success states', () => {
      cy.visit('/content/create')
      
      // Fill and save content
      cy.get('[data-testid="content-title"]').type('Success State Test')
      cy.get('[data-testid="content-body"]').type('Test content')
      cy.get('[data-testid="save-content"]').click()
      
      // Wait for success notification
      cy.get('[data-testid="success-notification"]').should('be.visible')
      
      cy.screenshot('content-creation-success', { 
        capture: 'viewport',
        overwrite: true 
      })
    })

    it('should match error states', () => {
      // Intercept API to return error
      cy.intercept('POST', '/api/v1/content', {
        statusCode: 500,
        body: { message: 'Internal server error' }
      }).as('createContentError')
      
      cy.visit('/content/create')
      
      // Fill and save content
      cy.get('[data-testid="content-title"]').type('Error State Test')
      cy.get('[data-testid="content-body"]').type('Test content')
      cy.get('[data-testid="save-content"]').click()
      
      // Wait for error notification
      cy.wait('@createContentError')
      cy.get('[data-testid="error-notification"]').should('be.visible')
      
      cy.screenshot('content-creation-error', { 
        capture: 'viewport',
        overwrite: true 
      })
    })
  })

  describe('Responsive Design', () => {
    const viewports = [
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'laptop', width: 1366, height: 768 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 667 }
    ]

    viewports.forEach(({ name, width, height }) => {
      it(`should match layout on ${name}`, () => {
        cy.viewport(width, height)
        cy.visit('/dashboard')
        
        // Wait for responsive layout
        cy.wait(500)
        
        // Hide dynamic elements
        cy.get('[data-testid="current-time"]').invoke('css', 'visibility', 'hidden')
        
        cy.screenshot(`dashboard-${name}`, { 
          capture: 'fullPage',
          overwrite: true 
        })
      })
    })
  })

  describe('Component Variations', () => {
    it('should match button variations', () => {
      cy.visit('/styleguide') // Assuming you have a style guide page
      
      // Wait for all button variations to load
      cy.get('[data-testid="button-showcase"]').should('be.visible')
      
      cy.screenshot('button-variations', { 
        capture: 'viewport',
        overwrite: true 
      })
    })

    it('should match modal variations', () => {
      cy.visit('/content/create')
      
      // Test different modal types
      const modals = [
        { trigger: '[data-testid="use-template"]', name: 'template-modal' },
        { trigger: '[data-testid="preview-button"]', name: 'preview-modal' },
        { trigger: '[data-testid="help-button"]', name: 'help-modal' }
      ]

      modals.forEach(({ trigger, name }) => {
        // Fill required fields if needed
        if (name === 'preview-modal') {
          cy.get('[data-testid="content-title"]').type('Test Title')
          cy.get('[data-testid="content-body"]').type('Test content')
        }
        
        cy.get(trigger).click()
        cy.get(`[data-testid="${name}"]`).should('be.visible')
        
        cy.screenshot(`modal-${name}`, { 
          capture: 'viewport',
          overwrite: true 
        })
        
        // Close modal
        cy.get('[data-testid="modal-close"]').click()
        cy.wait(300) // Wait for close animation
      })
    })
  })
})