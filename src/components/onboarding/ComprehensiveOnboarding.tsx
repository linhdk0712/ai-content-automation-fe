import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  IconButton} from '@mui/material';
import {
  PersonAdd,
  Settings,
  Link as LinkIcon,
  Create,
  CheckCircle,
  PlayArrow,
  Lightbulb,
  Help,
  Close,
  ArrowForward,
  ArrowBack,
  Celebration
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  isOptional?: boolean;
  estimatedTime?: string;
}

interface UserProfile {
  name: string;
  company: string;
  role: string;
  industry: string;
  goals: string[];
  experience: string;
}

interface AIPreferences {
  preferredProvider: string;
  contentTypes: string[];
  tone: string;
  targetAudience: string;
}

interface SocialConnections {
  facebook: boolean;
  instagram: boolean;
  twitter: boolean;
  linkedin: boolean;
  tiktok: boolean;
  youtube: boolean;
}

const ComprehensiveOnboarding: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    company: '',
    role: '',
    industry: '',
    goals: [],
    experience: ''
  });
  const [aiPreferences, setAIPreferences] = useState<AIPreferences>({
    preferredProvider: '',
    contentTypes: [],
    tone: '',
    targetAudience: ''
  });
  const [socialConnections, setSocialConnections] = useState<SocialConnections>({
    facebook: false,
    instagram: false,
    twitter: false,
    linkedin: false,
    tiktok: false,
    youtube: false
  });
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [sampleContent, setSampleContent] = useState<string>('');

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Marketing',
    'E-commerce', 'Real Estate', 'Food & Beverage', 'Travel', 'Other'
  ];

  const contentGoals = [
    'Increase brand awareness',
    'Generate leads',
    'Drive website traffic',
    'Boost engagement',
    'Build community',
    'Educate audience',
    'Promote products/services',
    'Establish thought leadership'
  ];

  const contentTypes = [
    'Blog posts', 'Social media posts', 'Email newsletters',
    'Product descriptions', 'Video scripts', 'Ad copy',
    'Press releases', 'Case studies'
  ];

  const tutorialSteps = [
    {
      title: 'Welcome to AI Content Creation!',
      content: 'Let\'s create your first piece of content together. This tutorial will guide you through the entire process.',
      target: '.content-creator-container'
    },
    {
      title: 'Choose Your AI Provider',
      content: 'Select an AI provider based on your needs. GPT-4 offers the highest quality, while GPT-3.5 is more cost-effective.',
      target: '.ai-provider-selector'
    },
    {
      title: 'Enter Your Prompt',
      content: 'Describe what content you want to create. Be specific about your topic, audience, and desired outcome.',
      target: '.prompt-input'
    },
    {
      title: 'Customize Settings',
      content: 'Adjust the tone, length, and industry to match your brand voice and requirements.',
      target: '.content-settings'
    },
    {
      title: 'Generate Content',
      content: 'Click generate to create your content. The AI will process your request and create engaging content.',
      target: '.generate-button'
    },
    {
      title: 'Review and Edit',
      content: 'Review the generated content and make any necessary edits. You can regenerate if needed.',
      target: '.content-preview'
    }
  ];

  const ProfileSetupStep: React.FC = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tell us about yourself
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            This helps us personalize your experience and provide better content suggestions.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={userProfile.name}
              onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your full name"
            />
            
            <TextField
              fullWidth
              label="Company"
              value={userProfile.company}
              onChange={(e) => setUserProfile(prev => ({ ...prev, company: e.target.value }))}
              placeholder="Your company or organization"
            />
            
            <TextField
              fullWidth
              label="Role/Title"
              value={userProfile.role}
              onChange={(e) => setUserProfile(prev => ({ ...prev, role: e.target.value }))}
              placeholder="e.g., Marketing Manager, Content Creator"
            />
            
            <FormControl fullWidth>
              <InputLabel>Industry</InputLabel>
              <Select
                value={userProfile.industry}
                onChange={(e) => setUserProfile(prev => ({ ...prev, industry: e.target.value }))}
              >
                {industries.map((industry) => (
                  <MenuItem key={industry} value={industry}>
                    {industry}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                What are your main content goals? (Select all that apply)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {contentGoals.map((goal) => (
                  <Chip
                    key={goal}
                    label={goal}
                    clickable
                    color={userProfile.goals.includes(goal) ? 'primary' : 'default'}
                    onClick={() => {
                      setUserProfile(prev => ({
                        ...prev,
                        goals: prev.goals.includes(goal)
                          ? prev.goals.filter(g => g !== goal)
                          : [...prev.goals, goal]
                      }));
                    }}
                  />
                ))}
              </Box>
            </Box>
            
            <FormControl fullWidth>
              <InputLabel>Content Creation Experience</InputLabel>
              <Select
                value={userProfile.experience}
                onChange={(e) => setUserProfile(prev => ({ ...prev, experience: e.target.value }))}
              >
                <MenuItem value="beginner">Beginner - New to content creation</MenuItem>
                <MenuItem value="intermediate">Intermediate - Some experience</MenuItem>
                <MenuItem value="advanced">Advanced - Experienced creator</MenuItem>
                <MenuItem value="expert">Expert - Professional content creator</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );

  const AIPreferencesStep: React.FC = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            AI Preferences Setup
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Configure your AI settings to match your content style and requirements.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Preferred AI Provider</InputLabel>
              <Select
                value={aiPreferences.preferredProvider}
                onChange={(e) => setAIPreferences(prev => ({ ...prev, preferredProvider: e.target.value }))}
              >
                <MenuItem value="GPT4">
                  <Box>
                    <Typography variant="body2">GPT-4</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Highest quality, best for complex content ($0.06/1K tokens)
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="GPT35">
                  <Box>
                    <Typography variant="body2">GPT-3.5</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Good quality, cost-effective ($0.002/1K tokens)
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="GEMINI_PRO">
                  <Box>
                    <Typography variant="body2">Gemini Pro</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Great for creative content ($0.01/1K tokens)
                    </Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Content Types You'll Create
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {contentTypes.map((type) => (
                  <Chip
                    key={type}
                    label={type}
                    clickable
                    color={aiPreferences.contentTypes.includes(type) ? 'primary' : 'default'}
                    onClick={() => {
                      setAIPreferences(prev => ({
                        ...prev,
                        contentTypes: prev.contentTypes.includes(type)
                          ? prev.contentTypes.filter(t => t !== type)
                          : [...prev.contentTypes, type]
                      }));
                    }}
                  />
                ))}
              </Box>
            </Box>
            
            <FormControl fullWidth>
              <InputLabel>Default Tone</InputLabel>
              <Select
                value={aiPreferences.tone}
                onChange={(e) => setAIPreferences(prev => ({ ...prev, tone: e.target.value }))}
              >
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="casual">Casual & Friendly</MenuItem>
                <MenuItem value="authoritative">Authoritative</MenuItem>
                <MenuItem value="creative">Creative & Playful</MenuItem>
                <MenuItem value="educational">Educational</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Primary Target Audience</InputLabel>
              <Select
                value={aiPreferences.targetAudience}
                onChange={(e) => setAIPreferences(prev => ({ ...prev, targetAudience: e.target.value }))}
              >
                <MenuItem value="general">General Public</MenuItem>
                <MenuItem value="business">Business Professionals</MenuItem>
                <MenuItem value="consumers">Consumers</MenuItem>
                <MenuItem value="students">Students & Educators</MenuItem>
                <MenuItem value="technical">Technical Audience</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );

  const SocialConnectionsStep: React.FC = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Connect Your Social Media Accounts
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Connect your social media accounts to enable automatic publishing. You can skip this step and connect later.
          </Typography>
          
          <List>
            {Object.entries(socialConnections).map(([platform, connected]) => (
              <ListItem key={platform}>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: connected ? 'success.main' : 'grey.300' }}>
                    {platform.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={platform.charAt(0).toUpperCase() + platform.slice(1)}
                  secondary={connected ? 'Connected' : 'Not connected'}
                />
                <Button
                  variant={connected ? 'outlined' : 'contained'}
                  color={connected ? 'error' : 'primary'}
                  onClick={() => {
                    setSocialConnections(prev => ({
                      ...prev,
                      [platform]: !connected
                    }));
                  }}
                >
                  {connected ? 'Disconnect' : 'Connect'}
                </Button>
              </ListItem>
            ))}
          </List>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Pro Tip:</strong> Connecting your accounts now will allow you to publish content directly 
              from the platform. You can always connect more accounts later in your settings.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </motion.div>
  );

  const FirstContentStep: React.FC = () => {
    const handleGenerateContent = async () => {
      setIsGeneratingContent(true);
      
      // Simulate content generation
      setTimeout(() => {
        setSampleContent(`
# ${userProfile.industry} Trends for 2024

As we move into 2024, the ${userProfile.industry.toLowerCase()} industry is experiencing unprecedented changes. Here are the key trends that ${userProfile.role.toLowerCase()}s should watch:

## 1. Digital Transformation Acceleration
The shift towards digital-first approaches continues to reshape how businesses operate...

## 2. Sustainability Focus
Environmental consciousness is becoming a core business driver...

## 3. AI Integration
Artificial intelligence is no longer a future concept but a present reality...

*This content was generated using your preferences: ${aiPreferences.tone} tone for ${aiPreferences.targetAudience} audience.*
        `);
        setIsGeneratingContent(false);
      }, 3000);
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Create Your First Content
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Let's create your first piece of content using your preferences. This will help you understand how the AI works.
            </Typography>
            
            {!sampleContent && !isGeneratingContent && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Create />}
                  onClick={handleGenerateContent}
                  sx={{ mb: 2 }}
                >
                  Generate Sample Content
                </Button>
                <Typography variant="body2" color="text.secondary">
                  We'll create a sample blog post about {userProfile.industry} trends
                </Typography>
              </Box>
            )}
            
            {isGeneratingContent && (
              <Box sx={{ py: 4 }}>
                <Typography variant="body2" gutterBottom align="center">
                  Generating your content...
                </Typography>
                <LinearProgress sx={{ mb: 2 }} />
                <Typography variant="caption" display="block" align="center" color="text.secondary">
                  Using {aiPreferences.preferredProvider} with {aiPreferences.tone} tone
                </Typography>
              </Box>
            )}
            
            {sampleContent && (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Great! Your content has been generated. This is just a sample - you can edit, regenerate, or create new content anytime.
                  </Typography>
                </Alert>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                      {sampleContent}
                    </Typography>
                  </CardContent>
                </Card>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button variant="outlined" startIcon={<PlayArrow />}>
                    Start Tutorial
                  </Button>
                  <Button variant="contained" onClick={() => setShowTutorial(true)}>
                    Learn More Features
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const steps: OnboardingStep[] = [
    {
      id: 'profile',
      title: 'Profile Setup',
      description: 'Tell us about yourself and your content goals',
      icon: <PersonAdd />,
      component: <ProfileSetupStep />,
      estimatedTime: '2 min'
    },
    {
      id: 'ai-preferences',
      title: 'AI Preferences',
      description: 'Configure your AI settings and content preferences',
      icon: <Settings />,
      component: <AIPreferencesStep />,
      estimatedTime: '3 min'
    },
    {
      id: 'social-connections',
      title: 'Social Media',
      description: 'Connect your social media accounts for publishing',
      icon: <LinkIcon />,
      component: <SocialConnectionsStep />,
      isOptional: true,
      estimatedTime: '5 min'
    },
    {
      id: 'first-content',
      title: 'First Content',
      description: 'Create your first piece of content with AI',
      icon: <Create />,
      component: <FirstContentStep />,
      estimatedTime: '2 min'
    }
  ];

  const handleNext = () => {
    setCompletedSteps(prev => new Set([...prev, activeStep]));
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSkip = () => {
    setActiveStep(prev => prev + 1);
  };

  const isStepComplete = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0:
        return !!userProfile.name && !!userProfile.industry && userProfile.goals.length > 0;
      case 1:
        return !!aiPreferences.preferredProvider && !!aiPreferences.tone && !!aiPreferences.targetAudience;
      case 2:
        return true; // Optional step
      case 3:
        return sampleContent !== '';
      default:
        return false;
    }
  };

  const completionPercentage = (completedSteps.size / steps.length) * 100;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Welcome to AI Content Automation! 🎉
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Let's get you set up in just a few minutes. We'll personalize your experience and show you how to create amazing content with AI.
        </Typography>
        
        {/* Progress indicator */}
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Setup Progress</Typography>
            <Typography variant="body2">{Math.round(completionPercentage)}% Complete</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={completionPercentage} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.id}>
            <StepLabel
              optional={
                step.isOptional ? (
                  <Typography variant="caption">Optional</Typography>
                ) : null
              }
              StepIconComponent={({ active, completed }) => (
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: completed ? 'success.main' : active ? 'primary.main' : 'grey.300',
                    color: 'white'
                  }}
                >
                  {completed ? <CheckCircle /> : step.icon}
                </Box>
              )}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6">{step.title}</Typography>
                {step.estimatedTime && (
                  <Chip size="small" label={step.estimatedTime} variant="outlined" />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {step.description}
              </Typography>
            </StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                {step.component}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  disabled={index === 0}
                  onClick={handleBack}
                  startIcon={<ArrowBack />}
                >
                  Back
                </Button>
                {step.isOptional && (
                  <Button onClick={handleSkip}>
                    Skip
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isStepComplete(index)}
                  endIcon={<ArrowForward />}
                >
                  {index === steps.length - 1 ? 'Complete Setup' : 'Continue'}
                </Button>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Completion */}
      {activeStep === steps.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card elevation={3} sx={{ textAlign: 'center', p: 4, mt: 3 }}>
            <Celebration sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Setup Complete! 🎉
            </Typography>
            <Typography variant="body1" paragraph>
              You're all set! Your AI Content Automation platform is ready to help you create amazing content.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Create />}
                onClick={() => window.location.href = '/dashboard'}
              >
                Start Creating Content
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Help />}
                onClick={() => setShowTutorial(true)}
              >
                Take a Tour
              </Button>
            </Box>
          </Card>
        </motion.div>
      )}

      {/* Interactive Tutorial Dialog */}
      <Dialog
        open={showTutorial}
        onClose={() => setShowTutorial(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Interactive Tutorial</Typography>
            <IconButton onClick={() => setShowTutorial(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Lightbulb sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Ready to learn the platform?
            </Typography>
            <Typography variant="body2" paragraph>
              Our interactive tutorial will guide you through creating, editing, and publishing your first piece of content.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This will take about 5 minutes and you can skip any step.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTutorial(false)}>
            Maybe Later
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowTutorial(false);
              // Start interactive tutorial
              window.location.href = '/content/create?tutorial=true';
            }}
          >
            Start Tutorial
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComprehensiveOnboarding;