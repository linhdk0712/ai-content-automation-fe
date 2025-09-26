import { ApiResponse } from '../types/api.types'
import { api, apiRequest, TokenManager } from './api'

// Auth-specific types
export interface LoginRequest {
  usernameOrEmail: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  firstName: string
  lastName?: string
  phoneNumber?: string
  timezone?: string
  language?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: UserInfo
}

export interface UserInfo {
  id: number
  username: string
  email: string
  firstName: string
  lastName?: string
  profilePictureUrl?: string
  emailVerified: boolean
}

export interface UserProfile {
  id: number
  username: string
  email: string
  firstName: string
  lastName?: string
  profilePictureUrl?: string
  phoneNumber?: string
  timezone?: string
  language?: string
  emailVerified: boolean
  isActive: boolean
  lastLoginAt?: string
  roles?: string[]
  oauthProvider?: string
  createdAt?: string
}

export interface AvailabilityResponse {
  available: boolean
}

export interface UpdateProfileRequest {
  firstName: string
  lastName?: string
  phoneNumber?: string
  timezone?: string
  language?: string
}

export interface EmailVerificationRequest {
  token: string
}

export interface ResendVerificationRequest {
  email: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface MFASetupRequest {
  method: 'TOTP' | 'SMS' | 'EMAIL'
  phoneNumber?: string
}

export interface MFAVerificationRequest {
  code: string
  method: 'TOTP' | 'SMS' | 'EMAIL'
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

// OAuth2 types
export interface OAuth2LoginRequest {
  provider: 'google' | 'facebook' | 'github'
  redirectUri: string
}

export interface OAuth2CallbackRequest {
  code: string
  state: string
  provider: string
}

class AuthService {
  // Enhanced login with better error handling
  async login(usernameOrEmail: string, password: string): Promise<AuthResponse> {
    try {
      const request: LoginRequest = { usernameOrEmail, password }

      // DEBUG: Use raw API call to see exact response
      console.log('Making raw API call to /auth/login')
      const response = await api.post('/auth/login', request)
      console.log('Raw response:', {
        status: response.status,
        data: response.data,
        dataType: typeof response.data
      })

      // Manual ResponseBase extraction
      const responseData = response.data
      let authData: AuthResponse

      if (responseData && typeof responseData === 'object' &&
        'errorCode' in responseData && 'errorMessage' in responseData && 'data' in responseData) {
        console.log('ResponseBase format detected')
        const responseBase = responseData as ResponseBase<AuthResponse>
        console.log('ResponseBase:', responseBase)

        // Simple rule: errorCode = "SUCCESS" means success, anything else is an error
        if (responseBase.errorCode !== 'SUCCESS') {
          console.log('Login error:', {
            errorCode: responseBase.errorCode,
            errorMessage: responseBase.errorMessage
          })
          throw new Error(responseBase.errorMessage || 'Login failed')
        } else {
          console.log('Login success:', {
            errorCode: responseBase.errorCode,
            errorMessage: responseBase.errorMessage
          })
        }

        authData = responseBase.data as AuthResponse
      } else {
        console.log('Direct format detected')
        authData = responseData as AuthResponse
      }

      console.log('Login response received:', authData)

      if (authData && authData.accessToken && authData.refreshToken) {
        console.log('Setting tokens:', {
          accessToken: authData.accessToken?.substring(0, 20) + '...',
          refreshToken: authData.refreshToken?.substring(0, 20) + '...'
        })
        TokenManager.setTokens(authData.accessToken, authData.refreshToken)

        // Verify tokens were set
        const storedAccessToken = TokenManager.getAccessToken()
        const storedRefreshToken = TokenManager.getRefreshToken()
        console.log('Tokens stored successfully:', {
          accessToken: storedAccessToken?.substring(0, 20) + '...',
          refreshToken: storedRefreshToken?.substring(0, 20) + '...'
        })
      } else {
        console.error('Invalid auth data received:', authData)
        throw new Error('Invalid authentication response')
      }

      return authData
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  // Enhanced registration with validation
  async register(request: RegisterRequest): Promise<string> {
    try {
      return await apiRequest.post<string>('/auth/register', request)
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  // Enhanced logout with proper cleanup
  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate server-side session
      await apiRequest.post('/auth/logout')
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error)
    } finally {
      // Always clear local tokens
      TokenManager.clearTokens()

      // Clear any cached user data
      this.clearUserCache()

      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }

  // Token refresh is now handled by TokenManager in api.ts
  async refreshToken(): Promise<AuthResponse> {
    try {
      const newAccessToken = await TokenManager.refreshAccessToken()

      // Get updated user info
      const user = await this.getCurrentUser()

      return {
        accessToken: newAccessToken,
        refreshToken: TokenManager.getRefreshToken() || '',
        tokenType: 'Bearer',
        expiresIn: 3600, // 1 hour default
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePictureUrl: user.profilePictureUrl,
          emailVerified: user.emailVerified
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      throw error
    }
  }

  // Enhanced user profile retrieval
  async getCurrentUser(): Promise<UserProfile> {
    try {
      // Debug: Check if we have a token before making the request
      const token = this.getAccessToken()
      console.log('getCurrentUser - Token available:', !!token)
      console.log('getCurrentUser - Token preview:', token ? token.substring(0, 30) + '...' : 'null')
      
      if (!token) {
        throw new Error('No access token available')
      }
      
      return await apiRequest.get<UserProfile>('/auth/me')
    } catch (error) {
      console.error('Failed to get current user:', error)
      throw error
    }
  }

  // Email verification
  async verifyEmail(token: string): Promise<string> {
    try {
      const request: EmailVerificationRequest = { token }
      return await apiRequest.post<string>('/auth/verify-email', request)
    } catch (error) {
      console.error('Email verification failed:', error)
      throw error
    }
  }

  async resendVerification(email: string): Promise<string> {
    try {
      const request: ResendVerificationRequest = { email }
      return await apiRequest.post<string>('/auth/resend-verification', request)
    } catch (error) {
      console.error('Failed to resend verification:', error)
      throw error
    }
  }

  // Password reset flow
  async forgotPassword(email: string): Promise<string> {
    try {
      const request: ForgotPasswordRequest = { email }
      return await apiRequest.post<string>('/auth/forgot-password', request)
    } catch (error) {
      console.error('Forgot password request failed:', error)
      throw error
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<string> {
    try {
      const request: ResetPasswordRequest = { token, newPassword }
      return await apiRequest.post<string>('/auth/reset-password', request)
    } catch (error) {
      console.error('Password reset failed:', error)
      throw error
    }
  }

  // Profile management
  async updateProfile(request: UpdateProfileRequest): Promise<ApiResponse> {
    try {
      const response = await apiRequest.put<ApiResponse>('/auth/profile', request)

      // Clear user cache to force refresh
      this.clearUserCache()

      return response
    } catch (error) {
      console.error('Profile update failed:', error)
      throw error
    }
  }

  async changePassword(request: ChangePasswordRequest): Promise<ApiResponse> {
    try {
      return await apiRequest.post<ApiResponse>('/auth/change-password', request)
    } catch (error) {
      console.error('Password change failed:', error)
      throw error
    }
  }

  // Account availability checks
  async checkUsernameAvailability(username: string): Promise<AvailabilityResponse> {
    try {
      return await apiRequest.get<AvailabilityResponse>(`/auth/check-username?username=${encodeURIComponent(username)}`)
    } catch (error) {
      console.error('Username availability check failed:', error)
      throw error
    }
  }

  async checkEmailAvailability(email: string): Promise<AvailabilityResponse> {
    try {
      return await apiRequest.get<AvailabilityResponse>(`/auth/check-email?email=${encodeURIComponent(email)}`)
    } catch (error) {
      console.error('Email availability check failed:', error)
      throw error
    }
  }

  // Multi-Factor Authentication
  async setupMFA(request: MFASetupRequest): Promise<any> {
    try {
      return await apiRequest.post('/auth/mfa/setup', request)
    } catch (error) {
      console.error('MFA setup failed:', error)
      throw error
    }
  }

  async verifyMFA(request: MFAVerificationRequest): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/mfa/verify', request)
      const authData = response.data as AuthResponse

      if (authData.accessToken && authData.refreshToken) {
        TokenManager.setTokens(authData.accessToken, authData.refreshToken)
      }

      return authData
    } catch (error) {
      console.error('MFA verification failed:', error)
      throw error
    }
  }

  async disableMFA(): Promise<ApiResponse> {
    try {
      return await apiRequest.post<ApiResponse>('/auth/mfa/disable')
    } catch (error) {
      console.error('MFA disable failed:', error)
      throw error
    }
  }

  // OAuth2 methods with enhanced error handling
  getOAuth2LoginUrl(provider: 'google' | 'facebook' | 'github'): string {
    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1'
    const redirectUri = encodeURIComponent(window.location.origin + '/oauth2/redirect')
    return `${baseUrl}/oauth2/authorize/${provider}?redirect_uri=${redirectUri}`
  }

  getGoogleLoginUrl(): string {
    return this.getOAuth2LoginUrl('google')
  }

  getFacebookLoginUrl(): string {
    return this.getOAuth2LoginUrl('facebook')
  }

  getGithubLoginUrl(): string {
    return this.getOAuth2LoginUrl('github')
  }

  async handleOAuth2Callback(code: string, state: string, provider: string): Promise<UserInfo> {
    try {
      const request: OAuth2CallbackRequest = { code, state, provider }
      const response = await api.post('/auth/oauth2/callback', request)
      const authData = response.data as AuthResponse

      if (authData.accessToken && authData.refreshToken) {
        TokenManager.setTokens(authData.accessToken, authData.refreshToken)
      }

      return authData.user
    } catch (error) {
      console.error('OAuth2 callback failed:', error)
      throw error
    }
  }

  // Enhanced token management using TokenManager
  getAccessToken(): string | null {
    return TokenManager.getAccessToken()
  }

  getRefreshToken(): string | null {
    return TokenManager.getRefreshToken()
  }

  setTokens(accessToken: string, refreshToken: string): void {
    TokenManager.setTokens(accessToken, refreshToken)
  }

  clearTokens(): void {
    TokenManager.clearTokens()
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken()
    console.log('Checking authentication:', {
      hasToken: !!token,
      tokenPreview: token?.substring(0, 20) + '...',
      isExpired: token ? TokenManager.isTokenExpired(token) : 'no token'
    })

    if (!token) return false

    const isValid = !TokenManager.isTokenExpired(token)
    console.log('Token validation result:', isValid)
    return isValid
  }

  // Enhanced utility methods
  getUserFromToken(): Partial<UserInfo> | null {
    const token = this.getAccessToken()
    if (!token) return null

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return {
        id: parseInt(payload.sub),
        username: payload.username,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName
      }
    } catch (error) {
      console.error('Failed to parse token:', error)
      return null
    }
  }

  // Session management
  async validateSession(): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        return false
      }

      // Verify with server
      await this.getCurrentUser()
      return true
    } catch (error) {
      console.warn('Session validation failed:', error)
      this.clearTokens()
      return false
    }
  }

