/**
 * React Hook for Internationalization
 * Provides easy access to i18n features and localization
 */

import { useCallback, useEffect, useState } from 'react';
import { i18nManager, Language, LocaleData } from '../utils/internationalization/i18nManager';

export interface UseInternationalizationReturn {
  // Current language info
  currentLanguage: string;
  currentLanguageInfo: Language | undefined;
  isRTL: boolean;
  
  // Available languages
  supportedLanguages: Language[];
  
  // Translation functions
  t: (key: string, params?: Record<string, string | number>) => string;
  pluralize: (key: string, count: number, params?: Record<string, string | number>) => string;
  
  // Language management
  changeLanguage: (languageCode: string) => Promise<void>;
  loadLanguage: (languageCode: string) => Promise<void>;
  
  // Formatting functions
  formatDate: (date: Date) => string;
  formatTime: (date: Date) => string;
  formatNumber: (number: number) => string;
  formatCurrency: (amount: number) => string;
  getRelativeTime: (date: Date) => string;
  
  // Locale data
  localeData: LocaleData | undefined;
  
  // Loading state
  isChangingLanguage: boolean;
}

export const useInternationalization = (): UseInternationalizationReturn => {
  const [currentLanguage, setCurrentLanguage] = useState(i18nManager.getCurrentLanguage());
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [supportedLanguages] = useState(i18nManager.getSupportedLanguages());

  useEffect(() => {
    // Listen for language changes
    const unsubscribe = i18nManager.addLanguageChangeListener((newLanguage) => {
      setCurrentLanguage(newLanguage);
      setIsChangingLanguage(false);
    });

    return unsubscribe;
  }, []);

  const changeLanguage = useCallback(async (languageCode: string) => {
    if (languageCode === currentLanguage) return;
    
    setIsChangingLanguage(true);
    try {
      await i18nManager.changeLanguage(languageCode);
    } catch (error) {
      setIsChangingLanguage(false);
      throw error;
    }
  }, [currentLanguage]);

  const loadLanguage = useCallback(async (languageCode: string) => {
    await i18nManager.loadLanguage(languageCode);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    return i18nManager.t(key, params);
  }, [currentLanguage]); // Re-run when language changes

  const pluralize = useCallback((key: string, count: number, params?: Record<string, string | number>) => {
    return i18nManager.pluralize(key, count, params);
  }, [currentLanguage]);

  const formatDate = useCallback((date: Date) => {
    return i18nManager.formatDate(date);
  }, [currentLanguage]);

  const formatTime = useCallback((date: Date) => {
    return i18nManager.formatTime(date);
  }, [currentLanguage]);

  const formatNumber = useCallback((number: number) => {
    return i18nManager.formatNumber(number);
  }, [currentLanguage]);

  const formatCurrency = useCallback((amount: number) => {
    return i18nManager.formatCurrency(amount);
  }, [currentLanguage]);

  const getRelativeTime = useCallback((date: Date) => {
    return i18nManager.getRelativeTime(date);
  }, [currentLanguage]);

  const currentLanguageInfo = supportedLanguages.find(lang => lang.code === currentLanguage);
  const isRTL = i18nManager.isRTL();
  const localeData = i18nManager.getLocaleData();

  return {
    currentLanguage,
    currentLanguageInfo,
    isRTL,
    supportedLanguages,
    t,
    pluralize,
    changeLanguage,
    loadLanguage,
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency,
    getRelativeTime,
    localeData,
    isChangingLanguage
  };
};

/**
 * Hook for managing text direction (RTL/LTR)
 */
export const useTextDirection = () => {
  const { isRTL, currentLanguage } = useInternationalization();

  const getTextAlign = useCallback((align: 'start' | 'end' | 'left' | 'right' | 'center') => {
    switch (align) {
      case 'start':
        return isRTL ? 'right' : 'left';
      case 'end':
        return isRTL ? 'left' : 'right';
      default:
        return align;
    }
  }, [isRTL]);

  const getMargin = useCallback((side: 'start' | 'end') => {
    return side === 'start' 
      ? (isRTL ? 'marginRight' : 'marginLeft')
      : (isRTL ? 'marginLeft' : 'marginRight');
  }, [isRTL]);

  const getPadding = useCallback((side: 'start' | 'end') => {
    return side === 'start'
      ? (isRTL ? 'paddingRight' : 'paddingLeft')
      : (isRTL ? 'paddingLeft' : 'paddingRight');
  }, [isRTL]);

  const getDirection = useCallback(() => {
    return isRTL ? 'rtl' : 'ltr';
  }, [isRTL]);

  return {
    isRTL,
    getTextAlign,
    getMargin,
    getPadding,
    getDirection,
    currentLanguage
  };
};

