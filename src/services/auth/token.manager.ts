/**
 * Token Management Service
 * Handles JWT token storage, validation, and refresh logic with enhanced security and error handling
 */

import axios, { type AxiosError } from 'axios'
import type { ResponseBase } from '../../types/api.types'

// Constants
const TOKEN_STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken'
} as const

const TOKEN_REFRESH_CONFIG = {
    TIMEOUT_MS: 10000,
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 1000
} as const

const API_SUCCESS_CODE = 'SUCCESS'

// Enhanced logger with structured logging
const logger = {
    debug: (message: string, data?: unknown) => {
        if (import.meta.env.DEV) {
            console.log(`🔧 [TokenManager] ${message}`, data ? JSON.stringify(data, null, 2) : '')
        }
    },
    warn: (message: string, data?: unknown) => {
        console.warn(`⚠️ [TokenManager] ${message}`, data ? JSON.stringify(data, null, 2) : '')
    },
    error: (message: string, data?: unknown) => {
        console.error(`❌ [TokenManager] ${message}`, data ? JSON.stringify(data, null, 2) : '')
    }
}

// Custom error types for better error handling
export class TokenError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly cause?: Error
    ) {
        super(message)
        this.name = 'TokenError'
    }
}

export class TokenExpiredError extends TokenError {
    constructor(message = 'Token has expired') {
        super(message, 'TOKEN_EXPIRED')
    }
}

export class TokenRefreshError extends TokenError {
    constructor(message = 'Failed to refresh token', cause?: Error) {
        super(message, 'TOKEN_REFRESH_FAILED', cause)
    }
}

export interface AuthTokens {
    accessToken: string
    refreshToken: string
}

interface JWTPayload {
    exp?: number
    iat?: number
    sub?: string
    [key: string]: unknown
}

interface TokenStorage {
    getItem(key: string): string | null
    setItem(key: string, value: string): void
    removeItem(key: string): void
}

export class TokenManager {
    private static refreshPromise: Promise<string> | null = null
    private static storage: TokenStorage = localStorage

    /**
     * Set custom storage implementation (useful for testing or SSR)
     */
    static setStorage(storage: TokenStorage): void {
        this.storage = storage
    }

