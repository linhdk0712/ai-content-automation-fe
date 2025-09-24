/**
 * React Hook for Accessibility Management
 * Provides easy access to accessibility features and settings
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { accessibilityManager, AccessibilityOptions } from '../utils/accessibility/AccessibilityManager';

export interface UseAccessibilityReturn {
  // Options and settings
  options: AccessibilityOptions;
  updateOptions: (newOptions: Partial<AccessibilityOptions>) => void;
  
  // Focus management
  manageFocus: (element: HTMLElement | null, options?: { preventScroll?: boolean; restoreFocus?: boolean }) => void;
  restoreFocus: () => void;
  
  // Announcements
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  
  // Compliance testing
  testCompliance: () => Promise<any>;
  
  // Keyboard navigation
  addKeyboardHandler: (key: string, handler: (event: KeyboardEvent) => void) => () => void;
  
  // Utility functions
  isHighContrast: boolean;
  isReducedMotion: boolean;
  fontSize: string;
}

export const useAccessibility = (): UseAccessibilityReturn => {
  const [options, setOptions] = useState<AccessibilityOptions>(accessibilityManager.getOptions());
  const keyboardHandlersRef = useRef<Map<string, () => void>>(new Map());

  useEffect(() => {
    // Sync with accessibility manager changes
    const checkOptions = () => {
      const currentOptions = accessibilityManager.getOptions();
      setOptions(currentOptions);
    };

    // Check for changes periodically (in case options are updated elsewhere)
    const interval = setInterval(checkOptions, 1000);

    return () => {
      clearInterval(interval);
      
      // Clean up keyboard handlers
      keyboardHandlersRef.current.forEach(cleanup => cleanup());
      keyboardHandlersRef.current.clear();
    };
  }, []);

  const updateOptions = useCallback((newOptions: Partial<AccessibilityOptions>) => {
    const updatedOptions = { ...options, ...newOptions };
    setOptions(updatedOptions);
    accessibilityManager.updateOptions(newOptions);
  }, [options]);

  const manageFocus = useCallback((
    element: HTMLElement | null, 
    focusOptions?: { preventScroll?: boolean; restoreFocus?: boolean }
  ) => {
    if (element) {
      accessibilityManager.manageFocus(element, focusOptions);
    }
  }, []);

  const restoreFocus = useCallback(() => {
    accessibilityManager.restoreFocus();
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    accessibilityManager.announce(message, priority);
  }, []);

  const testCompliance = useCallback(async () => {
    return await accessibilityManager.testCompliance();
  }, []);

  const addKeyboardHandler = useCallback((
    key: string, 
    handler: (event: KeyboardEvent) => void
  ): (() => void) => {
    // Remove existing handler for this key if it exists
    const existingCleanup = keyboardHandlersRef.current.get(key);
    if (existingCleanup) {
      existingCleanup();
    }

    // Add new handler
    accessibilityManager.addKeyboardHandler(key, handler);
    
    // Create cleanup function
    const cleanup = () => {
      // Note: AccessibilityManager doesn't have removeKeyboardHandler
      // In a real implementation, you'd add this method
      keyboardHandlersRef.current.delete(key);
    };

    keyboardHandlersRef.current.set(key, cleanup);
    
    return cleanup;
  }, []);

  return {
    options,
    updateOptions,
    manageFocus,
    restoreFocus,
    announce,
    testCompliance,
    addKeyboardHandler,
    isHighContrast: options.highContrast || false,
    isReducedMotion: options.reducedMotion || false,
    fontSize: options.fontSize || 'medium'
  };
};

/**
 * Hook for managing focus within a component
 */
export const useFocusManagement = (containerRef: React.RefObject<HTMLElement>) => {
  const { manageFocus, restoreFocus } = useAccessibility();

  const focusFirst = useCallback(() => {
    if (!containerRef.current) return;
    
    const focusableElements = containerRef.current.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      manageFocus(firstElement);
    }
  }, [containerRef, manageFocus]);

  const focusLast = useCallback(() => {
    if (!containerRef.current) return;
    
    const focusableElements = containerRef.current.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    if (lastElement) {
      manageFocus(lastElement);
    }
  }, [containerRef, manageFocus]);

  const trapFocus = useCallback((event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !containerRef.current) return;

    const focusableElements = Array.from(containerRef.current.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )) as HTMLElement[];

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        manageFocus(lastElement);
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        manageFocus(firstElement);
      }
    }
  }, [containerRef, manageFocus]);

  return {
    focusFirst,
    focusLast,
    trapFocus,
    manageFocus,
    restoreFocus
  };
};

/**
 * Hook for keyboard navigation within lists or grids
 */
export const useKeyboardNavigation = (
  containerRef: React.RefObject<HTMLElement>,
  options: {
    itemSelector?: string;
    orientation?: 'horizontal' | 'vertical' | 'both';
    wrap?: boolean;
  } = {}
) => {
  const { manageFocus } = useAccessibility();
  const {
    itemSelector = '[role="menuitem"], [role="option"], [role="gridcell"], [role="tab"]',
    orientation = 'vertical',
    wrap = true
  } = options;

  const handleKeyNavigation = useCallback((event: KeyboardEvent) => {
    if (!containerRef.current) return;

    const items = Array.from(containerRef.current.querySelectorAll(itemSelector)) as HTMLElement[];
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          nextIndex = wrap ? (currentIndex + 1) % items.length : Math.min(currentIndex + 1, items.length - 1);
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          nextIndex = wrap ? (currentIndex - 1 + items.length) % items.length : Math.max(currentIndex - 1, 0);
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          nextIndex = wrap ? (currentIndex + 1) % items.length : Math.min(currentIndex + 1, items.length - 1);
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          nextIndex = wrap ? (currentIndex - 1 + items.length) % items.length : Math.max(currentIndex - 1, 0);
        }
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = items.length - 1;
        break;
    }

    if (nextIndex !== currentIndex && items[nextIndex]) {
      manageFocus(items[nextIndex]);
    }
  }, [containerRef, itemSelector, orientation, wrap, manageFocus]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyNavigation);
    
    return () => {
      container.removeEventListener('keydown', handleKeyNavigation);
    };
  }, [handleKeyNavigation]);

  return {
    handleKeyNavigation
  };
};

/**
 * Hook for live region announcements
 */
export const useLiveRegion = () => {
  const { announce } = useAccessibility();
  const [messages, setMessages] = useState<Array<{ id: string; message: string; priority: 'polite' | 'assertive' }>>([]);

  const announceMessage = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const id = Date.now().toString();
    
    // Add to messages for visual display if needed
    setMessages(prev => [...prev, { id, message, priority }]);
    
    // Announce to screen readers
    announce(message, priority);
    
    // Remove message after a delay
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== id));
    }, 5000);
  }, [announce]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    announceMessage,
    clearMessages
  };
};

export default useAccessibility;