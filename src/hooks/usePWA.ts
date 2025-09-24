// Enhanced PWA Hook with Advanced Features
import { useState, useEffect, useCallback } from 'react';
import { backgroundSyncService } from '../services/backgroundSync.service';
import { pushNotificationsService } from '../services/pushNotifications.service';
import { offlineDataService } from '../services/offlineData.service';
import { performanceMonitoringService } from '../services/performanceMonitoring.service';

export interface PWAStatus {
  isOnline: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
  hasUpdate: boolean;
  syncStatus: {
    pendingTasks: number;
    isProcessing: boolean;
    lastSyncTime?: number;
  };
  notificationStatus: {
    supported: boolean;
    subscribed: boolean;
    permission: NotificationPermission;
  };
  storageUsage: {
    used: number;
    quota: number;
    percentage: number;
  };
}

export interface PWAActions {
  installApp: () => Promise<boolean>;
  updateApp: () => Promise<void>;
  syncNow: () => Promise<void>;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
  exportOfflineData: () => Promise<any>;
  importOfflineData: (data: any) => Promise<void>;
}

export const usePWA = () => {
  const [status, setStatus] = useState<PWAStatus>({
    isOnline: navigator.onLine,
    isInstalled: false,
    isInstallable: false,
    hasUpdate: false,
    syncStatus: {
      pendingTasks: 0,
      isProcessing: false,
    },
    notificationStatus: {
      supported: false,
      subscribed: false,
      permission: 'default',
    },
    storageUsage: {
      used: 0,
      quota: 0,
      percentage: 0,
    },
  });

  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Initialize PWA status
  useEffect(() => {
    const initializePWA = async () => {
      // Check installation status
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://');
      
      // Get notification status
      const notificationStatus = pushNotificationsService.getSubscriptionStatus();
      
      // Get storage usage
      const storageUsage = await offlineDataService.getStorageUsage();
      const storagePercentage = storageUsage.quota > 0 ? 
        (storageUsage.used / storageUsage.quota) * 100 : 0;
      
      // Get sync status
      const syncStatus = backgroundSyncService.getSyncStatus();

      setStatus(prev => ({
        ...prev,
        isInstalled: isStandalone,
        notificationStatus,
        storageUsage: {
          ...storageUsage,
          percentage: storagePercentage,
        },
        syncStatus,
      }));
    };

    initializePWA();
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      performanceMonitoringService.recordCustomMetric('connection_restored', 1);
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
      performanceMonitoringService.recordCustomMetric('connection_lost', 1);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setStatus(prev => ({ ...prev, isInstallable: true }));
    };

    const handleAppInstalled = () => {
      setStatus(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
      setInstallPrompt(null);
      performanceMonitoringService.recordCustomMetric('pwa_installed', 1);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Listen for service worker updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        setServiceWorkerRegistration(registration);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setStatus(prev => ({ ...prev, hasUpdate: true }));
              }
            });
          }
        });
      });
    }
  }, []);

  // Listen for sync status updates
  useEffect(() => {
    const unsubscribe = backgroundSyncService.onSyncStatusChange((syncStatus) => {
      setStatus(prev => ({ ...prev, syncStatus }));
    });

    return unsubscribe;
  }, []);

  // Update storage usage periodically
  useEffect(() => {
    const updateStorageUsage = async () => {
      const storageUsage = await offlineDataService.getStorageUsage();
      const storagePercentage = storageUsage.quota > 0 ? 
        (storageUsage.used / storageUsage.quota) * 100 : 0;

      setStatus(prev => ({
        ...prev,
        storageUsage: {
          ...storageUsage,
          percentage: storagePercentage,
        },
      }));
    };

    const interval = setInterval(updateStorageUsage, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // PWA Actions
  const installApp = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        performanceMonitoringService.recordCustomMetric('pwa_install_accepted', 1);
        return true;
      } else {
        performanceMonitoringService.recordCustomMetric('pwa_install_dismissed', 1);
        return false;
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
      performanceMonitoringService.recordCustomMetric('pwa_install_error', 1);
      return false;
    } finally {
      setInstallPrompt(null);
      setStatus(prev => ({ ...prev, isInstallable: false }));
    }
  }, [installPrompt]);

  const updateApp = useCallback(async (): Promise<void> => {
    if (serviceWorkerRegistration) {
      try {
        await serviceWorkerRegistration.update();
        window.location.reload();
      } catch (error) {
        console.error('App update failed:', error);
      }
    }
  }, [serviceWorkerRegistration]);

  const syncNow = useCallback(async (): Promise<void> => {
    if (!status.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    try {
      await backgroundSyncService.forceSyncNow();
      performanceMonitoringService.recordCustomMetric('manual_sync_success', 1);
    } catch (error) {
      performanceMonitoringService.recordCustomMetric('manual_sync_error', 1);
      throw error;
    }
  }, [status.isOnline]);

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    try {
      const permission = await pushNotificationsService.requestPermission();
      
      const notificationStatus = pushNotificationsService.getSubscriptionStatus();
      setStatus(prev => ({ ...prev, notificationStatus }));
      
      performanceMonitoringService.recordCustomMetric('notifications_enabled', 1);
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      performanceMonitoringService.recordCustomMetric('notifications_enable_error', 1);
      return false;
    }
  }, []);

  const disableNotifications = useCallback(async (): Promise<void> => {
    try {
      await pushNotificationsService.unsubscribe();
      
      const notificationStatus = pushNotificationsService.getSubscriptionStatus();
      setStatus(prev => ({ ...prev, notificationStatus }));
      
      performanceMonitoringService.recordCustomMetric('notifications_disabled', 1);
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      performanceMonitoringService.recordCustomMetric('notifications_disable_error', 1);
      throw error;
    }
  }, []);

  const clearOfflineData = useCallback(async (): Promise<void> => {
    try {
      await offlineDataService.clearAllData();
      
      // Update storage usage
      const storageUsage = await offlineDataService.getStorageUsage();
      const storagePercentage = storageUsage.quota > 0 ? 
        (storageUsage.used / storageUsage.quota) * 100 : 0;

      setStatus(prev => ({
        ...prev,
        storageUsage: {
          ...storageUsage,
          percentage: storagePercentage,
        },
      }));
      
      performanceMonitoringService.recordCustomMetric('offline_data_cleared', 1);
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }, []);

  const exportOfflineData = useCallback(async (): Promise<any> => {
    try {
      const data = await offlineDataService.exportData();
      performanceMonitoringService.recordCustomMetric('offline_data_exported', 1);
      return data;
    } catch (error) {
      console.error('Failed to export offline data:', error);
      throw error;
    }
  }, []);

  const importOfflineData = useCallback(async (data: any): Promise<void> => {
    try {
      await offlineDataService.importData(data);
      performanceMonitoringService.recordCustomMetric('offline_data_imported', 1);
    } catch (error) {
      console.error('Failed to import offline data:', error);
      throw error;
    }
  }, []);

  const actions: PWAActions = {
    installApp,
    updateApp,
    syncNow,
    enableNotifications,
    disableNotifications,
    clearOfflineData,
    exportOfflineData,
    importOfflineData,
  };

  return {
    status,
    actions,
    installPrompt: !!installPrompt,
    serviceWorkerRegistration,
  };
};