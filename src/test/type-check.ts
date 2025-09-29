/**
 * Simple type check file - should compile without errors
 */

import { toastService, ToastServiceOptions, ToastAction } from '../services/toast.service'
import { NotificationMigration, LegacyNotificationOptions } from '../utils/notification-migration'

// Test basic types
const action: ToastAction = {
  label: 'Test',
  action: () => {},
  style: 'primary'
}

const options: ToastServiceOptions = {
  title: 'Test',
  actions: [action],
  persistent: false,
  autoClose: 5000
}

const legacyOptions: LegacyNotificationOptions = {
  title: 'Legacy',
  message: 'Test message',
  type: 'success',
  duration: 3000,
  persistent: false,
  actions: [action]
}

// Test service calls
toastService.success('Test', options)
NotificationMigration.show(legacyOptions)

console.log('Type check passed')