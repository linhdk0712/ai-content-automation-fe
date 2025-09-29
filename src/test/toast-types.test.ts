/**
 * Type checking test file for React-Toastify integration
 * This file should compile without TypeScript errors
 */

import { toastService, ToastServiceOptions } from '../services/toast.service'
import { useToast } from '../hooks/useToast'
import { useCustomToast } from '../hooks/useCustomToast'
import { NotificationMigration, LegacyNotificationOptions } from '../utils/notification-migration'

// Test ToastServiceOptions interface
const validToastOptions: ToastServiceOptions = {
  title: 'Test Title',
  persistent: true,
  autoClose: false, // Should accept false
  actions: [{
    label: 'Action',
    action: () => {},
    style: 'primary'
  }]
}

const validToastOptions2: ToastServiceOptions = {
  title: 'Test Title',
  persistent: false,
  autoClose: 5000, // Should accept number
}

// Test toastService methods
function testToastService() {
  // Basic methods
  toastService.success('Success message')
  toastService.error('Error message', { title: 'Error' })
  toastService.warning('Warning message', { persistent: true })
  toastService.info('Info message', { autoClose: 3000 })
  
  // Loading toast
  const loadingId = toastService.loading('Loading...')
  
  // Update toast
  toastService.update(loadingId, 'Updated message', 'success')
  
  // Promise toast
  const promise = Promise.resolve('data')
  toastService.promise(promise, {
    pending: 'Loading...',
    success: 'Success!',
    error: 'Failed!'
  })
  
  // Promise toast with functions
  toastService.promise(promise, {
    pending: 'Loading...',
    success: (data) => `Success: ${data}`,
    error: (error) => `Failed: ${error.message}`
  })
  
  // API error
  const apiError = new Error('API Error')
  toastService.apiError(apiError)
  
  // Response handling
  toastService.response(200, 'SUCCESS', null, 'Operation completed')
  toastService.response(400, 'VALIDATION_ERROR', 'Invalid input')
}

// Test useToast hook (would be used in components)
function testUseToastHook() {
  // This would be inside a React component
  // const toast = useToast()
  
  // toast.success('Success')
  // toast.error('Error')
  // toast.saveSuccess('Document')
  // toast.deleteError('Failed to delete')
  // toast.networkError()
  // toast.authError()
}

// Test useCustomToast hook (would be used in components)
function testUseCustomToastHook() {
  // This would be inside a React component
  // const customToast = useCustomToast()
  
  // customToast.success('Success', { title: 'Title' })
  // customToast.errorWithRetry('Failed', () => {})
  // customToast.persistentWarning('Warning')
}

// Test migration utilities
function testMigrationUtilities() {
  // Legacy notification options
  const legacyOptions: LegacyNotificationOptions = {
    title: 'Legacy Title',
    message: 'Legacy message',
    type: 'success',
    duration: 5000,
    persistent: false,
    actions: [{
      label: 'Action',
      action: () => {},
      style: 'primary'
    }]
  }
  
  // Test migration methods
  NotificationMigration.show(legacyOptions)
  NotificationMigration.showApiResponse(200, 'SUCCESS', null, 'Success')
  NotificationMigration.showApiError(new Error('API Error'))
  
  // Test migration helpers
  const helpers = NotificationMigration.createMigrationHelpers()
  helpers.saveSuccess('Document')
  helpers.deleteError('Failed to delete')
  helpers.networkError()
  helpers.validationError('Invalid input')
}

// Test type compatibility
function testTypeCompatibility() {
  // autoClose should accept number | false
  const options1: ToastServiceOptions = { autoClose: 5000 }
  const options2: ToastServiceOptions = { autoClose: false }
  // const options3: ToastServiceOptions = { autoClose: true } // Should error
  
  // Actions should be properly typed
  const options4: ToastServiceOptions = {
    actions: [{
      label: 'Test',
      action: () => console.log('clicked'),
      style: 'primary'
    }]
  }
  
  // Promise messages should accept functions
  toastService.promise(Promise.resolve('test'), {
    pending: 'Loading...',
    success: (data: string) => `Success: ${data}`,
    error: (error: any) => `Error: ${error.message}`
  })
}

// Export functions to avoid unused variable warnings
export {
  testToastService,
  testUseToastHook,
  testUseCustomToastHook,
  testMigrationUtilities,
  testTypeCompatibility,
  validToastOptions,
  validToastOptions2
}