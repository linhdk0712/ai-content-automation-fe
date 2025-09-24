import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Grid,
  Paper
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  School as TutorialIcon,
  CheckCircle as CheckIcon,
  PlayArrow as PlayIcon,
  Article as ArticleIcon,
  VideoLibrary as VideoIcon,
  Group as TeamIcon,
  Palette as DesignIcon,
  Analytics as AnalyticsIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useOnboarding } from '../../hooks/useOnboarding';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface UserProfile {
  name: string;
  role: string;
  company: string;
  industry: string;
  teamSize: string;
  goals: string[];
  experience: string;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'video' | 'interactive' | 'article';
  category: string;
  completed: boolean;
}

const OnboardingWizard: React.FC = () => {
  const { 
    currentStep, 
    totalSteps, 
    progress, 
    updateProfile, 
    completeStep, 
    skipOnboarding,
    loading 
  } = useOnboarding();

  const [activeStep, setActiveStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    role: '',
    company: '',
    industry: '',
    teamSize: '',
    goals: [],
    experience: ''
  });
  const [selectedTutorials, setSelectedTutorials] = useState<string[]>([]);
  const [tutorialDialogOpen, setTutorialDialogOpen] = useState(false);
  const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);

  const steps = [
    {
      label: 'Welcome',
      description: 'Get started with AI Content Automation',
    },
    {
      label: 'Profile Setup',
      description: 'Tell us about yourself and your goals',
    },
    {
      label: 'Preferences',
      description: 'Customize your experience',
    },
    {
      label: 'Learn the Basics',
      description: 'Interactive tutorials and guides',
    },
    {
      label: 'Complete Setup',
      description: 'Finish your onboarding',
    },
  ];

  const industries = [
    'Technology',
    'Marketing & Advertising',
    'E-commerce',
    'Healthcare',
    'Education',
    'Finance',
    'Media & Entertainment',
    'Non-profit',
    'Other'
  ];

  const roles = [
    'Content Creator',
    'Marketing Manager',
    'Social Media Manager',
    'Business Owner',
    'Freelancer',
    'Agency Owner',
    'Student',
    'Other'
  ];

  const teamSizes = [
    'Just me',
    '2-5 people',
    '6-20 people',
    '21-50 people',
    '50+ people'
  ];

  const goals = [
    'Create engaging content faster',
    'Improve content quality',
    'Scale content production',
    'Automate social media posting',
    'Collaborate with team members',
    'Analyze content performance',
    'Generate more leads',
    'Build brand awareness'
  ];

  const tutorials: Tutorial[] = [
    {
      id: '1',
      title: 'Creating Your First Content',
      description: 'Learn how to generate AI-powered content',
      duration: '5 min',
      type: 'interactive',
      category: 'basics',
      completed: false
    },
    {
      id: '2',
      title: 'Using AI Templates',
      description: 'Discover pre-built templates for different industries',
      duration: '3 min',
      type: 'video',
      category: 'basics',
      completed: false
    },
    {
      id: '3',
      title: 'Team Collaboration',
      description: 'Invite team members and manage permissions',
      duration: '4 min',
      type: 'interactive',
      category: 'collaboration',
      completed: false
    },
    {
      id: '4',
      title: 'Scheduling & Publishing',
      description: 'Automate your content publishing workflow',
      duration: '6 min',
      type: 'video',
      category: 'automation',
      completed: false
    },
    {
      id: '5',
      title: 'Analytics & Insights',
      description: 'Track performance and optimize your content',
      duration: '5 min',
      type: 'article',
      category: 'analytics',
      completed: false
    }
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleProfileChange = (field: keyof UserProfile, value: any) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleGoalToggle = (goal: string) => {
    const currentGoals = profile.goals;
    const newGoals = currentGoals.includes(goal)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal];
    setProfile({ ...profile, goals: newGoals });
  };

  const handleTutorialSelect = (tutorialId: string) => {
    setSelectedTutorials(prev =>
      prev.includes(tutorialId)
        ? prev.filter(id => id !== tutorialId)
        : [...prev, tutorialId]
    );
  };

  const handleStartTutorial = (tutorial: Tutorial) => {
    setCurrentTutorial(tutorial);
    setTutorialDialogOpen(true);
  };

  const handleCompleteTutorial = () => {
    if (currentTutorial) {
      // Mark tutorial as completed
      setTutorialDialogOpen(false);
      setCurrentTutorial(null);
    }
  };

  const handleFinishOnboarding = async () => {
    try {
      await updateProfile(profile);
      await completeStep('onboarding');
      // Redirect to dashboard or main app
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const getTutorialIcon = (type: string) => {
    switch (type) {
      case 'video': return <VideoIcon />;
      case 'interactive': return <PlayIcon />;
      case 'article': return <ArticleIcon />;
      default: return <ArticleIcon />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'basics': return <PersonIcon />;
      case 'collaboration': return <TeamIcon />;
      case 'automation': return <ScheduleIcon />;
      case 'analytics': return <AnalyticsIcon />;
      default: return <PersonIcon />;
    }
  };

  const renderWelcomeStep = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Welcome to AI Content Automation! 🎉
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        Let's get you set up in just a few minutes
      </Typography>
      <Box sx={{ mb: 4 }}>
        <LinearProgress variant="determinate" value={0} sx={{ height: 8, borderRadius: 4 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Step 1 of {steps.length}
        </Typography>
      </Box>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <DesignIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6">Create</Typography>
            <Typography variant="body2" color="text.secondary">
              Generate AI-powered content in seconds
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <ScheduleIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6">Automate</Typography>
            <Typography variant="body2" color="text.secondary">
              Schedule and publish across platforms
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <AnalyticsIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6">Analyze</Typography>
            <Typography variant="body2" color="text.secondary">
              Track performance and optimize
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderProfileStep = () => (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom>
        Tell us about yourself
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        This helps us personalize your experience
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Full Name"
            value={profile.name}
            onChange={(e) => handleProfileChange('name', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={profile.role}
              onChange={(e) => handleProfileChange('role', e.target.value)}
              label="Role"
            >
              {roles.map(role => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Company"
            value={profile.company}
            onChange={(e) => handleProfileChange('company', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Industry</InputLabel>
            <Select
              value={profile.industry}
              onChange={(e) => handleProfileChange('industry', e.target.value)}
              label="Industry"
            >
              {industries.map(industry => (
                <MenuItem key={industry} value={industry}>{industry}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Team Size</InputLabel>
            <Select
              value={profile.teamSize}
              onChange={(e) => handleProfileChange('teamSize', e.target.value)}
              label="Team Size"
            >
              {teamSizes.map(size => (
                <MenuItem key={size} value={size}>{size}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Experience Level</InputLabel>
            <Select
              value={profile.experience}
              onChange={(e) => handleProfileChange('experience', e.target.value)}
              label="Experience Level"
            >
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );

  const renderGoalsStep = () => (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom>
        What are your main goals?
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Select all that apply to help us customize your experience
      </Typography>
      
      <FormGroup>
        <Grid container spacing={1}>
          {goals.map(goal => (
            <Grid item xs={12} sm={6} key={goal}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={profile.goals.includes(goal)}
                    onChange={() => handleGoalToggle(goal)}
                  />
                }
                label={goal}
              />
            </Grid>
          ))}
        </Grid>
      </FormGroup>
    </Box>
  );

  const renderTutorialsStep = () => (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom>
        Learn the basics
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Choose tutorials to get started quickly
      </Typography>
      
      <Grid container spacing={2}>
        {tutorials.map(tutorial => (
          <Grid item xs={12} sm={6} key={tutorial.id}>
            <Card 
              variant="outlined" 
              sx={{ 
                cursor: 'pointer',
                border: selectedTutorials.includes(tutorial.id) ? 2 : 1,
                borderColor: selectedTutorials.includes(tutorial.id) ? 'primary.main' : 'divider'
              }}
              onClick={() => handleTutorialSelect(tutorial.id)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {getCategoryIcon(tutorial.category)}
                  <Typography variant="h6" sx={{ ml: 1, flex: 1 }}>
                    {tutorial.title}
                  </Typography>
                  {getTutorialIcon(tutorial.type)}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {tutorial.description}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip label={tutorial.duration} size="small" />
                  <Button
                    size="small"
                    startIcon={<PlayIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartTutorial(tutorial);
                    }}
                  >
                    Start
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderCompleteStep = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
      <Typography variant="h4" gutterBottom>
        You're all set! 🚀
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        Welcome to AI Content Automation. Let's create something amazing!
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Your Setup Summary:
        </Typography>
        <List sx={{ maxWidth: 400, mx: 'auto' }}>
          <ListItem>
            <ListItemIcon><PersonIcon /></ListItemIcon>
            <ListItemText primary={`${profile.name} - ${profile.role}`} />
          </ListItem>
          <ListItem>
            <ListItemIcon><BusinessIcon /></ListItemIcon>
            <ListItemText primary={`${profile.company} (${profile.industry})`} />
          </ListItem>
          <ListItem>
            <ListItemIcon><TutorialIcon /></ListItemIcon>
            <ListItemText primary={`${selectedTutorials.length} tutorials selected`} />
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>{step.label}</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {step.description}
                  </Typography>
                  
                  {index === 0 && renderWelcomeStep()}
                  {index === 1 && renderProfileStep()}
                  {index === 2 && renderGoalsStep()}
                  {index === 3 && renderTutorialsStep()}
                  {index === 4 && renderCompleteStep()}
                  
                  <Box sx={{ mb: 2, mt: 3 }}>
                    <Button
                      variant="contained"
                      onClick={index === steps.length - 1 ? handleFinishOnboarding : handleNext}
                      sx={{ mr: 1 }}
                      disabled={loading}
                    >
                      {index === steps.length - 1 ? 'Get Started' : 'Continue'}
                    </Button>
                    {index > 0 && (
                      <Button onClick={handleBack}>
                        Back
                      </Button>
                    )}
                    <Button 
                      onClick={skipOnboarding}
                      sx={{ ml: 2 }}
                      color="inherit"
                    >
                      Skip Setup
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Tutorial Dialog */}
      <Dialog open={tutorialDialogOpen} onClose={() => setTutorialDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentTutorial?.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {currentTutorial?.description}
          </Typography>
          <Box sx={{ 
            height: 300, 
            backgroundColor: 'grey.100', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: 1
          }}>
            <Typography variant="h6" color="text.secondary">
              Tutorial Content ({currentTutorial?.type})
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTutorialDialogOpen(false)}>
            Close
          </Button>
          <Button onClick={handleCompleteTutorial} variant="contained">
            Mark Complete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OnboardingWizard;