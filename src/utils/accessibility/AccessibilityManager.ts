/**
 * Comprehensive Accessibility Manager for WCAG 2.1 AA Compliance
 * Handles focus management, screen reader optimization, and keyboard navigation
 */

export interface AccessibilityOptions {
  announceChanges?: boolean;
  manageFocus?: boolean;
  enableKeyboardNavigation?: boolean;
  highContrast?: boolean;
  reducedMotion?: boolean;
  fontSize?: 'small' | 'medium' | 'large' | 'extra-large';
}

export interface FocusableElement {
  element: HTMLElement;
  tabIndex: number;
  role?: string;
}

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private options: AccessibilityOptions;
  private focusHistory: HTMLElement[] = [];
  private announcer: HTMLElement | null = null;
  private keyboardListeners: Map<string, (event: KeyboardEvent) => void> = new Map();

  private constructor() {
    this.options = this.loadUserPreferences();
    this.initializeAnnouncer();
    this.setupGlobalKeyboardHandlers();
    this.observePreferredColorScheme();
  }

  public static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  /**
   * Initialize screen reader announcer
   */
  private initializeAnnouncer(): void {
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.setAttribute('class', 'sr-only');
    this.announcer.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    document.body.appendChild(this.announcer);
  }

  /**
   * Announce message to screen readers
   */
  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.options.announceChanges || !this.announcer) return;

    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = '';
      }
    }, 1000);
  }

  /**
   * Manage focus for better keyboard navigation
   */
  public manageFocus(element: HTMLElement, options?: { 
    preventScroll?: boolean;
    restoreFocus?: boolean;
  }): void {
    if (!this.options.manageFocus) return;

    // Store current focus for restoration
    const currentFocus = document.activeElement as HTMLElement;
    if (currentFocus && options?.restoreFocus) {
      this.focusHistory.push(currentFocus);
    }

    // Set focus with options
    element.focus({ preventScroll: options?.preventScroll });

    // Ensure element is visible
    if (!options?.preventScroll) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }

  /**
   * Restore previous focus
   */
  public restoreFocus(): void {
    const previousElement = this.focusHistory.pop();
    if (previousElement && document.contains(previousElement)) {
      this.manageFocus(previousElement, { preventScroll: true });
    }
  }

  /**
   * Setup global keyboard handlers for accessibility
   */
  private setupGlobalKeyboardHandlers(): void {
    // Skip links navigation
    this.addKeyboardHandler('Tab', (event) => {
      if (event.shiftKey) {
        this.handleBackwardNavigation(event);
      } else {
        this.handleForwardNavigation(event);
      }
    });

    // Escape key handler
    this.addKeyboardHandler('Escape', (event) => {
      this.handleEscapeKey(event);
    });

    // Arrow key navigation for custom components
    this.addKeyboardHandler('ArrowDown', (event) => {
      this.handleArrowNavigation(event, 'down');
    });

    this.addKeyboardHandler('ArrowUp', (event) => {
      this.handleArrowNavigation(event, 'up');
    });

    this.addKeyboardHandler('ArrowLeft', (event) => {
      this.handleArrowNavigation(event, 'left');
    });

    this.addKeyboardHandler('ArrowRight', (event) => {
      this.handleArrowNavigation(event, 'right');
    });

    // Home/End navigation
    this.addKeyboardHandler('Home', (event) => {
      this.handleHomeEndNavigation(event, 'home');
    });

    this.addKeyboardHandler('End', (event) => {
      this.handleHomeEndNavigation(event, 'end');
    });
  }

  /**
   * Add keyboard event handler
   */
  public addKeyboardHandler(key: string, handler: (event: KeyboardEvent) => void): void {
    this.keyboardListeners.set(key, handler);
    document.addEventListener('keydown', (event) => {
      if (event.key === key) {
        handler(event);
      }
    });
  }

  /**
   * Handle forward tab navigation
   */
  private handleForwardNavigation(event: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.findIndex(el => el.element === document.activeElement);
    
    if (currentIndex === focusableElements.length - 1) {
      // Wrap to first element
      event.preventDefault();
      this.manageFocus(focusableElements[0].element);
    }
  }

  /**
   * Handle backward tab navigation
   */
  private handleBackwardNavigation(event: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.findIndex(el => el.element === document.activeElement);
    
    if (currentIndex === 0) {
      // Wrap to last element
      event.preventDefault();
      this.manageFocus(focusableElements[focusableElements.length - 1].element);
    }
  }

  /**
   * Handle escape key for modal/dialog dismissal
   */
  private handleEscapeKey(event: KeyboardEvent): void {
    const activeModal = document.querySelector('[role="dialog"][aria-modal="true"]');
    if (activeModal) {
      const closeButton = activeModal.querySelector('[data-dismiss="modal"]') as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
    }
  }

  /**
   * Handle arrow key navigation for custom components
   */
  private handleArrowNavigation(event: KeyboardEvent, direction: 'up' | 'down' | 'left' | 'right'): void {
    const target = event.target as HTMLElement;
    const container = target.closest('[role="menu"], [role="listbox"], [role="grid"], [role="tablist"]');
    
    if (!container) return;

    event.preventDefault();
    
    const items = Array.from(container.querySelectorAll('[role="menuitem"], [role="option"], [role="gridcell"], [role="tab"]')) as HTMLElement[];
    const currentIndex = items.indexOf(target);
    
    let nextIndex: number;
    
    switch (direction) {
      case 'down':
      case 'right':
        nextIndex = (currentIndex + 1) % items.length;
        break;
      case 'up':
      case 'left':
        nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        break;
    }
    
    this.manageFocus(items[nextIndex]);
  }

  /**
   * Handle Home/End navigation
   */
  private handleHomeEndNavigation(event: KeyboardEvent, type: 'home' | 'end'): void {
    const target = event.target as HTMLElement;
    const container = target.closest('[role="menu"], [role="listbox"], [role="grid"]');
    
    if (!container) return;

    event.preventDefault();
    
    const items = Array.from(container.querySelectorAll('[role="menuitem"], [role="option"], [role="gridcell"]')) as HTMLElement[];
    
    if (type === 'home') {
      this.manageFocus(items[0]);
    } else {
      this.manageFocus(items[items.length - 1]);
    }
  }

  /**
   * Get all focusable elements in the document
   */
  private getFocusableElements(): FocusableElement[] {
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];

    const elements = Array.from(document.querySelectorAll(selectors.join(', '))) as HTMLElement[];
    
    return elements
      .filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               !el.hasAttribute('aria-hidden');
      })
      .map(el => ({
        element: el,
        tabIndex: parseInt(el.getAttribute('tabindex') || '0'),
        role: el.getAttribute('role') || undefined
      }))
      .sort((a, b) => a.tabIndex - b.tabIndex);
  }

  /**
   * Update accessibility options
   */
  public updateOptions(newOptions: Partial<AccessibilityOptions>): void {
    this.options = { ...this.options, ...newOptions };
    this.saveUserPreferences();
    this.applyAccessibilitySettings();
  }

  /**
   * Apply accessibility settings to document
   */
  private applyAccessibilitySettings(): void {
    const root = document.documentElement;

    // High contrast mode
    if (this.options.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (this.options.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Font size
    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
    if (this.options.fontSize) {
      root.classList.add(`font-${this.options.fontSize}`);
    }
  }

  /**
   * Observe user's preferred color scheme
   */
  private observePreferredColorScheme(): void {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      this.updateOptions({ reducedMotion: e.matches });
    };

    mediaQuery.addEventListener('change', handleChange);
    
    // Set initial value
    this.updateOptions({ reducedMotion: mediaQuery.matches });
  }

  /**
   * Load user preferences from localStorage
   */
  private loadUserPreferences(): AccessibilityOptions {
    try {
      const saved = localStorage.getItem('accessibility-preferences');
      return saved ? JSON.parse(saved) : {
        announceChanges: true,
        manageFocus: true,
        enableKeyboardNavigation: true,
        highContrast: false,
        reducedMotion: false,
        fontSize: 'medium'
      };
    } catch {
      return {
        announceChanges: true,
        manageFocus: true,
        enableKeyboardNavigation: true,
        highContrast: false,
        reducedMotion: false,
        fontSize: 'medium'
      };
    }
  }

  /**
   * Save user preferences to localStorage
   */
  private saveUserPreferences(): void {
    try {
      localStorage.setItem('accessibility-preferences', JSON.stringify(this.options));
    } catch (error) {
      console.warn('Failed to save accessibility preferences:', error);
    }
  }

  /**
   * Get current accessibility options
   */
  public getOptions(): AccessibilityOptions {
    return { ...this.options };
  }

  /**
   * Test accessibility compliance
   */
  public async testCompliance(): Promise<{
    passed: boolean;
    issues: Array<{
      type: string;
      severity: 'error' | 'warning' | 'info';
      message: string;
      element?: HTMLElement;
    }>;
  }> {
    const issues: Array<{
      type: string;
      severity: 'error' | 'warning' | 'info';
      message: string;
      element?: HTMLElement;
    }> = [];

    // Test for missing alt text on images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.hasAttribute('alt')) {
        issues.push({
          type: 'missing-alt-text',
          severity: 'error',
          message: 'Image missing alt text',
          element: img as HTMLElement
        });
      }
    });

    // Test for proper heading hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let previousLevel = 0;
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        issues.push({
          type: 'heading-hierarchy',
          severity: 'warning',
          message: `Heading level ${level} follows level ${previousLevel}, skipping levels`,
          element: heading as HTMLElement
        });
      }
      previousLevel = level;
    });

    // Test for proper form labels
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const hasLabel = input.hasAttribute('aria-label') || 
                     input.hasAttribute('aria-labelledby') ||
                     document.querySelector(`label[for="${input.id}"]`);
      
      if (!hasLabel) {
        issues.push({
          type: 'missing-label',
          severity: 'error',
          message: 'Form control missing accessible label',
          element: input as HTMLElement
        });
      }
    });

    // Test color contrast (simplified check)
    const textElements = document.querySelectorAll('p, span, div, a, button, h1, h2, h3, h4, h5, h6');
    textElements.forEach(element => {
      const styles = window.getComputedStyle(element as HTMLElement);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // This is a simplified check - in production, you'd use a proper contrast ratio calculator
      if (color === backgroundColor) {
        issues.push({
          type: 'color-contrast',
          severity: 'error',
          message: 'Insufficient color contrast',
          element: element as HTMLElement
        });
      }
    });

    return {
      passed: issues.filter(issue => issue.severity === 'error').length === 0,
      issues
    };
  }
}

// Export singleton instance
export const accessibilityManager = AccessibilityManager.getInstance();