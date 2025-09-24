import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  LinearProgress,
  Chip
} from '@mui/material';
import { useOnboarding } from '../../hooks/useOnboarding';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  completed: boolean;
}

export const OnboardingTutorial: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [open, setOpen] = useState(false);
  
  const {
    currentStep,
    totalSteps,
    progress,
    completedSteps,
    completeStep,
    skipOnboarding,
    resetOnboarding
  } = useOnboarding();
  const onboardingSteps: OnboardingStep[] = [];
  const isOnboardingComplete = completedSteps.length >= totalSteps;
  
  useEffect(() => {
    if (!isOnboardingComplete && onboardingSteps.length > 0) {
      setOpen(true);
      setActiveStep(currentStep);
    }
  }, [isOnboardingComplete, currentStep, onboardingSteps]);
  
  const handleNext = () => {
    if (activeStep < onboardingSteps.length - 1) {
      if (onboardingSteps[activeStep]) {
        completeStep(onboardingSteps[activeStep].id);
      }
      setActiveStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };
  
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };
  
  const handleComplete = () => {
    if (onboardingSteps[activeStep]) {
      completeStep(onboardingSteps[activeStep].id);
    }
    setOpen(false);
  };
  
  const handleSkip = () => {
    skipOnboarding();
    setOpen(false);
  };
  
  const progressLocal = onboardingSteps.length > 0 ? ((activeStep + 1) / onboardingSteps.length) * 100 : progress;
  
  if (!open || onboardingSteps.length === 0) {
    return null;
  }
  
  const currentStepData = onboardingSteps[activeStep];
  
  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Welcome to AI Content Automation! 🚀
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Let's get you started with a quick tour
          </Typography>
          
          <Box sx={{ mt: 2, mb: 2 }}>
            <LinearProgress variant="determinate" value={progressLocal} />
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              Step {activeStep + 1} of {onboardingSteps.length}
            </Typography>
          </Box>
        </Box>
        
        <Stepper activeStep={activeStep} orientation="vertical">
          {onboardingSteps.map((step, index) => (
            <Step key={step.id}>
              <StepLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {step.title}
                  {step.completed && (
                    <Chip label="Completed" size="small" color="success" />
                  )}
                </Box>
              </StepLabel>
              <StepContent>
                <Card variant="outlined" sx={{ mt: 1 }}>
                  <CardContent>
                    <Typography variant="body2" paragraph>
                      {step.description}
                    </Typography>
                    {step.content}
                    
                    {step.action && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          onClick={step.action.onClick}
                          size="small"
                        >
                          {step.action.label}
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={handleSkip} color="inherit">
          Skip Tutorial
        </Button>
        
        <Box sx={{ flex: 1 }} />
        
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
          sx={{ mr: 1 }}
        >
          Back
        </Button>
        
        <Button
          onClick={handleNext}
          variant="contained"
        >
          {activeStep === onboardingSteps.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};