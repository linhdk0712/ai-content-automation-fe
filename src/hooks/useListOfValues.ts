import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueries, UseQueryResult } from '@tanstack/react-query'
import ListOfValuesService, { ListOfValuesResponse } from '../services/listOfValues.service'

// Query keys for caching
export const LIST_OF_VALUES_KEYS = {
  all: ['listOfValues'] as const,
  category: (category: string, language?: string) => 
    [...LIST_OF_VALUES_KEYS.all, 'category', category, language] as const,
  bulk: (categories: string[], language?: string) => 
    [...LIST_OF_VALUES_KEYS.all, 'bulk', categories.sort().join(','), language] as const,
  search: (query: string, category?: string, language?: string) => 
    [...LIST_OF_VALUES_KEYS.all, 'search', query, category, language] as const,
  categories: () => [...LIST_OF_VALUES_KEYS.all, 'categories'] as const,
}

// Hook options interface
export interface UseListOfValuesOptions {
  language?: string
  includeInactive?: boolean
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
}

/**
 * Hook for getting list of values for a specific category
 */
export function useListOfValues(
  category: string,
  options: UseListOfValuesOptions = {}
) {
  const {
    language = 'vi',
    includeInactive = false,
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
  } = options

  return useQuery({
    queryKey: LIST_OF_VALUES_KEYS.category(category, language),
    queryFn: () => ListOfValuesService.getListOfValues(category, language, includeInactive),
    enabled,
    staleTime,
    cacheTime,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Hook for getting multiple categories at once
 */
export function useBulkListOfValues(
  categories: string[],
  options: UseListOfValuesOptions = {}
) {
  const {
    language = 'vi',
    includeInactive = false,
    enabled = true,
    staleTime = 5 * 60 * 1000,
    cacheTime = 10 * 60 * 1000,
  } = options

  return useQuery({
    queryKey: LIST_OF_VALUES_KEYS.bulk(categories, language),
    queryFn: () => ListOfValuesService.getBulkListOfValues(categories, language, includeInactive),
    enabled: enabled && categories.length > 0,
    staleTime,
    cacheTime,
    retry: 2,
  })
}

/**
 * Hook for searching list of values
 */
export function useSearchListOfValues(
  query: string,
  category?: string,
  options: UseListOfValuesOptions = {}
) {
  const {
    language = 'vi',
    enabled = true,
    staleTime = 2 * 60 * 1000, // 2 minutes for search results
    cacheTime = 5 * 60 * 1000, // 5 minutes
  } = options

  return useQuery({
    queryKey: LIST_OF_VALUES_KEYS.search(query, category, language),
    queryFn: () => ListOfValuesService.searchListOfValues(query, category, language),
    enabled: enabled && query.length >= 2, // Only search with 2+ characters
    staleTime,
    cacheTime,
    retry: 1,
  })
}

/**
 * Hook for getting available categories
 */
export function useAvailableCategories(options: UseListOfValuesOptions = {}) {
  const {
    enabled = true,
    staleTime = 10 * 60 * 1000, // 10 minutes
    cacheTime = 30 * 60 * 1000, // 30 minutes
  } = options

  return useQuery({
    queryKey: LIST_OF_VALUES_KEYS.categories(),
    queryFn: () => ListOfValuesService.getAvailableCategories(),
    enabled,
    staleTime,
    cacheTime,
    retry: 2,
  })
}

/**
 * Hook for getting multiple specific categories with individual queries
 */
export function useMultipleListOfValues(
  categories: string[],
  options: UseListOfValuesOptions = {}
) {
  const {
    language = 'vi',
    includeInactive = false,
    enabled = true,
    staleTime = 5 * 60 * 1000,
    cacheTime = 10 * 60 * 1000,
  } = options

  return useQueries({
    queries: categories.map(category => ({
      queryKey: LIST_OF_VALUES_KEYS.category(category, language),
      queryFn: () => ListOfValuesService.getListOfValues(category, language, includeInactive),
      enabled,
      staleTime,
      cacheTime,
      retry: 2,
    })),
  })
}

// Convenience hooks for specific categories
export function useSocialPlatforms(options: UseListOfValuesOptions = {}) {
  return useListOfValues('social-platforms', options)
}

export function useTemplateCategories(options: UseListOfValuesOptions = {}) {
  return useListOfValues('template-categories', options)
}

export function useUserRoles(options: UseListOfValuesOptions = {}) {
  return useListOfValues('user-roles', options)
}

export function useContentTypes(options: UseListOfValuesOptions = {}) {
  return useListOfValues('content-types', options)
}

export function useContentStatuses(options: UseListOfValuesOptions = {}) {
  return useListOfValues('content-statuses', options)
}

export function useAIProviders(options: UseListOfValuesOptions = {}) {
  return useListOfValues('ai-providers', options)
}

export function useLanguages(options: UseListOfValuesOptions = {}) {
  return useListOfValues('languages', options)
}

export function useTimezones(options: UseListOfValuesOptions = {}) {
  return useListOfValues('timezones', options)
}

export function useCountries(options: UseListOfValuesOptions = {}) {
  return useListOfValues('countries', options)
}

export function useIndustries(options: UseListOfValuesOptions = {}) {
  return useListOfValues('industries', options)
}

export function useTones(options: UseListOfValuesOptions = {}) {
  return useListOfValues('tones', options)
}

export function useTargetAudiences(options: UseListOfValuesOptions = {}) {
  return useListOfValues('target-audiences', options)
}

/**
 * Custom hook for managing dropdown state with list of values
 */
export function useDropdownWithListOfValues(
  category: string,
  options: UseListOfValuesOptions & {
    defaultValue?: string
    multiple?: boolean
  } = {}
) {
  const { defaultValue, multiple = false, ...queryOptions } = options
  const [selectedValue, setSelectedValue] = useState<string | string[]>(
    multiple ? [] : defaultValue || ''
  )
  const [searchQuery, setSearchQuery] = useState('')

  const { data: values, isLoading, error } = useListOfValues(category, queryOptions)

  // Filter values based on search query
  const filteredValues = values?.filter(value =>
    value.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    value.displayLabel.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleValueChange = useCallback((value: string | string[]) => {
    setSelectedValue(value)
  }, [])

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const getSelectedItems = useCallback(() => {
    if (!values) return []
    
    if (multiple && Array.isArray(selectedValue)) {
      return values.filter(item => selectedValue.includes(item.value))
    } else if (!multiple && typeof selectedValue === 'string') {
      const item = values.find(item => item.value === selectedValue)
      return item ? [item] : []
    }
    
    return []
  }, [values, selectedValue, multiple])

  return {
    // Data
    values: filteredValues,
    selectedValue,
    selectedItems: getSelectedItems(),
    searchQuery,
    
    // State
    isLoading,
    error,
    
    // Actions
    setSelectedValue: handleValueChange,
    setSearchQuery: handleSearchChange,
    
    // Utilities
    clearSelection: () => setSelectedValue(multiple ? [] : ''),
    clearSearch: () => setSearchQuery(''),
  }
}