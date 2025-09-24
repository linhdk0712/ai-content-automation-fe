import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        log(message) {
          console.log(message)
          return null
        },
        
        // Performance monitoring
        measurePerformance() {
          return {
            timestamp: Date.now(),
            memory: process.memoryUsage()
          }
        }
      })

      // Code coverage
      require('@cypress/code-coverage/task')(on, config)
      
      return config
    },
    
    env: {
      // Test environment variables
      API_URL: 'http://localhost:8080/api',
      TEST_USER_EMAIL: 'test@example.com',
      TEST_USER_PASSWORD: 'password123'
    },
    
    // Retry configuration
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    // Experimental features
    experimentalStudio: true,
    experimentalMemoryManagement: true
  },

  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    },
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config)
      return config
    }
  }
})