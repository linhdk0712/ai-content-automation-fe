/**
 * Generate a UUID v4 string
 * @returns A UUID v4 string
 */
export function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a short UUID (8 characters) for content IDs
 * @returns A short UUID string
 */
export function generateShortUUID(): string {
  return generateUUID().replace(/-/g, '').substring(0, 8);
}

/**
 * Generate a numeric content ID based on timestamp and random number
 * @returns A numeric content ID
 */
export function generateContentId(): number {
  // Use timestamp + random number to ensure uniqueness
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return parseInt(`${timestamp}${random.toString().padStart(3, '0')}`);
}