  // Account management
  async deleteAccount(): Promise<ApiResponse> {
    try {
      const response = await apiRequest.delete<ApiResponse>('/auth/account')

      // Clear tokens after successful deletion
      this.clearTokens()
      this.clearUserCache()

      return response
    } catch (error) {
      console.error('Account deletion failed:', error)
      throw error
    }
  }

  async deactivateAccount(): Promise<ApiResponse> {
    try {
      return await apiRequest.post<ApiResponse>('/auth/account/deactivate')
    } catch (error) {
      console.error('Account deactivation failed:', error)
      throw error
    }
  }

  async reactivateAccount(email: string): Promise<ApiResponse> {
    try {
      return await apiRequest.post<ApiResponse>('/auth/account/reactivate', { email })
    } catch (error) {
      console.error('Account reactivation failed:', error)
      throw error
    }
  }

  // Privacy and data management
  async exportUserData(): Promise<Blob> {
    try {
      return await apiRequest.get('/auth/data/export', {
        responseType: 'blob'
      })
    } catch (error) {
      console.error('Data export failed:', error)
      throw error
    }
  }

  async getLoginHistory(): Promise<any[]> {
    try {
      return await apiRequest.get('/auth/login-history')
    } catch (error) {
      console.error('Failed to get login history:', error)
      throw error
    }
  }

