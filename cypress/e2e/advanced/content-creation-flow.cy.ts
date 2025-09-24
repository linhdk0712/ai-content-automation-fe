describe('Advanced Content Creation Flow', () => {
  beforeEach(() => {
    // Setup test data
    cy.task('db:seed')
    
    // Login as test user
    cy.login('test@example.com', 'password123')
    
    // Visit content creation page
    cy.visit('/content/create')
    
    // Wait for page to load
    cy.get('[data-testid="content-creator"]').should('be.visible')
  })

  afterEach(() => {
    // Cleanup test data
    cy.task('db:cleanup')
  })

  it('should create manual content with full workflow', () => {
    // Fill content form
    cy.get('[data-testid="content-title"]')
      .type('E2E Test Content Title')
    
    cy.get('[data-testid="content-body"]')
      .type('This is a comprehensive E2E test content that validates the entire content creation workflow including validation, preview, and saving functionality.')
    
    // Select content type
    cy.get('[data-testid="content-type-select"]').click()
    cy.get('[data-value="BLOG_POST"]').click()
    
    // Add tags
    cy.get('[data-testid="content-tags"]')
      .type('e2e{enter}testing{enter}automation{enter}')
    
    // Preview content
    cy.get('[data-testid="preview-button"]').click()
    
    // Verify preview modal
    cy.get('[data-testid="preview-modal"]').should('be.visible')
    cy.get('[data-testid="preview-title"]')
      .should('contain.text', 'E2E Test Content Title')
    cy.get('[data-testid="preview-body"]')
      .should('contain.text', 'This is a comprehensive E2E test')
    
    // Close preview
    cy.get('[data-testid="preview-close"]').click()
    
    // Save content
    cy.get('[data-testid="save-content"]').click()
    
    // Verify success notification
    cy.get('[data-testid="notification"]')
      .should('be.visible')
      .and('contain.text', 'Content created successfully')
    
    // Verify redirect to content list
    cy.url().should('include', '/content')
    
    // Verify content appears in list
    cy.get('[data-testid="content-list"]')
      .should('contain.text', 'E2E Test Content Title')
    
    // Take screenshot for visual regression
    cy.screenshot('content-creation-success')
  })

  it('should generate AI content with provider selection', () => {
    // Switch to AI generation tab
    cy.get('[data-testid="ai-generation-tab"]').click()
    
    // Wait for AI providers to load
    cy.get('[data-testid="ai-providers"]').should('be.visible')
    
    // Select GPT-4 provider
    cy.get('[data-testid="provider-gpt-4"]').click()
    
    // Verify cost estimation appears
    cy.get('[data-testid="cost-estimation"]').should('be.visible')
    
    // Enter prompt
    cy.get('[data-testid="ai-prompt"]')
      .type('Write a comprehensive blog post about the benefits of automated content creation for digital marketing. Include statistics, best practices, and real-world examples.')
    
    // Verify cost updates
    cy.get('[data-testid="estimated-cost"]')
      .should('contain.text', '$')
    
    // Generate content
    cy.get('[data-testid="generate-content"]').click()
    
    // Verify loading state
    cy.get('[data-testid="generation-loading"]').should('be.visible')
    cy.get('[data-testid="generate-content"]').should('be.disabled')
    
    // Wait for generation to complete (with timeout)
    cy.get('[data-testid="generated-content"]', { timeout: 30000 })
      .should('be.visible')
    
    // Verify generated content
    cy.get('[data-testid="generated-title"]').should('not.be.empty')
    cy.get('[data-testid="generated-body"]').should('not.be.empty')
    
    // Edit generated content
    cy.get('[data-testid="edit-generated"]').click()
    cy.get('[data-testid="content-title"]')
      .clear()
      .type('AI Generated: Benefits of Automated Content Creation')
    
    // Save AI generated content
    cy.get('[data-testid="save-content"]').click()
    
    // Verify success
    cy.get('[data-testid="notification"]')
      .should('contain.text', 'AI content saved successfully')
    
    // Take screenshot
    cy.screenshot('ai-content-generation-success')
  })

  it('should handle template usage workflow', () => {
    // Open template selector
    cy.get('[data-testid="use-template"]').click()
    
    // Verify template modal
    cy.get('[data-testid="template-modal"]').should('be.visible')
    
    // Filter templates by category
    cy.get('[data-testid="template-category-filter"]').click()
    cy.get('[data-value="MARKETING"]').click()
    
    // Search for specific template
    cy.get('[data-testid="template-search"]')
      .type('social media post')
    
    // Select template
    cy.get('[data-testid="template-item"]').first().click()
    
    // Verify template preview
    cy.get('[data-testid="template-preview"]').should('be.visible')
    
    // Use template
    cy.get('[data-testid="use-template-button"]').click()
    
    // Verify template content is loaded
    cy.get('[data-testid="content-title"]').should('not.be.empty')
    cy.get('[data-testid="content-body"]').should('not.be.empty')
    
    // Customize template variables
    cy.get('[data-testid="template-variable-product"]')
      .clear()
      .type('AI Content Automation Platform')
    
    cy.get('[data-testid="template-variable-benefit"]')
      .clear()
      .type('Save 80% time on content creation')
    
    // Apply template variables
    cy.get('[data-testid="apply-variables"]').click()
    
    // Verify content is updated
    cy.get('[data-testid="content-body"]')
      .should('contain.text', 'AI Content Automation Platform')
      .and('contain.text', 'Save 80% time on content creation')
    
    // Save templated content
    cy.get('[data-testid="save-content"]').click()
    
    // Take screenshot
    cy.screenshot('template-usage-success')
  })

  it('should validate form inputs and show errors', () => {
    // Try to save empty form
    cy.get('[data-testid="save-content"]').click()
    
    // Verify validation errors
    cy.get('[data-testid="title-error"]')
      .should('be.visible')
      .and('contain.text', 'Title is required')
    
    cy.get('[data-testid="content-error"]')
      .should('be.visible')
      .and('contain.text', 'Content is required')
    
    // Fill title but leave content empty
    cy.get('[data-testid="content-title"]')
      .type('Test Title')
    
    cy.get('[data-testid="save-content"]').click()
    
    // Verify title error is gone but content error remains
    cy.get('[data-testid="title-error"]').should('not.exist')
    cy.get('[data-testid="content-error"]').should('be.visible')
    
    // Test title length validation
    cy.get('[data-testid="content-title"]')
      .clear()
      .type('A'.repeat(201)) // Exceed max length
    
    cy.get('[data-testid="title-error"]')
      .should('be.visible')
      .and('contain.text', 'Title must be less than 200 characters')
    
    // Test content length validation
    cy.get('[data-testid="content-body"]')
      .type('A'.repeat(10001)) // Exceed max length
    
    cy.get('[data-testid="content-error"]')
      .should('be.visible')
      .and('contain.text', 'Content must be less than 10000 characters')
    
    // Take screenshot of validation errors
    cy.screenshot('form-validation-errors')
  })

  it('should handle network errors gracefully', () => {
    // Intercept API calls to simulate errors
    cy.intercept('POST', '/api/v1/content', {
      statusCode: 500,
      body: { message: 'Internal server error' }
    }).as('createContentError')
    
    // Fill valid form
    cy.get('[data-testid="content-title"]')
      .type('Network Error Test')
    
    cy.get('[data-testid="content-body"]')
      .type('Testing network error handling')
    
    // Try to save
    cy.get('[data-testid="save-content"]').click()
    
    // Wait for API call
    cy.wait('@createContentError')
    
    // Verify error notification
    cy.get('[data-testid="error-notification"]')
      .should('be.visible')
      .and('contain.text', 'Failed to save content')
    
    // Verify form is still editable
    cy.get('[data-testid="content-title"]').should('not.be.disabled')
    cy.get('[data-testid="save-content"]').should('not.be.disabled')
    
    // Take screenshot
    cy.screenshot('network-error-handling')
  })

  it('should support keyboard shortcuts', () => {
    // Fill form
    cy.get('[data-testid="content-title"]')
      .type('Keyboard Shortcut Test')
    
    cy.get('[data-testid="content-body"]')
      .type('Testing keyboard shortcuts functionality')
      .focus()
    
    // Test Ctrl+S to save
    cy.get('body').type('{ctrl+s}')
    
    // Verify save was triggered
    cy.get('[data-testid="notification"]')
      .should('be.visible')
      .and('contain.text', 'Content created successfully')
    
    // Test Ctrl+P for preview (on new content)
    cy.visit('/content/create')
    cy.get('[data-testid="content-title"]').type('Preview Shortcut Test')
    cy.get('[data-testid="content-body"]').type('Testing preview shortcut')
    
    cy.get('body').type('{ctrl+p}')
    
    // Verify preview modal opens
    cy.get('[data-testid="preview-modal"]').should('be.visible')
  })

  it('should auto-save drafts', () => {
    // Enable auto-save in settings (if needed)
    cy.window().then((win) => {
      win.localStorage.setItem('autoSaveEnabled', 'true')
    })
    
    // Start typing content
    cy.get('[data-testid="content-title"]')
      .type('Auto-save Test Title')
    
    cy.get('[data-testid="content-body"]')
      .type('This content should be auto-saved as draft')
    
    // Wait for auto-save (typically 5 seconds)
    cy.wait(6000)
    
    // Verify draft indicator
    cy.get('[data-testid="draft-indicator"]')
      .should('be.visible')
      .and('contain.text', 'Draft saved')
    
    // Refresh page to test draft recovery
    cy.reload()
    
    // Verify draft is recovered
    cy.get('[data-testid="draft-recovery-modal"]').should('be.visible')
    cy.get('[data-testid="recover-draft"]').click()
    
    // Verify content is restored
    cy.get('[data-testid="content-title"]')
      .should('have.value', 'Auto-save Test Title')
    
    cy.get('[data-testid="content-body"]')
      .should('contain.text', 'This content should be auto-saved as draft')
  })
})