/**
 * React hook for internationalization
 * Provides easy access to translations and language management
 */

import { useState, useEffect } from 'react';
import { i18nManager } from '../utils/internationalization/i18nManager';

export const useI18n = () => {
  const [currentLanguage, setCurrentLanguage] = useState(i18nManager.getCurrentLanguage());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Listen for language changes
    const unsubscribe = i18nManager.addLanguageChangeListener((newLanguage) => {
      setCurrentLanguage(newLanguage);
    });

    return unsubscribe;
  }, []);

  const changeLanguage = async (languageCode: string) => {
    setIsLoading(true);
    try {
      await i18nManager.changeLanguage(languageCode);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    return i18nManager.t(key, params);
  };

  const formatDate = (date: Date) => {
    return i18nManager.formatDate(date);
  };

  const formatTime = (date: Date) => {
    return i18nManager.formatTime(date);
  };

  const formatNumber = (number: number) => {
    return i18nManager.formatNumber(number);
  };

  const formatCurrency = (amount: number) => {
    return i18nManager.formatCurrency(amount);
  };

  const getRelativeTime = (date: Date) => {
    return i18nManager.getRelativeTime(date);
  };

  const pluralize = (key: string, count: number, params?: Record<string, string | number>) => {
    return i18nManager.pluralize(key, count, params);
  };

  return {
    currentLanguage,
    isLoading,
    changeLanguage,
    t,
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency,
    getRelativeTime,
    pluralize,
    isRTL: i18nManager.isRTL(),
    supportedLanguages: i18nManager.getSupportedLanguages(),
    currentLanguageInfo: i18nManager.getCurrentLanguageInfo()
  };
};

export default useI18n;