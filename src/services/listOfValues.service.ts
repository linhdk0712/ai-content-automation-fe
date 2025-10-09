import { apiRequest } from './api'

export interface ListOfValuesResponse {
  value: string
  label: string
  displayLabel: string
  category: string
  description?: string
  iconUrl?: string
  cssClass?: string
  sortOrder?: number
  active?: boolean
  parentValue?: string
  metadata?: Record<string, any>
  language?: string
}

export interface ResponseBase<T> {
  errorCode: string
  errorMessage: string
  data: T
}

/**
 * Service for managing centralized List of Values (dropdown options)
 */
export class ListOfValuesService {
  // Use user-specific List of Values endpoint
  private static readonly BASE_URL = '/user/list-of-values'

  // Map frontend categories to backend user endpoint categories
  private static readonly USER_CATEGORY_MAP: Record<string, string> = {
    'languages': 'language',
    'industries': 'industry',
    'content-types': 'content_type',
    'tones': 'tone',
    'target-audiences': 'target_audience',
    'ai-providers': 'ai_provider',
  }

  private static toUserCategory(category: string): string {
    return ListOfValuesService.USER_CATEGORY_MAP[category] || category
  }

  /**
   * Get list of values for a specific category
   */
  static async getListOfValues(
    category: string,
    language: string = 'vi',
    includeInactive: boolean = false
  ): Promise<ListOfValuesResponse[]> {
    try {
      const params = new URLSearchParams({
        language
      })

      // The user endpoint returns an array of UserListOfValueDto
      type UserListOfValueDto = {
        id: number
        listOfValueId: number
        enabled: boolean
        listOfValue: ListOfValuesResponse
      }

      const userCategory = this.toUserCategory(category)
      const response = await apiRequest.get<UserListOfValueDto[]>(
        `${this.BASE_URL}/${userCategory}?${params.toString()}`
      )

      // Map to the expected ListOfValuesResponse[], honoring user enabled flag and includeInactive
      const mapped = (response || [])
        .filter(item => includeInactive ? true : item.enabled)
        .map(item => {
          const lov = item.listOfValue
          // Ensure active flag respects user enabled setting
          return { ...lov, active: item.enabled && (lov.active ?? true) }
        })

      return mapped
    } catch (error) {
      console.error(`Failed to get list of values for category ${category}:`, error)
      throw error
    }
  }

  /**
   * Get all available categories
   */
  static async getAvailableCategories(): Promise<string[]> {
    try {
      const response = await apiRequest.get<string[]>(`${this.BASE_URL}/categories`)
      return response || []
    } catch (error) {
      console.error('Failed to get available categories:', error)
      throw error
    }
  }

  /**
   * Get multiple categories at once
   */
  static async getBulkListOfValues(
    categories: string[],
    language: string = 'vi',
    includeInactive: boolean = false
  ): Promise<Record<string, ListOfValuesResponse[]>> {
    try {
      const params = new URLSearchParams({
        categories: categories.join(','),
        language,
        includeInactive: includeInactive.toString()
      })

      const response = await apiRequest.get<Record<string, ListOfValuesResponse[]>>(
        `${this.BASE_URL}/bulk?${params.toString()}`
      )

      return response || {}
    } catch (error) {
      console.error('Failed to get bulk list of values:', error)
      throw error
    }
  }

  /**
   * Search list of values across categories
   */
  static async searchListOfValues(
    query: string,
    category?: string,
    language: string = 'vi'
  ): Promise<Record<string, ListOfValuesResponse[]>> {
    try {
      const params = new URLSearchParams({
        query,
        language
      })

      if (category) {
        params.append('category', category)
      }

      const response = await apiRequest.get<Record<string, ListOfValuesResponse[]>>(
        `${this.BASE_URL}/search?${params.toString()}`
      )

      return response || {}
    } catch (error) {
      console.error('Failed to search list of values:', error)
      throw error
    }
  }

  // Convenience methods for specific categories
  static async getSocialPlatforms(language: string = 'vi'): Promise<ListOfValuesResponse[]> {
    return this.getListOfValues('social-platforms', language)
  }

  static async getTemplateCategories(language: string = 'vi'): Promise<ListOfValuesResponse[]> {
    return this.getListOfValues('template-categories', language)
  }

  static async getUserRoles(language: string = 'vi'): Promise<ListOfValuesResponse[]> {
    return this.getListOfValues('user-roles', language)
  }

  static async getContentTypes(language: string = 'vi'): Promise<ListOfValuesResponse[]> {
    return this.getListOfValues('content-types', language)
  }

  static async getContentStatuses(language: string = 'vi'): Promise<ListOfValuesResponse[]> {
    return this.getListOfValues('content-statuses', language)
  }

  static async getAIProviders(language: string = 'vi'): Promise<ListOfValuesResponse[]> {
    return this.getListOfValues('ai-providers', language)
  }

  static async getLanguages(language: string = 'vi'): Promise<ListOfValuesResponse[]> {
    return this.getListOfValues('languages', language)
  }

  static async getTimezones(language: string = 'vi'): Promise<ListOfValuesResponse[]> {
    return this.getListOfValues('timezones', language)
  }

  static async getCountries(language: string = 'vi'): Promise<ListOfValuesResponse[]> {
    return this.getListOfValues('countries', language)
  }

  static async getIndustries(language: string = 'vi'): Promise<ListOfValuesResponse[]> {
    return this.getListOfValues('industries', language)
  }

  static async getTones(language: string = 'vi'): Promise<ListOfValuesResponse[]> {
    return this.getListOfValues('tones', language)
  }

  static async getTargetAudiences(language: string = 'vi'): Promise<ListOfValuesResponse[]> {
    return this.getListOfValues('target-audiences', language)
  }
}

export default ListOfValuesService