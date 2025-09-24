import React, { useState, useEffect, Suspense, useCallback } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Skeleton,
  Alert,
  Snackbar,
  Slide,
  Fade,
  SwipeableDrawer,
  LinearProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Create as CreateIcon,
  Schedule as ScheduleIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  CloudOff as OfflineIcon,
  CloudDone as OnlineIcon,
  Sync as SyncIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  GetApp as GetAppIcon,
  Close as CloseIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { backgroundSyncService } from '../../services/backgroundSync.service';
import { performanceMonitoringService } from '../../services/performanceMonitoring.service';

interface AppShellProps {
  children: React.ReactNode;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path: string;
  badge?: number;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({ pendingTasks: 0, isProcessing: false });
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      id: 'content',
      label: 'Create Content',
      icon: <CreateIcon />,
      path: '/content/creator',
    },
    {
      id: 'schedule',
      label: 'Scheduling',
      icon: <ScheduleIcon />,
      path: '/scheduling',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <AnalyticsIcon />,
      path: '/analytics',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
    },
  ];

  useEffect(() => {
    // Online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
      performanceMonitoringService.recordCustomMetric('connection_restored', 1);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
      performanceMonitoringService.recordCustomMetric('connection_lost', 1);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync status updates
    const updateSyncStatus = () => {
      const status = backgroundSyncService.getSyncStatus();
      setSyncStatus(status);
    };

    const syncInterval = setInterval(updateSyncStatus, 5000);
    updateSyncStatus();

    // Notification count updates
    const updateNotificationCount = () => {
      // This would typically come from your notification service
      setNotificationCount(Math.floor(Math.random() * 5));
    };

    const notificationInterval = setInterval(updateNotificationCount, 30000);

    // PWA install prompt handling
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      
      // Show install banner if not dismissed recently
      const lastDismissed = localStorage.getItem('pwa-install-dismissed');
      const daysSinceDismissed = lastDismissed ? 
        (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24) : 999;
      
      if (daysSinceDismissed > 7) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Touch gesture handling for drawer
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        setTouchStart({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart || e.touches.length !== 1) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - touchStart.x;
      const deltaY = Math.abs(currentY - touchStart.y);
      
      // Only handle horizontal swipes from left edge
      if (touchStart.x < 20 && deltaX > 0 && deltaY < 100) {
        setSwipeDistance(Math.min(deltaX, 240));
        
        if (deltaX > 50 && !drawerOpen) {
          setDrawerOpen(true);
        }
      }
    };

    const handleTouchEnd = () => {
      setTouchStart(null);
      setSwipeDistance(0);
    };

    if (isMobile) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    // Performance monitoring
    performanceMonitoringService.recordCustomMetric('app_shell_mounted', 1);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearInterval(syncInterval);
      clearInterval(notificationInterval);
      
      if (isMobile) {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isMobile, touchStart, drawerOpen]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = useCallback((path: string) => {
    setIsLoading(true);
    performanceMonitoringService.startCustomTimer(`navigation_${path}`);
    
    navigate(path);
    
    if (isMobile) {
      setDrawerOpen(false);
    }
    
    // Simulate loading completion
    setTimeout(() => {
      setIsLoading(false);
      performanceMonitoringService.endCustomTimer(`navigation_${path}`);
    }, 300);
  }, [navigate, isMobile]);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
    navigate('/login');
  };

  const handleSyncNow = useCallback(async () => {
    if (isOnline) {
      try {
        setSyncStatus(prev => ({ ...prev, isProcessing: true }));
        await backgroundSyncService.forceSyncNow();
        performanceMonitoringService.recordCustomMetric('manual_sync_success', 1);
      } catch (error) {
        console.error('Manual sync failed:', error);
        performanceMonitoringService.recordCustomMetric('manual_sync_error', 1);
      } finally {
        setSyncStatus(prev => ({ ...prev, isProcessing: false }));
      }
    }
  }, [isOnline]);

  const handleInstallApp = useCallback(async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        
        if (outcome === 'accepted') {
          performanceMonitoringService.recordCustomMetric('pwa_install_accepted', 1);
        } else {
          performanceMonitoringService.recordCustomMetric('pwa_install_dismissed', 1);
        }
        
        setInstallPrompt(null);
        setShowInstallBanner(false);
      } catch (error) {
        console.error('Install prompt failed:', error);
      }
    }
  }, [installPrompt]);

  const handleDismissInstallBanner = useCallback(() => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    performanceMonitoringService.recordCustomMetric('pwa_install_banner_dismissed', 1);
  }, []);

  const renderNavigationList = () => (
    <List>
      {navigationItems.map((item) => (
        <ListItem key={item.id} disablePadding>
          <ListItemButton
            selected={location.pathname === item.path}
            onClick={() => handleNavigation(item.path)}
            sx={{
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.contrastText,
                },
              },
            }}
          >
            <ListItemIcon>
              {item.badge ? (
                <Badge badgeContent={item.badge} color="error">
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );

  const renderAppBar = () => (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: 1,
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          AI Content Automation
        </Typography>

        {/* Connection Status */}
        <IconButton
          color="inherit"
          onClick={handleSyncNow}
          disabled={!isOnline || syncStatus.isProcessing}
          title={isOnline ? 'Online' : 'Offline'}
        >
          {syncStatus.isProcessing ? (
            <SyncIcon className="animate-spin" />
          ) : isOnline ? (
            <OnlineIcon color="success" />
          ) : (
            <OfflineIcon color="error" />
          )}
        </IconButton>

        {/* Sync Status */}
        {syncStatus.pendingTasks > 0 && (
          <Badge badgeContent={syncStatus.pendingTasks} color="warning">
            <SyncIcon />
          </Badge>
        )}

        {/* Notifications */}
        <IconButton
          color="inherit"
          onClick={() => navigate('/notifications')}
        >
          <Badge badgeContent={notificationCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        {/* User Menu */}
        <IconButton
          color="inherit"
          onClick={handleUserMenuOpen}
          sx={{ ml: 1 }}
        >
          <Avatar
            src={user?.profilePictureUrl}
            alt={user?.username}
            sx={{ width: 32, height: 32 }}
          >
            {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={handleUserMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => { handleUserMenuClose(); navigate('/profile'); }}>
            <ListItemIcon>
              <AccountIcon fontSize="small" />
            </ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem onClick={() => { handleUserMenuClose(); navigate('/settings'); }}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );

  const renderDrawer = () => {
    if (isMobile) {
      return (
        <SwipeableDrawer
          open={drawerOpen}
          onClose={handleDrawerToggle}
          onOpen={() => setDrawerOpen(true)}
          disableBackdropTransition
          disableDiscovery
          swipeAreaWidth={20}
          hysteresis={0.52}
          minFlingVelocity={450}
          ModalProps={{ keepMounted: true }}
          sx={{
            width: 240,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 240,
              boxSizing: 'border-box',
              mt: 0,
              height: '100%',
              transform: swipeDistance > 0 ? `translateX(${Math.min(swipeDistance - 240, 0)}px)` : 'none',
              transition: swipeDistance > 0 ? 'none' : 'transform 225ms cubic-bezier(0, 0, 0.2, 1)',
            },
          }}
        >
          <Toolbar>
            <Typography variant="h6" noWrap component="div">
              Menu
            </Typography>
          </Toolbar>
          <Box sx={{ overflow: 'auto', p: 1 }}>
            {renderNavigationList()}
            <Divider sx={{ my: 2 }} />
            {/* Sync Status */}
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Status
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                {isOnline ? (
                  <OnlineIcon color="success" fontSize="small" />
                ) : (
                  <OfflineIcon color="error" fontSize="small" />
                )}
                <Typography variant="body2">
                  {isOnline ? 'Online' : 'Offline'}
                </Typography>
              </Box>
              {syncStatus.pendingTasks > 0 && (
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <SyncIcon fontSize="small" color="warning" />
                  <Typography variant="body2" color="warning.main">
                    {syncStatus.pendingTasks} pending sync{syncStatus.pendingTasks > 1 ? 's' : ''}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </SwipeableDrawer>
      );
    }

    return (
      <Drawer
        variant="permanent"
        open
        ModalProps={{ keepMounted: true }}
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            mt: 8,
            height: 'calc(100% - 64px)',
          },
        }}
      >
        <Box sx={{ overflow: 'auto', p: 1 }}>
          {renderNavigationList()}
          <Divider sx={{ my: 2 }} />
          {/* Sync Status */}
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Status
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
              {isOnline ? (
                <OnlineIcon color="success" fontSize="small" />
              ) : (
                <OfflineIcon color="error" fontSize="small" />
              )}
              <Typography variant="body2">
                {isOnline ? 'Online' : 'Offline'}
              </Typography>
            </Box>
            {syncStatus.pendingTasks > 0 && (
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <SyncIcon fontSize="small" color="warning" />
                <Typography variant="body2" color="warning.main">
                  {syncStatus.pendingTasks} pending sync{syncStatus.pendingTasks > 1 ? 's' : ''}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>
    );
  };

  const renderLoadingFallback = () => (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="60%" height={40} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="80%" height={20} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="40%" height={20} />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {renderAppBar()}
      {renderDrawer()}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          ml: isMobile ? 0 : '240px',
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Suspense fallback={renderLoadingFallback()}>
          {children}
        </Suspense>
      </Box>

      {/* Loading Progress */}
      <Fade in={isLoading}>
        <LinearProgress
          sx={{
            position: 'fixed',
            top: isMobile ? 56 : 64,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar + 1,
          }}
        />
      </Fade>

      {/* Install App Banner */}
      <Slide direction="down" in={showInstallBanner && !isMobile}>
        <Alert
          severity="info"
          action={
            <Box display="flex" gap={1}>
              <IconButton
                size="small"
                onClick={handleInstallApp}
                sx={{ color: 'info.main' }}
              >
                <GetAppIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleDismissInstallBanner}
                sx={{ color: 'info.main' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          }
          sx={{
            position: 'fixed',
            top: isMobile ? 56 : 64,
            left: isMobile ? 0 : 240,
            right: 0,
            zIndex: theme.zIndex.appBar,
            borderRadius: 0,
          }}
        >
          Install AI Content Automation for a better experience with offline support and push notifications.
        </Alert>
      </Slide>

      {/* Offline Alert */}
      <Snackbar
        open={showOfflineAlert}
        autoHideDuration={6000}
        onClose={() => setShowOfflineAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowOfflineAlert(false)} 
          severity="warning"
          sx={{ width: '100%' }}
          action={
            <IconButton
              size="small"
              onClick={() => navigate('/offline')}
              sx={{ color: 'warning.main' }}
            >
              <InfoIcon />
            </IconButton>
          }
        >
          You're offline. Some features may be limited. Tap for more info.
        </Alert>
      </Snackbar>

      {/* Sync Status Snackbar */}
      <Snackbar
        open={syncStatus.pendingTasks > 0 && isOnline}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          severity="info"
          sx={{ width: '100%' }}
          action={
            <IconButton
              size="small"
              onClick={handleSyncNow}
              disabled={syncStatus.isProcessing}
              sx={{ color: 'info.main' }}
            >
              {syncStatus.isProcessing ? <SyncIcon className="animate-spin" /> : <SyncIcon />}
            </IconButton>
          }
        >
          {syncStatus.pendingTasks} task{syncStatus.pendingTasks > 1 ? 's' : ''} waiting to sync
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AppShell;