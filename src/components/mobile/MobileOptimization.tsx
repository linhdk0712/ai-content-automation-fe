import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Switch, 
  FormControlLabel,
  Slider,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  WifiOff, 
  BatteryAlert, 
  DataUsage, 
  Speed, 
  CameraAlt, 
  Mic, 
  Vibration,
  Notifications,
  CloudSync,
  Storage
} from '@mui/icons-material';
import { pwaService } from '../../services/pwa.service';

interface MobileOptimizationProps {
  onSettingsChange?: (settings: MobileSettings) => void;
}

interface MobileSettings {
  dataCompression: boolean;
  imageQuality: number;
  offlineMode: boolean;
  backgroundSync: boolean;
  pushNotifications: boolean;
  vibration: boolean;
  autoSave: boolean;
  cacheSize: number;
}

interface DeviceCapabilities {
  hasCamera: boolean;
  hasGeolocation: boolean;
  hasVibration: boolean;
  hasNotifications: boolean;
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  hasBackgroundSync: boolean;
  hasShare: boolean;
  hasClipboard: boolean;
  hasWakeLock: boolean;
  isTouchDevice: boolean;
  isStandalone: boolean;
}

interface NetworkInfo {
  isOnline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface CacheInfo {
  used: number;
  quota: number;
  percentage: number;
}

export const MobileOptimization: React.FC<MobileOptimizationProps> = ({
  onSettingsChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [settings, setSettings] = useState<MobileSettings>({
    dataCompression: true,
    imageQuality: 80,
    offlineMode: true,
    backgroundSync: true,
    pushNotifications: false,
    vibration: true,
    autoSave: true,
    cacheSize: 50
  });
  
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({ isOnline: navigator.onLine });
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

  // Initialize mobile optimization
  useEffect(() => {
    initializeMobileOptimization();
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('mobileSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('mobileSettings', JSON.stringify(settings));
    onSettingsChange?.(settings);
  }, [settings, onSettingsChange]);

  // Monitor network changes
  useEffect(() => {
    const handleOnline = () => setNetworkInfo(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setNetworkInfo(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const updateConnectionInfo = () => {
        setNetworkInfo(prev => ({
          ...prev,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        }));
      };

      connection.addEventListener('change', updateConnectionInfo);
      updateConnectionInfo();

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', updateConnectionInfo);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update cache info periodically
  useEffect(() => {
    const updateCacheInfo = async () => {
      const cache = await pwaService.getCacheUsage();
      setCacheInfo({
        used: cache.used,
        quota: cache.quota,
        percentage: cache.quota > 0 ? (cache.used / cache.quota) * 100 : 0
      });
    };

    updateCacheInfo();
    const interval = setInterval(updateCacheInfo, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const initializeMobileOptimization = async () => {
    setIsLoading(true);
    
    try {
      // Get device capabilities
      const capabilities = pwaService.getDeviceCapabilities();
      setDeviceCapabilities(capabilities);

      // Initialize PWA features
      if (capabilities.hasNotifications && settings.pushNotifications) {
        await pwaService.requestNotificationPermission();
      }

      // Set up background sync
      if (capabilities.hasBackgroundSync && settings.backgroundSync) {
        await pwaService.scheduleBackgroundSync('mobile-optimization');
      }

    } catch (error) {
      console.error('Failed to initialize mobile optimization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = useCallback((key: keyof MobileSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await pwaService.requestNotificationPermission();
    if (granted) {
      await pwaService.subscribeToPushNotifications();
      handleSettingChange('pushNotifications', true);
    }
  };

  const handleClearCache = async () => {
    try {
      await pwaService.clearCache();
      setCacheInfo({ used: 0, quota: cacheInfo?.quota || 0, percentage: 0 });
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const handleWakeLock = async () => {
    if (wakeLock) {
      wakeLock.release();
      setWakeLock(null);
    } else {
      const lock = await pwaService.requestWakeLock();
      setWakeLock(lock);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getNetworkQualityColor = (effectiveType?: string) => {
    switch (effectiveType) {
      case '4g': return 'success';
      case '3g': return 'warning';
      case '2g': return 'error';
      case 'slow-2g': return 'error';
      default: return 'info';
    }
  };

  const optimizationRecommendations = useMemo(() => {
    const recommendations = [];

    if (networkInfo.saveData) {
      recommendations.push('Enable data compression to reduce bandwidth usage');
    }

    if (networkInfo.effectiveType === '2g' || networkInfo.effectiveType === 'slow-2g') {
      recommendations.push('Reduce image quality for faster loading');
      recommendations.push('Enable offline mode for better performance');
    }

    if (cacheInfo && cacheInfo.percentage > 80) {
      recommendations.push('Clear cache to free up storage space');
    }

    if (!settings.autoSave) {
      recommendations.push('Enable auto-save to prevent data loss');
    }

    return recommendations;
  }, [networkInfo, cacheInfo, settings]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Mobile Optimization
      </Typography>

      {/* Network Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Network Status
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Chip
                icon={networkInfo.isOnline ? <DataUsage /> : <WifiOff />}
                label={networkInfo.isOnline ? 'Online' : 'Offline'}
                color={networkInfo.isOnline ? 'success' : 'error'}
              />
            </Grid>
            
            {networkInfo.effectiveType && (
              <Grid item>
                <Chip
                  icon={<Speed />}
                  label={networkInfo.effectiveType.toUpperCase()}
                  color={getNetworkQualityColor(networkInfo.effectiveType) as any}
                />
              </Grid>
            )}
            
            {networkInfo.saveData && (
              <Grid item>
                <Chip
                  icon={<DataUsage />}
                  label="Data Saver"
                  color="warning"
                />
              </Grid>
            )}
          </Grid>

          {networkInfo.downlink && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Download Speed: {networkInfo.downlink} Mbps | 
              Latency: {networkInfo.rtt}ms
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Device Capabilities */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Device Capabilities
          </Typography>
          
          <Grid container spacing={1}>
            {deviceCapabilities && Object.entries({
              'Camera': { value: deviceCapabilities.hasCamera, icon: <CameraAlt /> },
              'Microphone': { value: deviceCapabilities.hasCamera, icon: <Mic /> },
              'Vibration': { value: deviceCapabilities.hasVibration, icon: <Vibration /> },
              'Notifications': { value: deviceCapabilities.hasNotifications, icon: <Notifications /> },
              'Background Sync': { value: deviceCapabilities.hasBackgroundSync, icon: <CloudSync /> },
              'Touch Device': { value: deviceCapabilities.isTouchDevice, icon: <Speed /> },
              'Standalone': { value: deviceCapabilities.isStandalone, icon: <Storage /> }
            }).map(([name, { value, icon }]) => (
              <Grid item key={name}>
                <Chip
                  icon={icon}
                  label={name}
                  color={value ? 'success' : 'default'}
                  variant={value ? 'filled' : 'outlined'}
                  size="small"
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Cache Information */}
      {cacheInfo && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Storage Usage
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Used: {formatBytes(cacheInfo.used)} / {formatBytes(cacheInfo.quota)} 
                ({cacheInfo.percentage.toFixed(1)}%)
              </Typography>
              
              <Box sx={{ width: '100%', mt: 1 }}>
                <Box
                  sx={{
                    width: '100%',
                    height: 8,
                    backgroundColor: 'grey.300',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      width: `${Math.min(cacheInfo.percentage, 100)}%`,
                      height: '100%',
                      backgroundColor: cacheInfo.percentage > 80 ? 'error.main' : 
                                     cacheInfo.percentage > 60 ? 'warning.main' : 'success.main',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </Box>
              </Box>
            </Box>

            <Button
              variant="outlined"
              onClick={handleClearCache}
              disabled={cacheInfo.used === 0}
            >
              Clear Cache
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Optimization Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Optimization Settings
          </Typography>

          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.dataCompression}
                  onChange={(e) => handleSettingChange('dataCompression', e.target.checked)}
                />
              }
              label="Data Compression"
            />
            <Typography variant="body2" color="text.secondary">
              Compress data to reduce bandwidth usage
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography gutterBottom>
              Image Quality: {settings.imageQuality}%
            </Typography>
            <Slider
              value={settings.imageQuality}
              onChange={(_, value) => handleSettingChange('imageQuality', value)}
              min={10}
              max={100}
              step={10}
              marks
              valueLabelDisplay="auto"
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.offlineMode}
                  onChange={(e) => handleSettingChange('offlineMode', e.target.checked)}
                />
              }
              label="Offline Mode"
            />
            <Typography variant="body2" color="text.secondary">
              Enable offline functionality with local caching
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.backgroundSync}
                  onChange={(e) => handleSettingChange('backgroundSync', e.target.checked)}
                  disabled={!deviceCapabilities?.hasBackgroundSync}
                />
              }
              label="Background Sync"
            />
            <Typography variant="body2" color="text.secondary">
              Sync data when connection is restored
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.pushNotifications}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleEnableNotifications();
                    } else {
                      handleSettingChange('pushNotifications', false);
                    }
                  }}
                  disabled={!deviceCapabilities?.hasNotifications}
                />
              }
              label="Push Notifications"
            />
            <Typography variant="body2" color="text.secondary">
              Receive notifications for important updates
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.vibration}
                  onChange={(e) => handleSettingChange('vibration', e.target.checked)}
                  disabled={!deviceCapabilities?.hasVibration}
                />
              }
              label="Vibration"
            />
            <Typography variant="body2" color="text.secondary">
              Enable haptic feedback
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoSave}
                  onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                />
              }
              label="Auto Save"
            />
            <Typography variant="body2" color="text.secondary">
              Automatically save work in progress
            </Typography>
          </Box>

          {deviceCapabilities?.hasWakeLock && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant={wakeLock ? 'contained' : 'outlined'}
                onClick={handleWakeLock}
                startIcon={<BatteryAlert />}
              >
                {wakeLock ? 'Release Wake Lock' : 'Keep Screen On'}
              </Button>
              <Typography variant="body2" color="text.secondary">
                Prevent screen from turning off during use
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {optimizationRecommendations.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Optimization Recommendations
            </Typography>
            
            {optimizationRecommendations.map((recommendation, index) => (
              <Alert key={index} severity="info" sx={{ mb: 1 }}>
                {recommendation}
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};