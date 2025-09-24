/**
 * Comprehensive Accessibility and Internationalization Demo
 * Demonstrates all implemented features working together
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAccessibility, useFocusManagement, useKeyboardNavigation } from '../../hooks/useAccessibility';
import { useInternationalization, useTextDirection } from '../../hooks/useInternationalization';
import { AccessibilityPanel } from '../accessibility/AccessibilityPanel';
import { LanguageSwitcher } from '../internationalization/LanguageSwitcher';
import { voiceCommandManager } from '../../utils/voice/VoiceCommandManager';

export const AccessibilityDemo: React.FC = () => {
  const [isAccessibilityPanelOpen, setIsAccessibilityPanelOpen] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [demoContent, setDemoContent] = useState('');
  const [notifications, setNotifications] = useState<string[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Accessibility hooks
  const { 
    announce, 
    manageFocus, 
    testCompliance, 
    isHighContrast, 
    isReducedMotion,
    fontSize 
  } = useAccessibility();
  
  const { focusFirst, trapFocus } = useFocusManagement(containerRef);
  
  useKeyboardNavigation(menuRef, {
    itemSelector: '[role="menuitem"]',
    orientation: 'vertical',
    wrap: true
  });
  
  // Internationalization hooks
  const { 
    t, 
    formatDate, 
    formatCurrency, 
    formatNumber, 
    pluralize,
    currentLanguage,
    isRTL 
  } = useInternationalization();
  
  const { getTextAlign, getDirection } = useTextDirection();

  useEffect(() => {
    // Setup voice commands for demo
    voiceCommandManager.addCommand('demo-generate', {
      phrases: ['generate demo content', 'create demo text'],
      action: () => {
        const content = t('demo.generatedContent');
        setDemoContent(content);
        announce(t('demo.contentGenerated'));
      },
      description: t('demo.voiceCommands.generateContent'),
      category: 'demo',
      enabled: true
    });

    voiceCommandManager.addCommand('demo-clear', {
      phrases: ['clear content', 'clear demo'],
      action: () => {
        setDemoContent('');
        announce(t('demo.contentCleared'));
      },
      description: t('demo.voiceCommands.clearContent'),
      category: 'demo',
      enabled: true
    });

    voiceCommandManager.addCommand('demo-accessibility', {
      phrases: ['open accessibility', 'accessibility settings'],
      action: () => {
        setIsAccessibilityPanelOpen(true);
        announce(t('demo.accessibilityPanelOpened'));
      },
      description: t('demo.voiceCommands.openAccessibility'),
      category: 'demo',
      enabled: true
    });

    return () => {
      voiceCommandManager.removeCommand('demo-generate');
      voiceCommandManager.removeCommand('demo-clear');
      voiceCommandManager.removeCommand('demo-accessibility');
    };
  }, [t, announce]);

  const handleGenerateContent = () => {
    const sampleContent = t('demo.sampleContent', {
      date: formatDate(new Date()),
      price: formatCurrency(299.99),
      count: formatNumber(1234)
    });
    
    setDemoContent(sampleContent);
    announce(t('demo.contentGenerated'));
    
    addNotification(t('demo.notifications.contentGenerated'));
  };

  const handleClearContent = () => {
    setDemoContent('');
    announce(t('demo.contentCleared'));
    addNotification(t('demo.notifications.contentCleared'));
  };

  const handleTestCompliance = async () => {
    announce(t('demo.testingCompliance'));
    
    try {
      const results = await testCompliance();
      const message = results.passed 
        ? t('demo.complianceTestPassed')
        : t('demo.complianceTestFailed', { count: results.issues.length });
      
      announce(message, 'assertive');
      addNotification(message);
    } catch (error) {
      const errorMessage = t('demo.complianceTestError');
      announce(errorMessage, 'assertive');
      addNotification(errorMessage);
    }
  };

  const handleToggleVoice = async () => {
    try {
      if (isVoiceEnabled) {
        voiceCommandManager.stopListening();
        setIsVoiceEnabled(false);
        announce(t('demo.voiceDisabled'));
      } else {
        await voiceCommandManager.startListening();
        setIsVoiceEnabled(true);
        announce(t('demo.voiceEnabled'));
      }
    } catch (error) {
      announce(t('demo.voiceError'), 'assertive');
    }
  };

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Handle escape key to close panels
    if (event.key === 'Escape' && isAccessibilityPanelOpen) {
      setIsAccessibilityPanelOpen(false);
    }
    
    // Trap focus in container
    trapFocus(event.nativeEvent);
  };

  return (
    <div 
      ref={containerRef}
      className={`accessibility-demo ${isHighContrast ? 'high-contrast' : ''} ${isReducedMotion ? 'reduced-motion' : ''}`}
      dir={getDirection()}
      onKeyDown={handleKeyDown}
    >
      {/* Skip Links */}
      <a href="#main-content" className="skip-link">
        {t('demo.skipToMain')}
      </a>
      <a href="#demo-controls" className="skip-link">
        {t('demo.skipToControls')}
      </a>

      {/* Header */}
      <header className="demo-header" role="banner">
        <h1 id="demo-title">
          {t('demo.title')}
        </h1>
        <p className="demo-description">
          {t('demo.description')}
        </p>
        
        {/* Language Switcher */}
        <div className="header-controls">
          <LanguageSwitcher 
            showFlags={true}
            showNativeNames={true}
            compact={false}
          />
          
          <button
            className="accessibility-button"
            onClick={() => setIsAccessibilityPanelOpen(true)}
            aria-label={t('demo.openAccessibilitySettings')}
          >
            ⚙️ {t('demo.accessibility')}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="demo-main" role="main">
        {/* Demo Controls */}
        <section id="demo-controls" className="demo-controls" aria-labelledby="controls-title">
          <h2 id="controls-title">{t('demo.controls.title')}</h2>
          
          <div className="control-group">
            <button
              className="demo-button primary"
              onClick={handleGenerateContent}
              data-action="generate-content"
            >
              {t('demo.controls.generateContent')}
            </button>
            
            <button
              className="demo-button secondary"
              onClick={handleClearContent}
              data-action="clear-content"
            >
              {t('demo.controls.clearContent')}
            </button>
            
            <button
              className="demo-button"
              onClick={handleTestCompliance}
            >
              {t('demo.controls.testCompliance')}
            </button>
          </div>

          {/* Voice Controls */}
          <div className="voice-controls">
            <h3>{t('demo.voiceControls.title')}</h3>
            <button
              className={`voice-toggle ${isVoiceEnabled ? 'active' : ''}`}
              onClick={handleToggleVoice}
              aria-pressed={isVoiceEnabled}
            >
              {isVoiceEnabled ? '🎤' : '🔇'} 
              {isVoiceEnabled ? t('demo.voiceControls.disable') : t('demo.voiceControls.enable')}
            </button>
            
            {isVoiceEnabled && (
              <div className="voice-commands-help" role="region" aria-labelledby="voice-help-title">
                <h4 id="voice-help-title">{t('demo.voiceControls.availableCommands')}</h4>
                <ul>
                  <li>"{t('demo.voiceCommands.generateContent')}"</li>
                  <li>"{t('demo.voiceCommands.clearContent')}"</li>
                  <li>"{t('demo.voiceCommands.openAccessibility')}"</li>
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Content Display */}
        <section className="demo-content" aria-labelledby="content-title">
          <h2 id="content-title">{t('demo.content.title')}</h2>
          
          {demoContent ? (
            <div 
              className="content-display"
              role="region"
              aria-live="polite"
              aria-label={t('demo.content.generatedContent')}
            >
              <p>{demoContent}</p>
              
              {/* Formatting Examples */}
              <div className="formatting-examples">
                <h3>{t('demo.formatting.title')}</h3>
                <dl>
                  <dt>{t('demo.formatting.date')}</dt>
                  <dd>{formatDate(new Date())}</dd>
                  
                  <dt>{t('demo.formatting.currency')}</dt>
                  <dd>{formatCurrency(1234.56)}</dd>
                  
                  <dt>{t('demo.formatting.number')}</dt>
                  <dd>{formatNumber(9876543)}</dd>
                  
                  <dt>{t('demo.formatting.pluralization')}</dt>
                  <dd>
                    {pluralize('demo.items', 1)} | {pluralize('demo.items', 5)}
                  </dd>
                </dl>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>{t('demo.content.empty')}</p>
              <button 
                className="demo-button primary"
                onClick={focusFirst}
              >
                {t('demo.content.getStarted')}
              </button>
            </div>
          )}
        </section>

        {/* Accessibility Features Demo */}
        <section className="accessibility-features" aria-labelledby="features-title">
          <h2 id="features-title">{t('demo.features.title')}</h2>
          
          <div className="feature-grid">
            <div className="feature-card">
              <h3>{t('demo.features.keyboardNavigation')}</h3>
              <p>{t('demo.features.keyboardNavigationDesc')}</p>
              
              {/* Demo Menu for Keyboard Navigation */}
              <div 
                ref={menuRef}
                className="demo-menu"
                role="menu"
                aria-label={t('demo.features.demoMenu')}
              >
                <button role="menuitem" tabIndex={-1}>
                  {t('demo.menu.item1')}
                </button>
                <button role="menuitem" tabIndex={-1}>
                  {t('demo.menu.item2')}
                </button>
                <button role="menuitem" tabIndex={-1}>
                  {t('demo.menu.item3')}
                </button>
              </div>
            </div>

            <div className="feature-card">
              <h3>{t('demo.features.screenReader')}</h3>
              <p>{t('demo.features.screenReaderDesc')}</p>
              
              <button
                className="demo-button"
                onClick={() => announce(t('demo.features.testAnnouncement'))}
              >
                {t('demo.features.testScreenReader')}
              </button>
            </div>

            <div className="feature-card">
              <h3>{t('demo.features.rtlSupport')}</h3>
              <p>{t('demo.features.rtlSupportDesc')}</p>
              
              <div className="rtl-demo" style={{ textAlign: getTextAlign('start') }}>
                <p>{t('demo.features.rtlExample')}</p>
                <p>{t('common.direction')}: {isRTL ? 'RTL' : 'LTR'}</p>
              </div>
            </div>

            <div className="feature-card">
              <h3>{t('demo.features.customization')}</h3>
              <p>{t('demo.features.customizationDesc')}</p>
              
              <div className="customization-info">
                <p>{t('demo.features.currentSettings')}:</p>
                <ul>
                  <li>{t('demo.features.fontSize')}: {fontSize}</li>
                  <li>{t('demo.features.highContrast')}: {isHighContrast ? t('common.yes') : t('common.no')}</li>
                  <li>{t('demo.features.reducedMotion')}: {isReducedMotion ? t('common.yes') : t('common.no')}</li>
                  <li>{t('demo.features.language')}: {currentLanguage}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notifications" role="region" aria-label={t('demo.notifications.title')}>
          {notifications.map((notification, index) => (
            <div 
              key={index}
              className="notification"
              role="status"
              aria-live="polite"
            >
              {notification}
            </div>
          ))}
        </div>
      )}

      {/* Accessibility Panel */}
      <AccessibilityPanel
        isOpen={isAccessibilityPanelOpen}
        onClose={() => setIsAccessibilityPanelOpen(false)}
      />

      {/* Live Region for Announcements */}
      <div 
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
    </div>
  );
};

export default AccessibilityDemo;