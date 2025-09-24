// API utilities for consistent URL handling

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

/**
 * Constructs a full API URL from a relative path
 * @param path - The relative API path (e.g., '/templates', '/notifications/subscribe')
 * @returns The full API URL
 */
export function getApiUrl(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${API_BASE_URL}/${cleanPath}`
}

/**
 * Creates a fetch request with the correct API base URL
 * @param path - The relative API path
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const url = getApiUrl(path)
  
  // Add default headers if not provided
  const defaultHeaders = {
    'Content-Type': 'application/json',
  }
  
  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  }
  
  return fetch(url, mergedOptions)
}

/**
 * Gets the current API base URL
 * @returns The API base URL
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL
}