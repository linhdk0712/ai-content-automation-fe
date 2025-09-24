import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Popper,
  ClickAwayListener,
  LinearProgress,
  Chip,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Close,
  ArrowForward,
  ArrowBack,
  PlayArrow,
  Pause,
  Replay,
  CheckCircle,
  Lightbulb,
  Help
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'hover' | 'type' | 'wait';
  actionText?: string;
  highlightElement?: boolean;
  showArrow?: boolean;
  optional?: boolean;
  videoUrl?: string;
  tips?: string[];
}

interface InteractiveTutorialProps {
  steps: TutorialStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
  showProgress?: boolean;
  allowSkip?: boolean;
}

const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  steps,
  onComplete,
  onSkip,
  autoStart = false,
  showProgress = true,
  allowSkip = true
}) => {
  const [isActive, setIsActive] = useState(autoStart);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);
  const [popperAnchor, setPopperAnchor] = useState<Element | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Find and highlight target element
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const targetElement = document.querySelector(currentStepData.target);
    if (targetElement) {
      setHighlightedElement(targetElement);
      setPopperAnchor(targetElement);
      
      // Scroll element into view
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });

      // Add highlight class
      if (currentStepData.highlightElement) {
        targetElement.classList.add('tutorial-highlight');
      }

      // Show tooltip after a delay
      timeoutRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, 500);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Remove highlight class from all elements
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
      });
    };
  }, [isActive, currentStep, currentStepData]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || !currentStepData) return;

    const autoAdvanceDelay = currentStepData.action === 'wait' ? 3000 : 5000;
    
    timeoutRef.current = setTimeout(() => {
      handleNext();
    }, autoAdvanceDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying, currentStep]);

  const handleStart = () => {
    setIsActive(true);
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setShowTooltip(false);
  };

  const handleNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    
    if (currentStep < steps.length - 1) {
      setShowTooltip(false);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 300);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setShowTooltip(false);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
      }, 300);
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    setIsPlaying(false);
    setShowTooltip(false);
    setHighlightedElement(null);
    onComplete?.();
  };

  const handleSkip = () => {
    setIsActive(false);
    setIsPlaying(false);
    setShowTooltip(false);
    setHighlightedElement(null);
    onSkip?.();
  };

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setIsPlaying(false);
  };

  // Tutorial overlay with spotlight effect
  const TutorialOverlay: React.FC = () => (
    <Box
      ref={overlayRef}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        pointerEvents: highlightedElement ? 'none' : 'auto'
      }}
    >
      {highlightedElement && (
        <Box
          sx={{
            position: 'absolute',
            border: '3px solid',
            borderColor: 'primary.main',
            borderRadius: 1,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
            animation: 'pulse 2s infinite'
          }}
          style={{
            top: highlightedElement.getBoundingClientRect().top - 5,
            left: highlightedElement.getBoundingClientRect().left - 5,
            width: highlightedElement.getBoundingClientRect().width + 10,
            height: highlightedElement.getBoundingClientRect().height + 10
          }}
        />
      )}
    </Box>
  );

  // Tutorial tooltip/popup
  const TutorialTooltip: React.FC = () => (
    <Popper
      open={showTooltip && !!popperAnchor}
      anchorEl={popperAnchor}
      placement={currentStepData?.position || 'bottom'}
      sx={{ zIndex: 10000 }}
      modifiers={[
        {
          name: 'offset',
          options: {
            offset: [0, 10]
          }
        }
      ]}
    >
      <ClickAwayListener onClickAway={() => {}}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 3,
              maxWidth: 350,
              backgroundColor: 'background.paper',
              border: '2px solid',
              borderColor: 'primary.main'
            }}
          >
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, mr: 1 }}>
                <Typography variant="caption" fontWeight="bold">
                  {currentStep + 1}
                </Typography>
              </Avatar>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {currentStepData?.title}
              </Typography>
              <IconButton size="small" onClick={handleSkip}>
                <Close />
              </IconButton>
            </Box>

            {/* Content */}
            <Typography variant="body2" paragraph>
              {currentStepData?.content}
            </Typography>

            {/* Action instruction */}
            {currentStepData?.actionText && (
              <Box sx={{ mb: 2 }}>
                <Chip
                  icon={<Lightbulb />}
                  label={currentStepData.actionText}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Box>
            )}

            {/* Tips */}
            {currentStepData?.tips && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  💡 Tips:
                </Typography>
                {currentStepData.tips.map((tip, index) => (
                  <Typography key={index} variant="caption" display="block" color="text.secondary">
                    • {tip}
                  </Typography>
                ))}
              </Box>
            )}

            {/* Video embed */}
            {currentStepData?.videoUrl && (
              <Box sx={{ mb: 2 }}>
                <video
                  width="100%"
                  height="150"
                  controls
                  style={{ borderRadius: 4 }}
                >
                  <source src={currentStepData.videoUrl} type="video/mp4" />
                </video>
              </Box>
            )}

            {/* Progress */}
            {showProgress && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption">
                    Step {currentStep + 1} of {steps.length}
                  </Typography>
                  <Typography variant="caption">
                    {Math.round(progress)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            )}

            {/* Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Previous step">
                  <IconButton
                    size="small"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                  >
                    <ArrowBack />
                  </IconButton>
                </Tooltip>
                <Tooltip title={isPlaying ? 'Pause auto-advance' : 'Auto-advance'}>
                  <IconButton size="small" onClick={togglePlayPause}>
                    {isPlaying ? <Pause /> : <PlayArrow />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Restart tutorial">
                  <IconButton size="small" onClick={handleRestart}>
                    <Replay />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {currentStepData?.optional && (
                  <Button size="small" onClick={handleNext}>
                    Skip
                  </Button>
                )}
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleNext}
                  endIcon={currentStep === steps.length - 1 ? <CheckCircle /> : <ArrowForward />}
                >
                  {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </ClickAwayListener>
    </Popper>
  );

  // Tutorial launcher button
  const TutorialLauncher: React.FC = () => (
    <Tooltip title="Start interactive tutorial">
      <Button
        variant="contained"
        color="primary"
        startIcon={<Help />}
        onClick={handleStart}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          borderRadius: 28,
          px: 3
        }}
      >
        Tutorial
      </Button>
    </Tooltip>
  );

  if (!isActive) {
    return <TutorialLauncher />;
  }

  return (
    <>
      <TutorialOverlay />
      <>
        {showTooltip && <TutorialTooltip />}
      </>
      
      {/* Global styles for tutorial highlighting */}
      <style>{`
        {.tutorial-highlight {
          position: relative;
          z-index: 10000 !important;
          box-shadow: 0 0 0 3px #1976d2, 0 0 20px rgba(25, 118, 210, 0.3) !important;
          border-radius: 4px !important;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
          }
        }
      `}</style>
    </>
  );
};

export default InteractiveTutorial;