describe('Content Creation Flow', () => {
  beforeEach(() => {
    cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'))
  })

  describe('Manual Content Creation', () => {
    it('should create content manually', () => {
      cy.visit('/content/create')
      
      // Fill in content form
      cy.get('input[name="title"]').type('Test Content Title')
      cy.get('textarea[name="content"]').type('This is test content created manually.')
      
      // Select content type
      cy.get('[data-testid="content-type-select"]').click()
      cy.get('[data-value="text"]').click()
      
      // Save content
      cy.get('button[data-testid="save-content"]').click()
      
      // Should show success message
      cy.get('[data-testid="success-message"]').should('be.visible')
      cy.get('[data-testid="success-message"]').should('contain', 'Content saved successfully')
      
      // Should redirect to content list or show in preview
      cy.get('[data-testid="content-preview"]').should('be.visible')
    })

    it('should validate required fields', () => {
      cy.visit('/content/create')
      
      // Try to save without filling required fields
      cy.get('button[data-testid="save-content"]').click()
      
      // Should show validation errors
      cy.get('input[name="title"]').should('have.attr', 'aria-invalid', 'true')
      cy.get('textarea[name="content"]').should('have.attr', 'aria-invalid', 'true')
    })

    it('should save as draft', () => {
      cy.visit('/content/create')
      
      cy.get('input[name="title"]').type('Draft Content')
      cy.get('textarea[name="content"]').type('This is draft content.')
      
      // Save as draft
      cy.get('button[data-testid="save-draft"]').click()
      
      cy.get('[data-testid="success-message"]').should('contain', 'Draft saved')
    })
  })

  describe('AI Content Generation', () => {
    it('should generate content with AI', () => {
      cy.visit('/content/create')
      
      // Switch to AI generation mode
      cy.get('[data-testid="ai-generation-tab"]').click()
      
      // Select AI provider
      cy.get('[data-testid="ai-provider-select"]').click()
      cy.get('[data-value="openai"]').click()
      
      // Enter prompt
      cy.get('textarea[name="prompt"]').type('Generate a marketing email for a new product launch')
      
      // Mock AI generation response
      cy.intercept('POST', '/api/content/generate', {
        statusCode: 200,
        body: {
          title: 'Exciting Product Launch!',
          content: 'We are thrilled to announce the launch of our revolutionary new product...',
          aiGenerated: true,
          cost: 0.05
        }
      }).as('generateContent')
      
      // Generate content
      cy.get('button[data-testid="generate-content"]').click()
      
      // Should show loading state
      cy.get('[data-testid="generating-indicator"]').should('be.visible')
      
      cy.wait('@generateContent')
      
      // Should display generated content
      cy.get('input[name="title"]').should('have.value', 'Exciting Product Launch!')
      cy.get('textarea[name="content"]').should('contain', 'We are thrilled to announce')
      
      // Should show generation cost
      cy.get('[data-testid="generation-cost"]').should('contain', '$0.05')
    })

    it('should handle AI generation errors', () => {
      cy.visit('/content/create')
      
      cy.get('[data-testid="ai-generation-tab"]').click()
      cy.get('textarea[name="prompt"]').type('Generate content')
      
      // Mock AI generation error
      cy.intercept('POST', '/api/content/generate', {
        statusCode: 500,
        body: { error: 'AI service unavailable' }
      }).as('generateContentError')
      
      cy.get('button[data-testid="generate-content"]').click()
      cy.wait('@generateContentError')
      
      // Should show error message
      cy.get('[data-testid="error-message"]').should('contain', 'AI service unavailable')
    })

    it('should show cost estimation before generation', () => {
      cy.visit('/content/create')
      
      cy.get('[data-testid="ai-generation-tab"]').click()
      cy.get('textarea[name="prompt"]').type('Generate a long marketing article about AI technology')
      
      // Mock cost estimation
      cy.intercept('POST', '/api/content/estimate-cost', {
        statusCode: 200,
        body: { estimatedCost: 0.12, tokens: 800 }
      }).as('estimateCost')
      
      cy.get('button[data-testid="estimate-cost"]').click()
      cy.wait('@estimateCost')
      
      // Should show cost estimation
      cy.get('[data-testid="cost-estimate"]').should('contain', '$0.12')
      cy.get('[data-testid="token-estimate"]').should('contain', '800 tokens')
    })
  })

  describe('Template Usage', () => {
    it('should use template for content creation', () => {
      cy.visit('/content/create')
      
      // Switch to template mode
      cy.get('[data-testid="template-tab"]').click()
      
      // Mock template list
      cy.intercept('GET', '/api/templates', {
        statusCode: 200,
        body: [
          {
            id: '1',
            name: 'Marketing Email',
            description: 'Template for marketing emails',
            prompt: 'Create a marketing email for {product} targeting {audience}',
            category: 'marketing'
          }
        ]
      }).as('getTemplates')
      
      cy.wait('@getTemplates')
      
      // Select template
      cy.get('[data-testid="template-1"]').click()
      
      // Should load template prompt
      cy.get('textarea[name="prompt"]').should('contain', 'Create a marketing email')
      
      // Fill template variables
      cy.get('input[name="product"]').type('AI Content Tool')
      cy.get('input[name="audience"]').type('content creators')
      
      // Generate from template
      cy.intercept('POST', '/api/content/generate-from-template', {
        statusCode: 200,
        body: {
          title: 'Discover Our AI Content Tool',
          content: 'Dear content creators, we have an exciting new AI tool...',
          templateUsed: 'Marketing Email'
        }
      }).as('generateFromTemplate')
      
      cy.get('button[data-testid="generate-from-template"]').click()
      cy.wait('@generateFromTemplate')
      
      // Should display generated content
      cy.get('input[name="title"]').should('have.value', 'Discover Our AI Content Tool')
    })
  })

  describe('Content Preview and Editing', () => {
    it('should preview content in real-time', () => {
      cy.visit('/content/create')
      
      cy.get('input[name="title"]').type('Preview Test')
      cy.get('textarea[name="content"]').type('This content should appear in preview.')
      
      // Should show live preview
      cy.get('[data-testid="content-preview"]').should('contain', 'Preview Test')
      cy.get('[data-testid="content-preview"]').should('contain', 'This content should appear in preview.')
    })

    it('should show word count and reading time', () => {
      cy.visit('/content/create')
      
      const longContent = 'This is a longer piece of content. '.repeat(50)
      cy.get('textarea[name="content"]').type(longContent)
      
      // Should show statistics
      cy.get('[data-testid="word-count"]').should('be.visible')
      cy.get('[data-testid="reading-time"]').should('be.visible')
      cy.get('[data-testid="character-count"]').should('be.visible')
    })

    it('should allow content editing and formatting', () => {
      cy.visit('/content/create')
      
      cy.get('textarea[name="content"]').type('This is **bold** text and *italic* text.')
      
      // Should show formatted preview
      cy.get('[data-testid="content-preview"] strong').should('contain', 'bold')
      cy.get('[data-testid="content-preview"] em').should('contain', 'italic')
    })
  })

  describe('Content Scheduling', () => {
    it('should schedule content for later publishing', () => {
      cy.visit('/content/create')
      
      cy.get('input[name="title"]').type('Scheduled Content')
      cy.get('textarea[name="content"]').type('This content will be published later.')
      
      // Open scheduling options
      cy.get('[data-testid="schedule-toggle"]').click()
      
      // Set future date and time
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)
      
      cy.get('input[name="scheduledDate"]').type(futureDate.toISOString().split('T')[0])
      cy.get('input[name="scheduledTime"]').type('14:30')
      
      // Save scheduled content
      cy.get('button[data-testid="schedule-content"]').click()
      
      cy.get('[data-testid="success-message"]').should('contain', 'Content scheduled')
    })
  })

  describe('Performance and Accessibility', () => {
    it('should load content creation page quickly', () => {
      const startTime = Date.now()
      
      cy.visit('/content/create')
      cy.get('[data-testid="content-form"]').should('be.visible')
      
      cy.then(() => {
        const loadTime = Date.now() - startTime
        expect(loadTime).to.be.lessThan(3000) // Should load within 3 seconds
      })
    })

    it('should be accessible with keyboard navigation', () => {
      cy.visit('/content/create')
      
      // Tab through form elements
      cy.get('body').tab()
      cy.focused().should('have.attr', 'name', 'title')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'name', 'content')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-testid', 'content-type-select')
    })

    it('should work with screen readers', () => {
      cy.visit('/content/create')
      
      // Check for proper ARIA labels
      cy.get('input[name="title"]').should('have.attr', 'aria-label')
      cy.get('textarea[name="content"]').should('have.attr', 'aria-label')
      
      // Check for form validation messages
      cy.get('button[data-testid="save-content"]').click()
      cy.get('[role="alert"]').should('exist')
    })
  })
})