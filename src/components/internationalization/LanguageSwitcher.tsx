/**
 * Dynamic Language Switcher Component
 * Provides interface for changing languages with RTL support
 */

import React, { useState, useEffect, useRef } from 'react';
import { i18nManager, Language } from '../../utils/internationalization/i18nManager';
import './LanguageSwitcher.css';

interface LanguageSwitcherProps {
  className?: string;
  showFlags?: boolean;
  showNativeNames?: boolean;
  compact?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  showFlags = true,
  showNativeNames = true,
  compact = false
}) => {
  const [currentLanguage, setCurrentLanguage] = useState(i18nManager.getCurrentLanguage());
  const [supportedLanguages] = useState(i18nManager.getSupportedLanguages());
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Listen for language changes
    const unsubscribe = i18nManager.addLanguageChangeListener((newLanguage) => {
      setCurrentLanguage(newLanguage);
      setIsChanging(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Handle clicks outside dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const currentLangInfo = supportedLanguages.find(lang => lang.code === currentLanguage);

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage || isChanging) return;

    setIsChanging(true);
    setIsOpen(false);

    try {
      await i18nManager.changeLanguage(languageCode);
      
      // Announce language change
      const newLangInfo = supportedLanguages.find(lang => lang.code === languageCode);
      if (newLangInfo) {
        console.log(`Language changed to ${newLangInfo.name}`);
      }
    } catch (error) {
      console.error('Failed to change language:', error);
      setIsChanging(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          // Focus first language option
          const firstOption = dropdownRef.current?.querySelector('[role="menuitem"]') as HTMLElement;
          firstOption?.focus();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          // Focus last language option
          const options = dropdownRef.current?.querySelectorAll('[role="menuitem"]');
          const lastOption = options?.[options.length - 1] as HTMLElement;
          lastOption?.focus();
        }
        break;
    }
  };

  const handleOptionKeyDown = (event: React.KeyboardEvent, languageCode: string) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleLanguageChange(languageCode);
        break;
      case 'Escape':
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        event.preventDefault();
        const nextOption = (event.target as HTMLElement).nextElementSibling as HTMLElement;
        if (nextOption) {
          nextOption.focus();
        } else {
          // Wrap to first option
          const firstOption = dropdownRef.current?.querySelector('[role="menuitem"]') as HTMLElement;
          firstOption?.focus();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        const prevOption = (event.target as HTMLElement).previousElementSibling as HTMLElement;
        if (prevOption) {
          prevOption.focus();
        } else {
          // Wrap to last option
          const options = dropdownRef.current?.querySelectorAll('[role="menuitem"]');
          const lastOption = options?.[options.length - 1] as HTMLElement;
          lastOption?.focus();
        }
        break;
    }
  };

  return (
    <div 
      className={`language-switcher ${className} ${compact ? 'compact' : ''}`}
      ref={dropdownRef}
    >
      <button
        ref={buttonRef}
        className={`language-switcher-button ${isChanging ? 'changing' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={i18nManager.t('language.switcherLabel')}
        disabled={isChanging}
      >
        {isChanging ? (
          <span className="changing-indicator">
            <span className="spinner" aria-hidden="true"></span>
            {i18nManager.t('language.changing')}
          </span>
        ) : (
          <span className="current-language">
            {showFlags && currentLangInfo && (
              <span className="language-flag" aria-hidden="true">
                {currentLangInfo.flag}
              </span>
            )}
            <span className="language-name">
              {compact 
                ? currentLanguage.toUpperCase()
                : showNativeNames && currentLangInfo
                  ? currentLangInfo.nativeName
                  : currentLangInfo?.name || currentLanguage
              }
            </span>
            <span className="dropdown-arrow" aria-hidden="true">
              {isOpen ? '▲' : '▼'}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="language-dropdown"
          role="menu"
          aria-label={i18nManager.t('language.availableLanguages')}
        >
          {supportedLanguages.map((language) => (
            <button
              key={language.code}
              className={`language-option ${language.code === currentLanguage ? 'current' : ''}`}
              onClick={() => handleLanguageChange(language.code)}
              onKeyDown={(e) => handleOptionKeyDown(e, language.code)}
              role="menuitem"
              tabIndex={-1}
              aria-current={language.code === currentLanguage ? 'true' : 'false'}
            >
              {showFlags && (
                <span className="language-flag" aria-hidden="true">
                  {language.flag}
                </span>
              )}
              <span className="language-info">
                <span className="language-name">
                  {language.name}
                </span>
                {showNativeNames && language.nativeName !== language.name && (
                  <span className="language-native-name">
                    {language.nativeName}
                  </span>
                )}
              </span>
              {language.rtl && (
                <span className="rtl-indicator" aria-label="Right-to-left language">
                  RTL
                </span>
              )}
              {language.code === currentLanguage && (
                <span className="current-indicator" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;