    /**
     * Get stored access token with validation
     */
    static getAccessToken(): string | null {
        try {
            const token = this.storage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN)
            if (!token) return null
            
            // Basic format validation
            if (!this.isValidJWTFormat(token)) {
                logger.warn('Invalid access token format detected, clearing token')
                this.clearTokens()
                return null
            }
            
            return token
        } catch (error) {
            logger.error('Failed to retrieve access token', error)
            return null
        }
    }

    /**
     * Get stored refresh token with validation
     */
    static getRefreshToken(): string | null {
        try {
            const token = this.storage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN)
            if (!token) return null
            
            // Basic format validation
            if (!this.isValidJWTFormat(token)) {
                logger.warn('Invalid refresh token format detected, clearing tokens')
                this.clearTokens()
                return null
            }
            
            return token
        } catch (error) {
            logger.error('Failed to retrieve refresh token', error)
            return null
        }
    }

    /**
     * Store authentication tokens securely
     */
    static setTokens(accessToken: string, refreshToken: string): void {
        if (!accessToken || !refreshToken) {
            throw new TokenError('Both access and refresh tokens are required', 'INVALID_TOKENS')
        }

        if (!this.isValidJWTFormat(accessToken) || !this.isValidJWTFormat(refreshToken)) {
            throw new TokenError('Invalid token format provided', 'INVALID_TOKEN_FORMAT')
        }

        try {
            this.storage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, accessToken)
            this.storage.setItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
            logger.debug('Tokens stored successfully')
        } catch (error) {
            logger.error('Failed to store tokens', error)
            throw new TokenError('Failed to store authentication tokens', 'STORAGE_ERROR', error as Error)
        }
    }

    /**
     * Clear all stored tokens and reset state
     */
    static clearTokens(): void {
        try {
            this.storage.removeItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN)
            this.storage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN)
            this.refreshPromise = null
            logger.debug('Tokens cleared successfully')
        } catch (error) {
            logger.error('Failed to clear tokens', error)
        }
    }

    /**
     * Validate JWT token format (basic structure check)
     */
    private static isValidJWTFormat(token: string): boolean {
        if (!token || typeof token !== 'string') return false
        const parts = token.split('.')
        return parts.length === 3 && parts.every(part => part.length > 0)
    }

    /**
     * Check if a JWT token is expired with buffer time
     */
    static isTokenExpired(token: string, bufferSeconds = 30): boolean {
        try {
            if (!this.isValidJWTFormat(token)) {
                logger.warn('Invalid JWT token format')
                return true
            }

            const payload = this.parseJWTPayload(token)
            if (!payload?.exp) {
                logger.warn('JWT token missing expiration claim')
                return true
            }

            const currentTime = Date.now() / 1000
            const expirationTime = payload.exp - bufferSeconds // Add buffer to prevent edge cases
            const isExpired = expirationTime <= currentTime

            if (import.meta.env.DEV && isExpired) {
                logger.debug('Token expired', {
                    exp: new Date(payload.exp * 1000).toISOString(),
                    now: new Date().toISOString(),
                    buffer: `${bufferSeconds}s`
                })
            }

            return isExpired
        } catch (error) {
            logger.warn('Failed to parse JWT token', error)
            return true
        }
    }

    /**
     * Parse JWT payload safely
     */
    private static parseJWTPayload(token: string): JWTPayload | null {
        try {
            const parts = token.split('.')
            if (parts.length !== 3) return null
            
            // Add padding if needed for base64 decoding
            let payload = parts[1]
            while (payload.length % 4) {
                payload += '='
            }
            
            return JSON.parse(atob(payload)) as JWTPayload
        } catch (error) {
            logger.warn('Failed to parse JWT payload', error)
            return null
        }
    }

    /**
     * Get token expiration time
     */
    static getTokenExpiration(token: string): Date | null {
        const payload = this.parseJWTPayload(token)
        return payload?.exp ? new Date(payload.exp * 1000) : null
    }

    /**
     * Get time until token expires (in seconds)
     */
    static getTimeUntilExpiration(token: string): number | null {
        const payload = this.parseJWTPayload(token)
        if (!payload?.exp) return null
        
        const currentTime = Date.now() / 1000
        return Math.max(0, payload.exp - currentTime)
    }

    /**
     * Refresh access token using refresh token with retry logic
     * Prevents multiple simultaneous refresh requests
     */
    static async refreshAccessToken(): Promise<string> {
        // Prevent multiple simultaneous refresh requests
        if (this.refreshPromise) {
            logger.debug('Refresh already in progress, waiting for existing promise')
            return this.refreshPromise
        }

        const refreshToken = this.getRefreshToken()
        if (!refreshToken) {
            throw new TokenError('No refresh token available', 'NO_REFRESH_TOKEN')
        }

        // Check if refresh token is expired
        if (this.isTokenExpired(refreshToken)) {
            this.clearTokens()
            throw new TokenExpiredError('Refresh token has expired')
        }

        this.refreshPromise = this.performTokenRefreshWithRetry(refreshToken)

        try {
            const newAccessToken = await this.refreshPromise
            return newAccessToken
        } finally {
            this.refreshPromise = null
        }
    }

    /**
     * Perform token refresh with retry logic
     */
    private static async performTokenRefreshWithRetry(
        refreshToken: string,
        attempt = 1
    ): Promise<string> {
        try {
            return await this.performTokenRefresh(refreshToken)
        } catch (error) {
            if (attempt < TOKEN_REFRESH_CONFIG.MAX_RETRIES && this.isRetryableError(error)) {
                logger.debug(`Token refresh attempt ${attempt} failed, retrying...`, error)
                await this.delay(TOKEN_REFRESH_CONFIG.RETRY_DELAY_MS * attempt)
                return this.performTokenRefreshWithRetry(refreshToken, attempt + 1)
            }
            throw error
        }
    }

    /**
     * Check if error is retryable (network errors, timeouts, 5xx)
     */
    private static isRetryableError(error: unknown): boolean {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status
            // Retry on network errors, timeouts, or 5xx server errors
            return !status || status >= 500 || error.code === 'ECONNABORTED'
        }
        return false
    }

    /**
     * Utility delay function
     */
    private static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * Perform the actual token refresh API call with enhanced error handling
     */
    private static async performTokenRefresh(refreshToken: string): Promise<string> {
        const startTime = Date.now()
        
        try {
            logger.debug('Attempting to refresh access token')

            const apiUrl = `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/auth/refresh`
            const response = await axios.post<ResponseBase<AuthTokens>>(
                apiUrl,
                { refreshToken },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: TOKEN_REFRESH_CONFIG.TIMEOUT_MS,
                    validateStatus: (status) => status < 500 // Don't throw on 4xx errors
                }
            )

            const duration = Date.now() - startTime
            logger.debug(`Token refresh request completed in ${duration}ms`)

            // Handle API response format
            if (response.data.errorCode !== API_SUCCESS_CODE || !response.data.data) {
                const errorMessage = response.data.errorMessage || 'Token refresh failed'
                throw new TokenRefreshError(errorMessage)
            }

            const { accessToken, refreshToken: newRefreshToken } = response.data.data

            // Validate new tokens before storing
            if (!accessToken || !newRefreshToken) {
                throw new TokenRefreshError('Invalid tokens received from server')
            }

            // Store new tokens
            this.setTokens(accessToken, newRefreshToken)
            
            logger.debug('Access token refreshed successfully', {
                duration: `${duration}ms`,
                newTokenExpiry: this.getTokenExpiration(accessToken)?.toISOString()
            })
            
            return accessToken

        } catch (error) {
            const duration = Date.now() - startTime
            logger.error('Token refresh failed', { duration: `${duration}ms`, error })
            
            // Handle different error types
            if (error instanceof TokenRefreshError) {
                this.clearTokens()
                throw error
            }
            
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError<ResponseBase<unknown>>
                
                // Handle specific HTTP status codes
                if (axiosError.response?.status === 401) {
                    this.clearTokens()
                    throw new TokenExpiredError('Refresh token expired or invalid')
                }
                
                if (axiosError.response?.status === 403) {
                    this.clearTokens()
                    throw new TokenRefreshError('Refresh token access denied')
                }
                
                if (axiosError.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
                    this.clearTokens()
                    const errorMessage = axiosError.response.data?.errorMessage || 'Client error during token refresh'
                    throw new TokenRefreshError(errorMessage)
                }
                
                // Network or server errors
                const errorMessage = axiosError.code === 'ECONNABORTED' 
                    ? 'Token refresh request timed out'
                    : `Token refresh failed: ${axiosError.message}`
                    
                throw new TokenRefreshError(errorMessage, axiosError)
            }
            
            // Unknown error
            throw new TokenRefreshError('Token refresh failed due to unknown error', error as Error)
        }
    }

    /**
     * Get valid access token (refresh if needed) with comprehensive validation
     */
    static async getValidAccessToken(): Promise<string | null> {
        try {
            const accessToken = this.getAccessToken()
            
            if (!accessToken) {
                logger.debug('No access token found')
                return null
            }

            // Check if token is expired (with buffer)
            if (this.isTokenExpired(accessToken)) {
                logger.debug('Access token expired, attempting refresh')
                try {
                    return await this.refreshAccessToken()
                } catch (error) {
                    logger.error('Failed to refresh expired token', error)
                    return null
                }
            }

            return accessToken
        } catch (error) {
            logger.error('Error getting valid access token', error)
            return null
        }
    }

    /**
     * Check if user has valid authentication with comprehensive validation
     */
    static hasValidAuth(): boolean {
        try {
            const accessToken = this.getAccessToken()
            const refreshToken = this.getRefreshToken()
            
            if (!accessToken || !refreshToken) {
                return false
            }

            // If access token is not expired, we have valid auth
            if (!this.isTokenExpired(accessToken)) {
                return true
            }

            // If access token is expired but refresh token is valid, we still have auth
            return !this.isTokenExpired(refreshToken)
        } catch (error) {
            logger.error('Error checking auth validity', error)
            return false
        }
    }

    /**
     * Get authentication status with detailed information
     */
    static getAuthStatus(): {
        hasAuth: boolean
        accessTokenValid: boolean
        refreshTokenValid: boolean
        accessTokenExpiry: Date | null
        refreshTokenExpiry: Date | null
        timeUntilAccessExpiry: number | null
        timeUntilRefreshExpiry: number | null
    } {
        const accessToken = this.getAccessToken()
        const refreshToken = this.getRefreshToken()
        
        const accessTokenValid = accessToken ? !this.isTokenExpired(accessToken) : false
        const refreshTokenValid = refreshToken ? !this.isTokenExpired(refreshToken) : false
        
        return {
            hasAuth: !!(accessToken && refreshToken),
            accessTokenValid,
            refreshTokenValid,
            accessTokenExpiry: accessToken ? this.getTokenExpiration(accessToken) : null,
            refreshTokenExpiry: refreshToken ? this.getTokenExpiration(refreshToken) : null,
            timeUntilAccessExpiry: accessToken ? this.getTimeUntilExpiration(accessToken) : null,
            timeUntilRefreshExpiry: refreshToken ? this.getTimeUntilExpiration(refreshToken) : null
        }
    }

    /**
     * Force token refresh (useful for testing or manual refresh)
     */
    static async forceRefresh(): Promise<string> {
        this.refreshPromise = null // Clear any existing refresh promise
        return this.refreshAccessToken()
    }

    /**
     * Validate token format and basic claims
     */
    static validateToken(token: string): { valid: boolean; reason?: string; payload?: JWTPayload } {
        if (!token) {
            return { valid: false, reason: 'Token is empty' }
        }

        if (!this.isValidJWTFormat(token)) {
            return { valid: false, reason: 'Invalid JWT format' }
        }

        const payload = this.parseJWTPayload(token)
        if (!payload) {
            return { valid: false, reason: 'Cannot parse token payload' }
        }

        if (!payload.exp) {
            return { valid: false, reason: 'Token missing expiration claim' }
        }

        if (this.isTokenExpired(token)) {
            return { valid: false, reason: 'Token is expired', payload }
        }

        return { valid: true, payload }
    }
}
