import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';

interface MobileState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  screenSize: {
    width: number;
    height: number;
  };
  deviceType: 'mobile' | 'tablet' | 'desktop';
  touchSupported: boolean;
  isStandalone: boolean;
  platform: string;
}

interface MobileActions {
  requestFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  vibrate: (pattern: number | number[]) => boolean;
  share: (data: ShareData) => Promise<void>;
  requestWakeLock: () => Promise<WakeLockSentinel | null>;
}

export const useMobile = (): MobileState & MobileActions => {
  const theme = useTheme();
  const isMobileQuery = useMediaQuery(theme.breakpoints.down('md'));
  const isTabletQuery = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  const [state, setState] = useState<MobileState>({
    isMobile: isMobileQuery,
    isTablet: isTabletQuery,
    isDesktop: !isMobileQuery && !isTabletQuery,
    orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
    screenSize: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    deviceType: isMobileQuery ? 'mobile' : isTabletQuery ? 'tablet' : 'desktop',
    touchSupported: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as any).standalone ||
                  document.referrer.includes('android-app://'),
    platform: navigator.platform,
  });

  useEffect(() => {
    const updateScreenInfo = () => {
      const newOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      const newScreenSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      setState(prev => ({
        ...prev,
        orientation: newOrientation,
        screenSize: newScreenSize,
        isMobile: isMobileQuery,
        isTablet: isTabletQuery,
        isDesktop: !isMobileQuery && !isTabletQuery,
        deviceType: isMobileQuery ? 'mobile' : isTabletQuery ? 'tablet' : 'desktop',
      }));
    };

    const handleOrientationChange = () => {
      // Delay to ensure dimensions are updated
      setTimeout(updateScreenInfo, 100);
    };

    const handleResize = () => {
      updateScreenInfo();
    };

    // Listen for orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);

    // Listen for display mode changes (PWA install/uninstall)
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setState(prev => ({
        ...prev,
        isStandalone: e.matches,
      }));
    };

    displayModeQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
      displayModeQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, [isMobileQuery, isTabletQuery]);

  const requestFullscreen = async (): Promise<void> => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
        throw error;
      }
    }
  };

  const exitFullscreen = async (): Promise<void> => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.error('Failed to exit fullscreen:', error);
        throw error;
      }
    }
  };

  const vibrate = (pattern: number | number[]): boolean => {
    if ('vibrate' in navigator) {
      return navigator.vibrate(pattern);
    }
    return false;
  };

  const share = async (data: ShareData): Promise<void> => {
    if ('share' in navigator) {
      try {
        await navigator.share(data);
      } catch (error) {
        console.error('Failed to share:', error);
        throw error;
      }
    } else {
      // Fallback to clipboard
      if (data.url && 'clipboard' in navigator) {
        await (navigator as any).clipboard.writeText(data.url);
      } else {
        throw new Error('Sharing not supported');
      }
    }
  };

  const requestWakeLock = async (): Promise<WakeLockSentinel | null> => {
    if ('wakeLock' in navigator) {
      try {
        const wakeLock = await (navigator as any).wakeLock.request('screen');
        return wakeLock;
      } catch (error) {
        console.error('Failed to request wake lock:', error);
        return null;
      }
    }
    return null;
  };

  return {
    ...state,
    requestFullscreen,
    exitFullscreen,
    vibrate,
    share,
    requestWakeLock,
  };
};

// Device detection utilities
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isChrome = /Chrome/.test(userAgent);
  const isFirefox = /Firefox/.test(userAgent);
  
  return {
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isFirefox,
    userAgent,
  };
};

// Performance utilities for mobile
export const optimizeForMobile = () => {
  // Disable hover effects on touch devices
  if ('ontouchstart' in window) {
    document.documentElement.classList.add('touch-device');
  }

  // Optimize scrolling performance
  const style = document.createElement('style');
  style.textContent = `
    * {
      -webkit-overflow-scrolling: touch;
    }
    
    .touch-device *:hover {
      -webkit-tap-highlight-color: transparent;
    }
    
    @media (max-width: 768px) {
      * {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
    }
  `;
  document.head.appendChild(style);
};

// Gesture detection utilities
export const useGestures = () => {
  const [gestureState, setGestureState] = useState({
    isSwipeEnabled: true,
    isPinchEnabled: true,
    swipeThreshold: 50,
    pinchThreshold: 0.1,
  });

  const detectSwipe = (
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): 'left' | 'right' | 'up' | 'down' | null => {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (Math.max(absDeltaX, absDeltaY) < gestureState.swipeThreshold) {
      return null;
    }

    if (absDeltaX > absDeltaY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  };

  const detectPinch = (
    initialDistance: number,
    currentDistance: number
  ): 'zoom-in' | 'zoom-out' | null => {
    const ratio = currentDistance / initialDistance;
    
    if (ratio > 1 + gestureState.pinchThreshold) {
      return 'zoom-in';
    } else if (ratio < 1 - gestureState.pinchThreshold) {
      return 'zoom-out';
    }
    
    return null;
  };

  return {
    gestureState,
    setGestureState,
    detectSwipe,
    detectPinch,
  };
};