import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ErrorHandler, ErrorType, ValidationErrorHelper } from '../utils/error-handler'
import { ApiError } from '../types/api.types'

// Mock toast service
vi.mock('../services/toast.service', () => ({
  toastService: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
    apiError: vi.fn()
  }
}))

describe('Enhanced Error Handling', () => {
  describe('ErrorHandler', () => {
    it('should process new ErrorResponse format correctly', () => {
      const backendError: ApiError = {
        timestamp: '2024-01-15T10:30:00',
        status: 400,
        error: 'Validation Error',
        message: 'Invalid input data',
        path: '/api/v1/content',
        errorCode: 'VALIDATION_ERROR',
        validationErrors: {
          title: 'Title is required',
          email: 'Email must be valid'
        },
        suggestions: [
          'Check your input fields',
          'Ensure all required fields are filled'
        ],
        documentationUrl: 'https://docs.example.com/errors/validation_error'
      }

      const processed = ErrorHandler.processError(backendError)

      expect(processed.type).toBe(ErrorType.VALIDATION)
      expect(processed.message).toBe('Invalid input data')
      expect(processed.code).toBe('VALIDATION_ERROR')
      expect(processed.timestamp).toBe('2024-01-15T10:30:00')
      expect(processed.details?.validationErrors).toEqual({
        title: 'Title is required',
        email: 'Email must be valid'
      })
      expect(processed.details?.suggestions).toEqual([
        'Check your input fields',
        'Ensure all required fields are filled'
      ])
      expect(processed.details?.documentationUrl).toBe('https://docs.example.com/errors/validation_error')
    })

    it('should categorize errors by status code correctly', () => {
      const authError: ApiError = {
        timestamp: '2024-01-15T10:30:00',
        status: 401,
        error: 'Unauthorized',
        message: 'Authentication required',
        path: '/api/v1/secure/content'
      }

      const processed = ErrorHandler.processError(authError)
      expect(processed.type).toBe(ErrorType.AUTHENTICATION)
    })

    it('should handle business exceptions with error codes', () => {
      const businessError: ApiError = {
        timestamp: '2024-01-15T10:30:00',
        status: 409,
        error: 'Content Error',
        message: 'Content 123 is not editable in status: PUBLISHED',
        path: '/api/v1/content/123',
        errorCode: 'CONTENT_NOT_EDITABLE',
        suggestions: [
          'Check if content is in draft status',
          'Ensure you have edit permissions'
        ]
      }

      const processed = ErrorHandler.processError(businessError)
      expect(processed.type).toBe(ErrorType.VALIDATION)
      expect(processed.code).toBe('CONTENT_NOT_EDITABLE')
      expect(processed.details?.suggestions).toHaveLength(2)
    })

    it('should handle AI service exceptions', () => {
      const aiError: ApiError = {
        timestamp: '2024-01-15T10:30:00',
        status: 402,
        error: 'AI Service Error',
        message: 'AI quota exceeded for user user123',
        path: '/api/v1/content/generate',
        errorCode: 'AI_QUOTA_EXCEEDED',
        suggestions: [
          'Upgrade your plan for more AI credits',
          'Wait for quota reset next month'
        ]
      }

      const processed = ErrorHandler.processError(aiError)
      expect(processed.code).toBe('AI_QUOTA_EXCEEDED')
      expect(processed.details?.suggestions).toContain('Upgrade your plan for more AI credits')
    })
  })

  describe('ValidationErrorHelper', () => {
    it('should extract validation errors from new format', () => {
      const error = ErrorHandler.processError({
        timestamp: '2024-01-15T10:30:00',
        status: 400,
        error: 'Validation Failed',
        message: 'Invalid input data',
        path: '/api/v1/content',
        validationErrors: {
          title: 'Title is required',
          email: 'Email must be valid',
          age: 'Age must be a positive number'
        }
      } as ApiError)

      const fieldErrors = ValidationErrorHelper.extractFieldErrors(error)
      
      expect(fieldErrors).toEqual({
        title: 'Title is required',
        email: 'Email must be valid',
        age: 'Age must be a positive number'
      })
    })

    it('should extract suggestions from error', () => {
      const error = ErrorHandler.processError({
        timestamp: '2024-01-15T10:30:00',
        status: 400,
        error: 'Validation Error',
        message: 'Invalid input',
        path: '/api/v1/content',
        suggestions: [
          'Check your input',
          'Try again later'
        ]
      } as ApiError)

      const suggestions = ValidationErrorHelper.getSuggestions(error)
      expect(suggestions).toEqual(['Check your input', 'Try again later'])
    })

    it('should extract documentation URL from error', () => {
      const error = ErrorHandler.processError({
        timestamp: '2024-01-15T10:30:00',
        status: 400,
        error: 'Validation Error',
        message: 'Invalid input',
        path: '/api/v1/content',
        documentationUrl: 'https://docs.example.com/errors/validation'
      } as ApiError)

      const docUrl = ValidationErrorHelper.getDocumentationUrl(error)
      expect(docUrl).toBe('https://docs.example.com/errors/validation')
    })

    it('should extract trace ID from error', () => {
      const error = ErrorHandler.processError({
        timestamp: '2024-01-15T10:30:00',
        status: 500,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        path: '/api/v1/content',
        traceId: 'trace-123-456-789'
      } as ApiError)

      const traceId = ValidationErrorHelper.getTraceId(error)
      expect(traceId).toBe('trace-123-456-789')
    })
  })

  describe('Error Type Detection', () => {
    it('should detect authentication errors', () => {
      const error = ErrorHandler.processError({
        status: 401,
        error: 'Unauthorized',
        message: 'Authentication required'
      } as ApiError)

      expect(ErrorHandler.isAuthenticationError(error)).toBe(true)
      expect(ErrorHandler.isAuthorizationError(error)).toBe(false)
    })

    it('should detect authorization errors', () => {
      const error = ErrorHandler.processError({
        status: 403,
        error: 'Forbidden',
        message: 'Access denied'
      } as ApiError)

      expect(ErrorHandler.isAuthorizationError(error)).toBe(true)
      expect(ErrorHandler.isAuthenticationError(error)).toBe(false)
    })

    it('should detect validation errors', () => {
      const error = ErrorHandler.processError({
        status: 400,
        error: 'Bad Request',
        message: 'Validation failed'
      } as ApiError)

      expect(ErrorHandler.isValidationError(error)).toBe(true)
    })

    it('should detect retryable errors', () => {
      const serverError = ErrorHandler.processError({
        status: 500,
        error: 'Internal Server Error',
        message: 'Server error'
      } as ApiError)

      const rateLimitError = ErrorHandler.processError({
        status: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded'
      } as ApiError)

      const validationError = ErrorHandler.processError({
        status: 400,
        error: 'Bad Request',
        message: 'Validation failed'
      } as ApiError)

      expect(ErrorHandler.isRetryableError(serverError)).toBe(true)
      expect(ErrorHandler.isRetryableError(rateLimitError)).toBe(true)
      expect(ErrorHandler.isRetryableError(validationError)).toBe(false)
    })
  })

  describe('User-Friendly Messages', () => {
    it('should provide user-friendly messages for common errors', () => {
      const testCases = [
        { status: 400, expected: 'Invalid request. Please check your input and try again.' },
        { status: 401, expected: 'Your session has expired. Please log in again.' },
        { status: 403, expected: 'You do not have permission to perform this action.' },
        { status: 404, expected: 'The requested resource was not found.' },
        { status: 409, expected: 'This action conflicts with existing data. Please refresh and try again.' },
        { status: 429, expected: 'Too many requests. Please wait a moment and try again.' },
        { status: 500, expected: 'Server error. Our team has been notified. Please try again later.' }
      ]

      testCases.forEach(({ status, expected }) => {
        const error = ErrorHandler.processError({
          status,
          error: 'Error',
          message: 'Technical error message'
        } as ApiError)

        expect(error.userMessage).toBe(expected)
      })
    })
  })
})
  describe(
'Toast-Only Error Display', () => {
    it('should show validation errors in toast format', () => {
      const error = ErrorHandler.processError({
        timestamp: '2024-01-15T10:30:00',
        status: 400,
        error: 'Validation Failed',
        message: 'Invalid input data',
        path: '/api/v1/content',
        validationErrors: {
          title: 'Title is required',
          email: 'Email must be valid'
        },
        suggestions: [
          'Check your input fields',
          'Ensure all required fields are filled'
        ]
      } as ApiError)

      // Verify error contains all necessary information for toast display
      expect(error.details?.validationErrors).toEqual({
        title: 'Title is required',
        email: 'Email must be valid'
      })
      expect(error.details?.suggestions).toEqual([
        'Check your input fields',
        'Ensure all required fields are filled'
      ])
    })

    it('should format error messages for toast display', () => {
      const error = ErrorHandler.processError({
        timestamp: '2024-01-15T10:30:00',
        status: 409,
        error: 'Content Error',
        message: 'Content cannot be edited',
        path: '/api/v1/content/123',
        errorCode: 'CONTENT_NOT_EDITABLE',
        suggestions: ['Check content status', 'Ensure you have permissions']
      } as ApiError)

      expect(error.userMessage).toBe('This action conflicts with existing data. Please refresh and try again.')
      expect(error.code).toBe('CONTENT_NOT_EDITABLE')
      expect(ValidationErrorHelper.getSuggestions(error)).toHaveLength(2)
    })

    it('should handle authentication errors for toast redirect', () => {
      const error = ErrorHandler.processError({
        timestamp: '2024-01-15T10:30:00',
        status: 401,
        error: 'Unauthorized',
        message: 'Authentication required',
        path: '/api/v1/secure/content'
      } as ApiError)

      expect(error.type).toBe(ErrorType.AUTHENTICATION)
      expect(error.userMessage).toBe('Your session has expired. Please log in again.')
    })
  })
})