/**
 * Hook for date and time formatting with locale awareness
 */
export const useDateTimeFormatting = () => {
  const { formatDate, formatTime, getRelativeTime, currentLanguage, localeData } = useInternationalization();

  const formatDateTime = useCallback((date: Date, options?: {
    includeTime?: boolean;
    relative?: boolean;
    format?: 'short' | 'medium' | 'long' | 'full';
  }) => {
    const { includeTime = false, relative = false } = options || {};

    if (relative) {
      return getRelativeTime(date);
    }

    const dateStr = formatDate(date);
    const timeStr = includeTime ? formatTime(date) : '';

    return includeTime ? `${dateStr} ${timeStr}` : dateStr;
  }, [formatDate, formatTime, getRelativeTime]);

  const formatDateRange = useCallback((startDate: Date, endDate: Date) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    
    // If same date, show only once
    if (start === end) {
      return start;
    }
    
    return `${start} - ${end}`;
  }, [formatDate]);

  const getDateFormat = useCallback(() => {
    return localeData?.dateFormat || 'MM/DD/YYYY';
  }, [localeData]);

  const getTimeFormat = useCallback(() => {
    return localeData?.timeFormat || 'HH:mm';
  }, [localeData]);

  return {
    formatDateTime,
    formatDateRange,
    formatDate,
    formatTime,
    getRelativeTime,
    getDateFormat,
    getTimeFormat,
    currentLanguage
  };
};

/**
 * Hook for number and currency formatting
 */
export const useNumberFormatting = () => {
  const { formatNumber, formatCurrency, currentLanguage, localeData } = useInternationalization();

  const formatPercentage = useCallback((value: number, decimals: number = 1) => {
    try {
      return new Intl.NumberFormat(currentLanguage, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value / 100);
    } catch {
      return `${(value).toFixed(decimals)}%`;
    }
  }, [currentLanguage]);

  const formatFileSize = useCallback((bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${formatNumber(Math.round(size * 100) / 100)} ${units[unitIndex]}`;
  }, [formatNumber]);

  const formatCompactNumber = useCallback((value: number) => {
    try {
      return new Intl.NumberFormat(currentLanguage, {
        notation: 'compact',
        compactDisplay: 'short'
      }).format(value);
    } catch {
      // Fallback for browsers that don't support compact notation
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return formatNumber(value);
    }
  }, [currentLanguage, formatNumber]);

  const getCurrencySymbol = useCallback(() => {
    return localeData?.currency.symbol || '$';
  }, [localeData]);

  const getCurrencyCode = useCallback(() => {
    return localeData?.currency.code || 'USD';
  }, [localeData]);

  return {
    formatNumber,
    formatCurrency,
    formatPercentage,
    formatFileSize,
    formatCompactNumber,
    getCurrencySymbol,
    getCurrencyCode,
    currentLanguage
  };
};

/**
 * Hook for pluralization with complex rules
 */
export const usePluralization = () => {
  const { pluralize, t, currentLanguage } = useInternationalization();

  const formatCount = useCallback((
    key: string, 
    count: number, 
    options?: {
      showCount?: boolean;
      params?: Record<string, string | number>;
    }
  ) => {
    const { showCount = true, params = {} } = options || {};
    
    const text = pluralize(key, count, { ...params, count });
    
    return showCount ? `${count} ${text}` : text;
  }, [pluralize]);

  const formatList = useCallback((items: string[], options?: {
    type?: 'conjunction' | 'disjunction';
    style?: 'long' | 'short' | 'narrow';
  }) => {
    const { type = 'conjunction', style = 'long' } = options || {};
    
    try {
      return new (Intl as any).ListFormat(currentLanguage, { 
        style, 
        type 
      }).format(items);
    } catch {
      // Fallback for browsers that don't support ListFormat
      if (items.length === 0) return '';
      if (items.length === 1) return items[0];
      if (items.length === 2) {
        const connector = type === 'conjunction' ? t('common.and') : t('common.or');
        return `${items[0]} ${connector} ${items[1]}`;
      }
      
      const connector = type === 'conjunction' ? t('common.and') : t('common.or');
      const lastItem = items[items.length - 1];
      const otherItems = items.slice(0, -1).join(', ');
      
      return `${otherItems}, ${connector} ${lastItem}`;
    }
  }, [currentLanguage, t]);

  return {
    pluralize,
    formatCount,
    formatList,
    currentLanguage
  };
};

export default useInternationalization;