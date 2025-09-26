import { authService } from '../services/auth.service'
import { debugResponseFormat } from './response-debug'

export async function testLoginFlow(usernameOrEmail: string, password: string) {
  console.log('=== Testing Login Flow ===')
  console.log('Credentials:', { usernameOrEmail, password: '***' })
  
  try {
    // Test the login
    const result = await authService.login(usernameOrEmail, password)
    
    console.log('✅ Login successful!')
    console.log('Auth Response:', result)
    
    // Verify tokens were set
    const accessToken = authService.getAccessToken()
    const refreshToken = authService.getRefreshToken()
    
    console.log('Tokens set:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      isAuthenticated: authService.isAuthenticated()
    })
    
    return {
      success: true,
      result,
      tokens: {
        accessToken: !!accessToken,
        refreshToken: !!refreshToken,
        isAuthenticated: authService.isAuthenticated()
      }
    }
    
  } catch (error) {
    console.log('❌ Login failed!')
    console.error('Error:', error)
    
    return {
      success: false,
      error: {
        message: (error as Error).message,
        code: (error as any).code,
        status: (error as any).status
      }
    }
  }
}

export async function testApiEndpoint(url: string, method: 'GET' | 'POST' = 'GET', data?: any) {
  console.log(`=== Testing API Endpoint: ${method} ${url} ===`)
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authService.getAccessToken() && {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        })
      },
      ...(data && { body: JSON.stringify(data) })
    })
    
    const responseData = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', responseData)
    
    // Debug the response format
    debugResponseFormat(responseData)
    
    return {
      success: response.ok,
      status: response.status,
      data: responseData
    }
    
  } catch (error) {
    console.error('API test failed:', error)
    return {
      success: false,
      error: (error as Error).message
    }
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testLoginFlow = testLoginFlow;
  (window as any).testApiEndpoint = testApiEndpoint;
  (window as any).debugResponseFormat = debugResponseFormat;
}