  async getActiveSessions(): Promise<any[]> {
    try {
      return await apiRequest.get('/auth/sessions')
    } catch (error) {
      console.error('Failed to get active sessions:', error)
      throw error
    }
  }

  async revokeSession(sessionId: string): Promise<ApiResponse> {
    try {
      return await apiRequest.delete<ApiResponse>(`/auth/sessions/${sessionId}`)
    } catch (error) {
      console.error('Failed to revoke session:', error)
      throw error
    }
  }

  async revokeAllSessions(): Promise<ApiResponse> {
    try {
      const response = await apiRequest.delete<ApiResponse>('/auth/sessions/all')

      // Clear current tokens as well
      this.clearTokens()

      return response
    } catch (error) {
      console.error('Failed to revoke all sessions:', error)
      throw error
    }
  }

  // Cache management
  private clearUserCache(): void {
    // Clear any cached user data from localStorage or sessionStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_profile')
      localStorage.removeItem('user_preferences')
      sessionStorage.removeItem('user_session_data')
    }
  }

  // Event listeners for token expiration
  onTokenExpired(callback: () => void): void {
    // This could be enhanced to use event listeners
    window.addEventListener('token-expired', callback)
  }

  offTokenExpired(callback: () => void): void {
    window.removeEventListener('token-expired', callback)
  }
}

export const authService = new AuthService();