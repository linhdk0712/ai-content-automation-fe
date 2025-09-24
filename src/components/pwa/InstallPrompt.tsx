import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Slide,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  GetApp as InstallIcon,
  Close as CloseIcon,
  Smartphone as MobileIcon,
  Computer as DesktopIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface InstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({
  onInstall,
  onDismiss,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    // Check if app is already installed
    const checkInstallStatus = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                              (window.navigator as any).standalone ||
                              document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
      setIsInstalled(isStandaloneMode);
    };

    // Check if iOS
    const checkIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIOS(isIOSDevice);
    };

    checkInstallStatus();
    checkIOS();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Show prompt after a delay if not dismissed before
      const hasBeenDismissed = localStorage.getItem('pwa-install-dismissed');
      const dismissedTime = hasBeenDismissed ? parseInt(hasBeenDismissed) : 0;
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      
      if (!hasBeenDismissed || daysSinceDismissed > 7) {
        setTimeout(() => {
          if (!isInstalled) {
            setShowPrompt(true);
          }
        }, 3000);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      onInstall?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, onInstall]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstalled(true);
        onInstall?.();
      } else {
        console.log('User dismissed the install prompt');
        handleDismiss();
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    onDismiss?.();
  };

  const handleManualInstall = () => {
    setShowPrompt(false);
    // Show manual installation instructions
    setShowManualInstructions(true);
  };

  const [showManualInstructions, setShowManualInstructions] = useState(false);

  if (isInstalled || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <>
      {/* Main Install Prompt */}
      <Dialog
        open={showPrompt}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleDismiss}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            m: isMobile ? 1 : 2,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <InstallIcon color="primary" />
              <Typography variant="h6" component="span">
                Install AI Content Automation
              </Typography>
            </Box>
            <IconButton onClick={handleDismiss} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="body1" color="text.secondary">
              Install our app for a better experience with:
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={1} ml={2}>
              <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                • Offline content creation and editing
              </Typography>
              <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                • Push notifications for important updates
              </Typography>
              <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                • Faster loading and better performance
              </Typography>
              <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                • Home screen access like a native app
              </Typography>
            </Box>

            <Box 
              display="flex" 
              alignItems="center" 
              gap={2} 
              p={2} 
              bgcolor="primary.50" 
              borderRadius={1}
              mt={1}
            >
              {isMobile ? <MobileIcon color="primary" /> : <DesktopIcon color="primary" />}
              <Typography variant="body2" color="primary.main">
                Works on {isMobile ? 'mobile devices' : 'desktop computers'} and tablets
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleDismiss} color="inherit">
            Maybe Later
          </Button>
          {deferredPrompt ? (
            <Button
              onClick={handleInstallClick}
              variant="contained"
              startIcon={<InstallIcon />}
            >
              Install App
            </Button>
          ) : isIOS ? (
            <Button
              onClick={handleManualInstall}
              variant="contained"
              startIcon={<ShareIcon />}
            >
              Install Instructions
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>

      {/* Manual Installation Instructions for iOS */}
      <Dialog
        open={showManualInstructions}
        onClose={() => setShowManualInstructions(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Transition}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Install on iOS</Typography>
            <IconButton onClick={() => setShowManualInstructions(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="body1" color="text.secondary">
              To install this app on your iOS device:
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={2} ml={1}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  width={24}
                  height={24}
                  bgcolor="primary.main"
                  color="white"
                  borderRadius="50%"
                  fontSize="0.75rem"
                  fontWeight="bold"
                >
                  1
                </Box>
                <Typography variant="body2">
                  Tap the <ShareIcon sx={{ fontSize: 16, mx: 0.5 }} /> share button in Safari
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  width={24}
                  height={24}
                  bgcolor="primary.main"
                  color="white"
                  borderRadius="50%"
                  fontSize="0.75rem"
                  fontWeight="bold"
                >
                  2
                </Box>
                <Typography variant="body2">
                  Scroll down and tap "Add to Home Screen"
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  width={24}
                  height={24}
                  bgcolor="primary.main"
                  color="white"
                  borderRadius="50%"
                  fontSize="0.75rem"
                  fontWeight="bold"
                >
                  3
                </Box>
                <Typography variant="body2">
                  Tap "Add" to install the app
                </Typography>
              </Box>
            </Box>

            <Box 
              p={2} 
              bgcolor="info.50" 
              borderRadius={1}
              mt={1}
            >
              <Typography variant="body2" color="info.main">
                💡 The app will appear on your home screen and work like a native app!
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowManualInstructions(false)} variant="contained">
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InstallPrompt;