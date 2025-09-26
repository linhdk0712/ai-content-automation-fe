import { ResponseBase } from '../types/api.types'

/**
 * Utility functions for handling ResponseBase format
 */

/**
 * Check if ResponseBase indicates success
 */
export function isResponseSuccess<T>(response: ResponseBase<T>): boolean {
  return response.errorCode === 'SUCCESS'
}

/**
 * Check if ResponseBase indicates error
 */
export function isResponseError<T>(response: ResponseBase<T>): boolean {
  return response.errorCode !== 'SUCCESS'
}

/**
 * Get error message from ResponseBase
 */
export function getErrorMessage<T>(response: ResponseBase<T>): string {
  return response.errorMessage || 'Unknown error occurred'
}

/**
 * Get success message from ResponseBase
 */
export function getSuccessMessage<T>(response: ResponseBase<T>): string {
  return response.errorMessage || 'Operation completed successfully'
}

/**
 * Extract data from ResponseBase if successful, throw error if not
 */
export function extractResponseData<T>(response: ResponseBase<T>): T {
  if (isResponseSuccess(response)) {
    return response.data as T
  } else {
    const error = new Error(getErrorMessage(response))
    ;(error as any).code = response.errorCode
    throw error
  }
}

/**
 * Create a success ResponseBase (for testing/mocking)
 */
export function createSuccessResponse<T>(data: T, message?: string): ResponseBase<T> {
  return {
    errorCode: 'SUCCESS',
    errorMessage: message || 'Operation completed successfully',
    data
  }
}

/**
 * Create an error ResponseBase (for testing/mocking)
 */
export function createErrorResponse<T>(errorCode: string, errorMessage: string): ResponseBase<T> {
  return {
    errorCode,
    errorMessage,
    data: null
  }
}

/**
 * Type guard to check if an object is a ResponseBase
 */
export function isResponseBase(obj: any): obj is ResponseBase<unknown> {
  return obj && 
    typeof obj === 'object' && 
    'errorCode' in obj && 
    'errorMessage' in obj && 
    'data' in obj
}

export default {
  isResponseSuccess,
  isResponseError,
  getErrorMessage,
  getSuccessMessage,
  extractResponseData,
  createSuccessResponse,
  createErrorResponse,
  isResponseBase
}