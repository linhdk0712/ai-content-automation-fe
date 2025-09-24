/**
 * Comprehensive Accessibility Control Panel
 * Provides user interface for accessibility settings and preferences
 */

import React, { useState, useEffect } from 'react';
import { accessibilityManager, AccessibilityOptions } from '../../utils/accessibility/AccessibilityManager';
import { voiceCommandManager, VoiceSettings } from '../../utils/voice/VoiceCommandManager';
import { i18nManager } from '../../utils/internationalization/i18nManager';

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({ isOpen, onClose }) => {
  const [accessibilityOptions, setAccessibilityOptions] = useState<AccessibilityOptions>(
    accessibilityManager.getOptions()
  );
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(
    voiceCommandManager.getSettings()
  );
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [complianceResults, setComplianceResults] = useState<any>(null);
  const [isTestingCompliance, setIsTestingCompliance] = useState(false);

  useEffect(() => {
    // Check voice support
    setIsVoiceSupported(voiceCommandManager.isSupported());
    setIsListening(voiceCommandManager.getIsListening());

    // Listen for voice events
    const unsubscribe = voiceCommandManager.addEventListener((event) => {
      if (event === 'listening-started') {
        setIsListening(true);
      } else if (event === 'listening-stopped') {
        setIsListening(false);
      }
    });

    return unsubscribe;
  }, []);

  const handleAccessibilityChange = (key: keyof AccessibilityOptions, value: any) => {
    const newOptions = { ...accessibilityOptions, [key]: value };
    setAccessibilityOptions(newOptions);
    accessibilityManager.updateOptions(newOptions);
    
    // Announce change to screen readers
    accessibilityManager.announce(`${key} ${value ? 'enabled' : 'disabled'}`);
  };

  const handleVoiceSettingChange = (key: keyof VoiceSettings, value: any) => {
    const newSettings = { ...voiceSettings, [key]: value };
    setVoiceSettings(newSettings);
    voiceCommandManager.updateSettings(newSettings);
  };

  const handleStartVoiceCommands = async () => {
    try {
      await voiceCommandManager.startListening();
      accessibilityManager.announce('Voice commands activated');
    } catch (error) {
      accessibilityManager.announce('Failed to start voice commands. Please check microphone permissions.');
    }
  };

  const handleStopVoiceCommands = () => {
    voiceCommandManager.stopListening();
    accessibilityManager.announce('Voice commands deactivated');
  };

  const handleTestCompliance = async () => {
    setIsTestingCompliance(true);
    try {
      const results = await accessibilityManager.testCompliance();
      setComplianceResults(results);
      
      const message = results.passed 
        ? 'Accessibility compliance test passed'
        : `Accessibility test found ${results.issues.length} issues`;
      
      accessibilityManager.announce(message);
    } catch (error) {
      accessibilityManager.announce('Failed to run accessibility compliance test');
    } finally {
      setIsTestingCompliance(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="accessibility-panel-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-panel-title"
      onKeyDown={handleKeyDown}
    >
      <div className="accessibility-panel">
        <header className="accessibility-panel-header">
          <h2 id="accessibility-panel-title">
            {i18nManager.t('accessibility.title')}
          </h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label={i18nManager.t('accessibility.close')}
            data-dismiss="modal"
          >
            ×
          </button>
        </header>

        <div className="accessibility-panel-content">
          {/* Visual Accessibility Settings */}
          <section className="settings-section" aria-labelledby="visual-settings-title">
            <h3 id="visual-settings-title">{i18nManager.t('accessibility.visual.title')}</h3>
            
            <div className="setting-item">
              <label htmlFor="high-contrast-toggle">
                {i18nManager.t('accessibility.visual.highContrast')}
              </label>
              <input
                id="high-contrast-toggle"
                type="checkbox"
                checked={accessibilityOptions.highContrast}
                onChange={(e) => handleAccessibilityChange('highContrast', e.target.checked)}
                aria-describedby="high-contrast-desc"
              />
              <p id="high-contrast-desc" className="setting-description">
                {i18nManager.t('accessibility.visual.highContrastDesc')}
              </p>
            </div>

            <div className="setting-item">
              <label htmlFor="reduced-motion-toggle">
                {i18nManager.t('accessibility.visual.reducedMotion')}
              </label>
              <input
                id="reduced-motion-toggle"
                type="checkbox"
                checked={accessibilityOptions.reducedMotion}
                onChange={(e) => handleAccessibilityChange('reducedMotion', e.target.checked)}
                aria-describedby="reduced-motion-desc"
              />
              <p id="reduced-motion-desc" className="setting-description">
                {i18nManager.t('accessibility.visual.reducedMotionDesc')}
              </p>
            </div>

            <div className="setting-item">
              <label htmlFor="font-size-select">
                {i18nManager.t('accessibility.visual.fontSize')}
              </label>
              <select
                id="font-size-select"
                value={accessibilityOptions.fontSize}
                onChange={(e) => handleAccessibilityChange('fontSize', e.target.value)}
                aria-describedby="font-size-desc"
              >
                <option value="small">{i18nManager.t('accessibility.visual.fontSizes.small')}</option>
                <option value="medium">{i18nManager.t('accessibility.visual.fontSizes.medium')}</option>
                <option value="large">{i18nManager.t('accessibility.visual.fontSizes.large')}</option>
                <option value="extra-large">{i18nManager.t('accessibility.visual.fontSizes.extraLarge')}</option>
              </select>
              <p id="font-size-desc" className="setting-description">
                {i18nManager.t('accessibility.visual.fontSizeDesc')}
              </p>
            </div>
          </section>

          {/* Navigation Accessibility Settings */}
          <section className="settings-section" aria-labelledby="navigation-settings-title">
            <h3 id="navigation-settings-title">{i18nManager.t('accessibility.navigation.title')}</h3>
            
            <div className="setting-item">
              <label htmlFor="keyboard-navigation-toggle">
                {i18nManager.t('accessibility.navigation.keyboardNavigation')}
              </label>
              <input
                id="keyboard-navigation-toggle"
                type="checkbox"
                checked={accessibilityOptions.enableKeyboardNavigation}
                onChange={(e) => handleAccessibilityChange('enableKeyboardNavigation', e.target.checked)}
                aria-describedby="keyboard-navigation-desc"
              />
              <p id="keyboard-navigation-desc" className="setting-description">
                {i18nManager.t('accessibility.navigation.keyboardNavigationDesc')}
              </p>
            </div>

            <div className="setting-item">
              <label htmlFor="focus-management-toggle">
                {i18nManager.t('accessibility.navigation.focusManagement')}
              </label>
              <input
                id="focus-management-toggle"
                type="checkbox"
                checked={accessibilityOptions.manageFocus}
                onChange={(e) => handleAccessibilityChange('manageFocus', e.target.checked)}
                aria-describedby="focus-management-desc"
              />
              <p id="focus-management-desc" className="setting-description">
                {i18nManager.t('accessibility.navigation.focusManagementDesc')}
              </p>
            </div>
          </section>

          {/* Screen Reader Settings */}
          <section className="settings-section" aria-labelledby="screen-reader-settings-title">
            <h3 id="screen-reader-settings-title">{i18nManager.t('accessibility.screenReader.title')}</h3>
            
            <div className="setting-item">
              <label htmlFor="announce-changes-toggle">
                {i18nManager.t('accessibility.screenReader.announceChanges')}
              </label>
              <input
                id="announce-changes-toggle"
                type="checkbox"
                checked={accessibilityOptions.announceChanges}
                onChange={(e) => handleAccessibilityChange('announceChanges', e.target.checked)}
                aria-describedby="announce-changes-desc"
              />
              <p id="announce-changes-desc" className="setting-description">
                {i18nManager.t('accessibility.screenReader.announceChangesDesc')}
              </p>
            </div>
          </section>

          {/* Voice Commands Settings */}
          {isVoiceSupported && (
            <section className="settings-section" aria-labelledby="voice-settings-title">
              <h3 id="voice-settings-title">{i18nManager.t('accessibility.voice.title')}</h3>
              
              <div className="setting-item">
                <label htmlFor="voice-commands-toggle">
                  {i18nManager.t('accessibility.voice.enabled')}
                </label>
                <input
                  id="voice-commands-toggle"
                  type="checkbox"
                  checked={voiceSettings.enabled}
                  onChange={(e) => handleVoiceSettingChange('enabled', e.target.checked)}
                  aria-describedby="voice-commands-desc"
                />
                <p id="voice-commands-desc" className="setting-description">
                  {i18nManager.t('accessibility.voice.enabledDesc')}
                </p>
              </div>

              {voiceSettings.enabled && (
                <>
                  <div className="setting-item">
                    <label htmlFor="voice-feedback-toggle">
                      {i18nManager.t('accessibility.voice.feedback')}
                    </label>
                    <input
                      id="voice-feedback-toggle"
                      type="checkbox"
                      checked={voiceSettings.voiceFeedback}
                      onChange={(e) => handleVoiceSettingChange('voiceFeedback', e.target.checked)}
                      aria-describedby="voice-feedback-desc"
                    />
                    <p id="voice-feedback-desc" className="setting-description">
                      {i18nManager.t('accessibility.voice.feedbackDesc')}
                    </p>
                  </div>

                  <div className="setting-item">
                    <label htmlFor="wake-word-input">
                      {i18nManager.t('accessibility.voice.wakeWord')}
                    </label>
                    <input
                      id="wake-word-input"
                      type="text"
                      value={voiceSettings.wakeWord || ''}
                      onChange={(e) => handleVoiceSettingChange('wakeWord', e.target.value)}
                      placeholder={i18nManager.t('accessibility.voice.wakeWordPlaceholder')}
                      aria-describedby="wake-word-desc"
                    />
                    <p id="wake-word-desc" className="setting-description">
                      {i18nManager.t('accessibility.voice.wakeWordDesc')}
                    </p>
                  </div>

                  <div className="voice-controls">
                    {!isListening ? (
                      <button
                        className="voice-control-button start-listening"
                        onClick={handleStartVoiceCommands}
                        aria-describedby="start-listening-desc"
                      >
                        {i18nManager.t('accessibility.voice.startListening')}
                      </button>
                    ) : (
                      <button
                        className="voice-control-button stop-listening"
                        onClick={handleStopVoiceCommands}
                        aria-describedby="stop-listening-desc"
                      >
                        {i18nManager.t('accessibility.voice.stopListening')}
                      </button>
                    )}
                    
                    {isListening && (
                      <div className="listening-indicator" aria-live="polite">
                        <span className="listening-icon">🎤</span>
                        {i18nManager.t('accessibility.voice.listening')}
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          )}

          {/* Compliance Testing */}
          <section className="settings-section" aria-labelledby="compliance-settings-title">
            <h3 id="compliance-settings-title">{i18nManager.t('accessibility.compliance.title')}</h3>
            
            <div className="compliance-controls">
              <button
                className="test-compliance-button"
                onClick={handleTestCompliance}
                disabled={isTestingCompliance}
                aria-describedby="test-compliance-desc"
              >
                {isTestingCompliance 
                  ? i18nManager.t('accessibility.compliance.testing')
                  : i18nManager.t('accessibility.compliance.test')
                }
              </button>
              <p id="test-compliance-desc" className="setting-description">
                {i18nManager.t('accessibility.compliance.testDesc')}
              </p>
            </div>

            {complianceResults && (
              <div className="compliance-results" aria-live="polite">
                <h4>
                  {complianceResults.passed 
                    ? i18nManager.t('accessibility.compliance.passed')
                    : i18nManager.t('accessibility.compliance.failed')
                  }
                </h4>
                
                {complianceResults.issues.length > 0 && (
                  <div className="compliance-issues">
                    <h5>{i18nManager.t('accessibility.compliance.issues')}</h5>
                    <ul>
                      {complianceResults.issues.map((issue: any, index: number) => (
                        <li key={index} className={`issue-${issue.severity}`}>
                          <strong>{issue.type}:</strong> {issue.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <footer className="accessibility-panel-footer">
          <button
            className="apply-button"
            onClick={onClose}
            aria-describedby="apply-desc"
          >
            {i18nManager.t('accessibility.apply')}
          </button>
          <p id="apply-desc" className="footer-description">
            {i18nManager.t('accessibility.applyDesc')}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AccessibilityPanel;