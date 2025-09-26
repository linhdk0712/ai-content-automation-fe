import { ResponseBase, ApiResponse } from '../types/api.types'

export function debugResponseFormat(data: any): {
  isResponseBase: boolean
  isApiResponse: boolean
  isDirectData: boolean
  structure: string
  details: any
} {
  console.log('=== Response Format Debug ===')
  console.log('Raw data:', data)
  console.log('Type:', typeof data)
  console.log('Is null:', data === null)
  console.log('Is array:', Array.isArray(data))
  
  if (typeof data !== 'object' || data === null) {
    return {
      isResponseBase: false,
      isApiResponse: false,
      isDirectData: true,
      structure: 'primitive',
      details: { type: typeof data, value: data }
    }
  }
  
  const keys = Object.keys(data)
  console.log('Object keys:', keys)
  
  // Check ResponseBase format
  const hasErrorCode = 'errorCode' in data
  const hasErrorMessage = 'errorMessage' in data
  const hasData = 'data' in data
  const isResponseBase = hasErrorCode && hasErrorMessage && hasData
  
  console.log('ResponseBase check:', {
    hasErrorCode,
    hasErrorMessage,
    hasData,
    isResponseBase
  })
  
  // Check ApiResponse format
  const hasSuccess = 'success' in data
  const hasMessage = 'message' in data
  const isApiResponse = hasSuccess && hasMessage
  
  console.log('ApiResponse check:', {
    hasSuccess,
    hasMessage,
    isApiResponse
  })
  
  let structure = 'unknown'
  if (isResponseBase) {
    structure = 'ResponseBase<T>'
  } else if (isApiResponse) {
    structure = 'ApiResponse<T>'
  } else {
    structure = 'DirectData'
  }
  
  const result = {
    isResponseBase,
    isApiResponse,
    isDirectData: !isResponseBase && !isApiResponse,
    structure,
    details: {
      keys,
      values: keys.reduce((acc, key) => {
        acc[key] = {
          type: typeof data[key],
          value: data[key],
          isNull: data[key] === null,
          isUndefined: data[key] === undefined
        }
        return acc
      }, {} as any)
    }
  }
  
  console.log('Debug result:', result)
  console.log('=== End Debug ===')
  
  return result
}

export function testResponseBaseDetection() {
  console.log('=== Testing ResponseBase Detection ===')
  
  // Test cases
  const testCases = [
    // Valid ResponseBase - success
    {
      name: 'ResponseBase Success',
      data: {
        errorCode: null,
        errorMessage: null,
        data: { accessToken: 'token123', refreshToken: 'refresh123' }
      }
    },
    
    // Valid ResponseBase - error
    {
      name: 'ResponseBase Error',
      data: {
        errorCode: 'AUTHENTICATION_FAILED',
        errorMessage: 'Invalid credentials',
        data: null
      }
    },
    
    // Legacy ApiResponse
    {
      name: 'Legacy ApiResponse',
      data: {
        success: true,
        message: 'Login successful',
        data: { accessToken: 'token123' }
      }
    },
    
    // Direct data
    {
      name: 'Direct Data',
      data: {
        accessToken: 'token123',
        refreshToken: 'refresh123'
      }
    },
    
    // Malformed ResponseBase (missing fields)
    {
      name: 'Malformed ResponseBase',
      data: {
        errorCode: null,
        data: { accessToken: 'token123' }
        // missing errorMessage
      }
    }
  ]
  
  testCases.forEach(testCase => {
    console.log(`\n--- Testing: ${testCase.name} ---`)
    debugResponseFormat(testCase.data)
  })
}

// Auto-run tests in development
if (import.meta.env.DEV) {
  // Uncomment to run tests
  // testResponseBaseDetection()
}