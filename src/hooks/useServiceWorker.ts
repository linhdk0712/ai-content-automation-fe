import { useState, useEffect } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalling: boolean;
  isWaiting: boolean;
  isControlling: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

interface ServiceWorkerActions {
  register: () => Promise<void>;
  unregister: () => Promise<void>;
  update: () => Promise<void>;
  skipWaiting: () => void;
}

export const useServiceWorker = (): ServiceWorkerState & ServiceWorkerActions => {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isInstalling: false,
    isWaiting: false,
    isControlling: false,
    registration: null,
    error: null,
  });

  useEffect(() => {
    if (!state.isSupported) {
      return;
    }

    // Check if already registered
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        setState(prev => ({
          ...prev,
          isRegistered: true,
          registration,
          isInstalling: registration.installing !== null,
          isWaiting: registration.waiting !== null,
          isControlling: registration.active !== null,
        }));

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            setState(prev => ({ ...prev, isInstalling: true }));
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New update available
                  setState(prev => ({ ...prev, isWaiting: true, isInstalling: false }));
                } else {
                  // First install
                  setState(prev => ({ ...prev, isControlling: true, isInstalling: false }));
                }
              }
            });
          }
        });
      }
    });

    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      setState(prev => ({ ...prev, isControlling: true, isWaiting: false }));
      // Reload the page to ensure all resources are from the new service worker
      window.location.reload();
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SKIP_WAITING') {
        setState(prev => ({ ...prev, isWaiting: false }));
      }
    });
  }, [state.isSupported]);

  const register = async (): Promise<void> => {
    if (!state.isSupported) {
      throw new Error('Service workers are not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      setState(prev => ({
        ...prev,
        isRegistered: true,
        registration,
        error: null,
      }));

      // Check for updates immediately
      registration.update();

      console.log('Service Worker registered successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  };

  const unregister = async (): Promise<void> => {
    if (!state.registration) {
      return;
    }

    try {
      const success = await state.registration.unregister();
      if (success) {
        setState(prev => ({
          ...prev,
          isRegistered: false,
          registration: null,
          isInstalling: false,
          isWaiting: false,
          isControlling: false,
          error: null,
        }));
        console.log('Service Worker unregistered successfully');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      console.error('Service Worker unregistration failed:', error);
      throw error;
    }
  };

  const update = async (): Promise<void> => {
    if (!state.registration) {
      throw new Error('No service worker registration found');
    }

    try {
      await state.registration.update();
      console.log('Service Worker update check completed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      console.error('Service Worker update failed:', error);
      throw error;
    }
  };

  const skipWaiting = (): void => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return {
    ...state,
    register,
    unregister,
    update,
    skipWaiting,
  };
};