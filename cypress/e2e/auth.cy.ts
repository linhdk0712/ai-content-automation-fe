describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear any existing auth state
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  describe('Login', () => {
    it('should login successfully with valid credentials', () => {
      cy.visit('/login')
      
      // Check page loads correctly
      cy.get('[data-testid="login-form"]').should('be.visible')
      cy.get('input[name="email"]').should('be.visible')
      cy.get('input[name="password"]').should('be.visible')
      
      // Fill in credentials
      cy.get('input[name="email"]').type(Cypress.env('TEST_USER_EMAIL'))
      cy.get('input[name="password"]').type(Cypress.env('TEST_USER_PASSWORD'))
      
      // Submit form
      cy.get('button[type="submit"]').click()
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="dashboard"]').should('be.visible')
      
      // Should store auth token
      cy.window().its('localStorage').invoke('getItem', 'auth-token').should('exist')
    })

    it('should show error for invalid credentials', () => {
      cy.visit('/login')
      
      cy.get('input[name="email"]').type('invalid@example.com')
      cy.get('input[name="password"]').type('wrongpassword')
      cy.get('button[type="submit"]').click()
      
      // Should show error message
      cy.get('[data-testid="error-message"]').should('be.visible')
      cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials')
      
      // Should stay on login page
      cy.url().should('include', '/login')
    })

    it('should validate required fields', () => {
      cy.visit('/login')
      
      // Try to submit without filling fields
      cy.get('button[type="submit"]').click()
      
      // Should show validation errors
      cy.get('input[name="email"]').should('have.attr', 'aria-invalid', 'true')
      cy.get('input[name="password"]').should('have.attr', 'aria-invalid', 'true')
    })

    it('should handle network errors gracefully', () => {
      // Intercept login request and simulate network error
      cy.intercept('POST', '/api/auth/login', { forceNetworkError: true }).as('loginRequest')
      
      cy.visit('/login')
      cy.get('input[name="email"]').type(Cypress.env('TEST_USER_EMAIL'))
      cy.get('input[name="password"]').type(Cypress.env('TEST_USER_PASSWORD'))
      cy.get('button[type="submit"]').click()
      
      cy.wait('@loginRequest')
      
      // Should show network error message
      cy.get('[data-testid="error-message"]').should('contain', 'Network error')
    })
  })

  describe('Registration', () => {
    it('should register new user successfully', () => {
      cy.visit('/register')
      
      const timestamp = Date.now()
      const testEmail = `test${timestamp}@example.com`
      
      cy.get('input[name="name"]').type('Test User')
      cy.get('input[name="email"]').type(testEmail)
      cy.get('input[name="password"]').type('password123')
      cy.get('input[name="confirmPassword"]').type('password123')
      
      // Mock successful registration
      cy.intercept('POST', '/api/auth/register', {
        statusCode: 201,
        body: {
          user: { id: '1', email: testEmail, name: 'Test User' },
          token: 'jwt-token'
        }
      }).as('registerRequest')
      
      cy.get('button[type="submit"]').click()
      cy.wait('@registerRequest')
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
    })

    it('should validate password confirmation', () => {
      cy.visit('/register')
      
      cy.get('input[name="password"]').type('password123')
      cy.get('input[name="confirmPassword"]').type('differentpassword')
      cy.get('button[type="submit"]').click()
      
      // Should show password mismatch error
      cy.get('[data-testid="password-error"]').should('contain', 'Passwords do not match')
    })
  })

  describe('Logout', () => {
    beforeEach(() => {
      // Login first
      cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'))
    })

    it('should logout successfully', () => {
      cy.visit('/dashboard')
      
      // Click logout button
      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="logout-button"]').click()
      
      // Should redirect to login page
      cy.url().should('include', '/login')
      
      // Should clear auth token
      cy.window().its('localStorage').invoke('getItem', 'auth-token').should('not.exist')
    })
  })

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route without auth', () => {
      cy.visit('/dashboard')
      
      // Should redirect to login
      cy.url().should('include', '/login')
    })

    it('should allow access to protected routes when authenticated', () => {
      cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'))
      
      cy.visit('/dashboard')
      cy.url().should('include', '/dashboard')
      
      cy.visit('/content/create')
      cy.url().should('include', '/content/create')
      
      cy.visit('/templates')
      cy.url().should('include', '/templates')
    })
  })

  describe('Session Management', () => {
    it('should refresh token automatically', () => {
      cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'))
      
      // Mock token refresh
      cy.intercept('POST', '/api/auth/refresh', {
        statusCode: 200,
        body: { token: 'new-jwt-token' }
      }).as('refreshToken')
      
      // Simulate token expiry by making an API call that returns 401
      cy.intercept('GET', '/api/user/profile', {
        statusCode: 401,
        body: { error: 'Token expired' }
      }).as('profileRequest')
      
      cy.visit('/dashboard')
      cy.wait('@profileRequest')
      cy.wait('@refreshToken')
      
      // Should stay on dashboard after token refresh
      cy.url().should('include', '/dashboard')
    })

    it('should logout when refresh token is invalid', () => {
      cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'))
      
      // Mock failed token refresh
      cy.intercept('POST', '/api/auth/refresh', {
        statusCode: 401,
        body: { error: 'Invalid refresh token' }
      }).as('refreshToken')
      
      cy.intercept('GET', '/api/user/profile', {
        statusCode: 401,
        body: { error: 'Token expired' }
      }).as('profileRequest')
      
      cy.visit('/dashboard')
      cy.wait('@profileRequest')
      cy.wait('@refreshToken')
      
      // Should redirect to login
      cy.url().should('include', '/login')
    })
  })
})