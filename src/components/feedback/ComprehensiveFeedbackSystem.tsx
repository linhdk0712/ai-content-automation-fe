import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Rating,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Slide,
  Alert,
  Snackbar,
  Grid,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Slider,
  IconButton,
  Tooltip} from '@mui/material';
import {
  Feedback,
  Close,
  Send,
  ThumbUp,
  ThumbDown,
  Star,
  BugReport,
  Lightbulb,
  QuestionAnswer,
  Analytics,
  SentimentVeryDissatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  SentimentSatisfied,
  SentimentVerySatisfied
} from '@mui/icons-material';

interface FeedbackData {
  type: 'bug' | 'feature' | 'general' | 'satisfaction';
  rating?: number;
  category?: string;
  title?: string;
  description: string;
  email?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  metadata?: Record<string, any>;
}

interface SatisfactionSurvey {
  id: string;
  title: string;
  questions: SurveyQuestion[];
  trigger: 'time_based' | 'action_based' | 'manual';
  frequency: 'once' | 'weekly' | 'monthly';
}

interface SurveyQuestion {
  id: string;
  type: 'rating' | 'text' | 'multiple_choice' | 'nps' | 'emoji';
  question: string;
  required: boolean;
  options?: string[];
  scale?: { min: number; max: number; labels?: string[] };
}

interface FeedbackAnalytics {
  totalFeedback: number;
  averageRating: number;
  sentimentScore: number;
  categoryBreakdown: Record<string, number>;
  trendData: Array<{ date: string; rating: number; count: number }>;
  npsScore: number;
  responseRate: number;
}

const ComprehensiveFeedbackSystem: React.FC = () => {
  const [showFeedbackWidget, setShowFeedbackWidget] = useState(false);
  const [showSurveyDialog, setShowSurveyDialog] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general' | 'satisfaction'>('general');
  const [feedbackData, setFeedbackData] = useState<FeedbackData>({
    type: 'general',
    description: ''
  });
  const [currentSurvey, setCurrentSurvey] = useState<SatisfactionSurvey | null>(null);
  const [surveyResponses, setSurveyResponses] = useState<Record<string, any>>({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Sample satisfaction survey
  const satisfactionSurvey: SatisfactionSurvey = {
    id: 'satisfaction_2024',
    title: 'How are we doing?',
    trigger: 'time_based',
    frequency: 'monthly',
    questions: [
      {
        id: 'overall_satisfaction',
        type: 'rating',
        question: 'How satisfied are you with our AI Content Automation platform?',
        required: true,
        scale: { min: 1, max: 5 }
      },
      {
        id: 'nps_score',
        type: 'nps',
        question: 'How likely are you to recommend our platform to a colleague?',
        required: true,
        scale: { min: 0, max: 10 }
      },
      {
        id: 'feature_satisfaction',
        type: 'multiple_choice',
        question: 'Which features do you find most valuable?',
        required: false,
        options: [
          'AI Content Generation',
          'Multi-platform Publishing',
          'Analytics Dashboard',
          'Template Library',
          'Team Collaboration',
          'Scheduling Tools'
        ]
      },
      {
        id: 'improvement_areas',
        type: 'text',
        question: 'What could we improve to better serve your needs?',
        required: false
      },
      {
        id: 'mood_rating',
        type: 'emoji',
        question: 'How do you feel about using our platform?',
        required: false
      }
    ]
  };

  useEffect(() => {
    // Check if user should see satisfaction survey
    checkSurveyTriggers();
    
    // Load feedback analytics
    loadFeedbackAnalytics();
  }, []);

  const checkSurveyTriggers = () => {
    // Check various triggers for showing satisfaction surveys
    const lastSurveyDate = localStorage.getItem('lastSurveyDate');
    const userActions = parseInt(localStorage.getItem('userActions') || '0');
    
    // Show survey if it's been 30 days or user has performed 50+ actions
    if (!lastSurveyDate || 
        Date.now() - new Date(lastSurveyDate).getTime() > 30 * 24 * 60 * 60 * 1000 ||
        userActions > 50) {
      setTimeout(() => {
        setCurrentSurvey(satisfactionSurvey);
        setShowSurveyDialog(true);
      }, 5000); // Show after 5 seconds
    }
  };

  const loadFeedbackAnalytics = async () => {
    try {
      const response = await fetch('/api/v1/feedback/analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load feedback analytics:', error);
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      const response = await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...feedbackData,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });

      if (response.ok) {
        setShowSuccessMessage(true);
        setShowFeedbackWidget(false);
        resetFeedbackForm();
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleSubmitSurvey = async () => {
    try {
      const response = await fetch('/api/v1/feedback/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: currentSurvey?.id,
          responses: surveyResponses,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        localStorage.setItem('lastSurveyDate', new Date().toISOString());
        setShowSurveyDialog(false);
        setShowSuccessMessage(true);
        setSurveyResponses({});
      }
    } catch (error) {
      console.error('Failed to submit survey:', error);
    }
  };

  const resetFeedbackForm = () => {
    setFeedbackData({
      type: 'general',
      description: ''
    });
  };

  const renderFeedbackWidget = () => (
    <Dialog
      open={showFeedbackWidget}
      onClose={() => setShowFeedbackWidget(false)}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'up' } as any}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Share Your Feedback</Typography>
          <IconButton onClick={() => setShowFeedbackWidget(false)}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            What type of feedback would you like to share?
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[
              { type: 'bug', label: 'Bug Report', icon: <BugReport />, color: 'error' },
              { type: 'feature', label: 'Feature Request', icon: <Lightbulb />, color: 'primary' },
              { type: 'general', label: 'General Feedback', icon: <QuestionAnswer />, color: 'info' },
              { type: 'satisfaction', label: 'Rate Experience', icon: <Star />, color: 'warning' }
            ].map((option) => (
              <Chip
                key={option.type}
                icon={option.icon}
                label={option.label}
                clickable
                color={feedbackType === option.type ? option.color as any : 'default'}
                onClick={() => setFeedbackType(option.type as any)}
              />
            ))}
          </Box>
        </Box>

        {feedbackType === 'satisfaction' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              How would you rate your experience?
            </Typography>
            <Rating
              size="large"
              value={feedbackData.rating || 0}
              onChange={(_, value) => setFeedbackData(prev => ({ ...prev, rating: value || 0 }))}
            />
          </Box>
        )}

        <TextField
          fullWidth
          multiline
          rows={4}
          label={
            feedbackType === 'bug' ? 'Describe the bug you encountered' :
            feedbackType === 'feature' ? 'Describe the feature you\'d like to see' :
            feedbackType === 'satisfaction' ? 'Tell us more about your experience' :
            'Share your thoughts with us'
          }
          value={feedbackData.description}
          onChange={(e) => setFeedbackData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Your feedback helps us improve..."
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Email (optional)"
          type="email"
          value={feedbackData.email || ''}
          onChange={(e) => setFeedbackData(prev => ({ ...prev, email: e.target.value }))}
          helperText="We'll only use this to follow up on your feedback"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowFeedbackWidget(false)}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={handleSubmitFeedback}
          disabled={!feedbackData.description.trim()}
        >
          Send Feedback
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderSurveyDialog = () => (
    <Dialog
      open={showSurveyDialog}
      onClose={() => setShowSurveyDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">{currentSurvey?.title}</Typography>
          <IconButton onClick={() => setShowSurveyDialog(false)}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph>
          Your feedback helps us improve our platform. This survey takes about 2 minutes to complete.
        </Typography>

        {currentSurvey?.questions.map((question, index) => (
          <Box key={question.id} sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom>
              {index + 1}. {question.question}
              {question.required && <span style={{ color: 'red' }}> *</span>}
            </Typography>

            {question.type === 'rating' && (
              <Rating
                size="large"
                value={surveyResponses[question.id] || 0}
                onChange={(_, value) => setSurveyResponses(prev => ({
                  ...prev,
                  [question.id]: value
                }))}
              />
            )}

            {question.type === 'nps' && (
              <Box>
                <Slider
                  value={surveyResponses[question.id] || 0}
                  onChange={(_, value) => setSurveyResponses(prev => ({
                    ...prev,
                    [question.id]: value
                  }))}
                  min={0}
                  max={10}
                  marks
                  valueLabelDisplay="on"
                  sx={{ mt: 2, mb: 1 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">Not likely</Typography>
                  <Typography variant="caption">Very likely</Typography>
                </Box>
              </Box>
            )}

            {question.type === 'multiple_choice' && (
              <FormGroup>
                {question.options?.map((option) => (
                  <FormControlLabel
                    key={option}
                    control={
                      <Checkbox
                        checked={surveyResponses[question.id]?.includes(option) || false}
                        onChange={(e) => {
                          const current = surveyResponses[question.id] || [];
                          const updated = e.target.checked
                            ? [...current, option]
                            : current.filter((item: string) => item !== option);
                          setSurveyResponses(prev => ({
                            ...prev,
                            [question.id]: updated
                          }));
                        }}
                      />
                    }
                    label={option}
                  />
                ))}
              </FormGroup>
            )}

            {question.type === 'text' && (
              <TextField
                fullWidth
                multiline
                rows={3}
                value={surveyResponses[question.id] || ''}
                onChange={(e) => setSurveyResponses(prev => ({
                  ...prev,
                  [question.id]: e.target.value
                }))}
                placeholder="Your answer..."
              />
            )}

            {question.type === 'emoji' && (
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
                {[
                  { value: 1, icon: <SentimentVeryDissatisfied />, label: 'Very Unhappy' },
                  { value: 2, icon: <SentimentDissatisfied />, label: 'Unhappy' },
                  { value: 3, icon: <SentimentNeutral />, label: 'Neutral' },
                  { value: 4, icon: <SentimentSatisfied />, label: 'Happy' },
                  { value: 5, icon: <SentimentVerySatisfied />, label: 'Very Happy' }
                ].map((emoji) => (
                  <Tooltip key={emoji.value} title={emoji.label}>
                    <IconButton
                      size="large"
                      color={surveyResponses[question.id] === emoji.value ? 'primary' : 'default'}
                      onClick={() => setSurveyResponses(prev => ({
                        ...prev,
                        [question.id]: emoji.value
                      }))}
                    >
                      {emoji.icon}
                    </IconButton>
                  </Tooltip>
                ))}
              </Box>
            )}
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowSurveyDialog(false)}>
          Skip
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmitSurvey}
        >
          Submit Survey
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderAnalyticsDashboard = () => (
    <Dialog
      open={showAnalytics}
      onClose={() => setShowAnalytics(false)}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        Feedback Analytics Dashboard
      </DialogTitle>
      <DialogContent>
        {analytics && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography color="text.secondary" gutterBottom>
                    Total Feedback
                  </Typography>
                  <Typography variant="h4">
                    {analytics.totalFeedback}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography color="text.secondary" gutterBottom>
                    Average Rating
                  </Typography>
                  <Typography variant="h4">
                    {analytics.averageRating.toFixed(1)}
                  </Typography>
                  <Rating value={analytics.averageRating} readOnly />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography color="text.secondary" gutterBottom>
                    NPS Score
                  </Typography>
                  <Typography variant="h4" color={analytics.npsScore > 50 ? 'success.main' : 'warning.main'}>
                    {analytics.npsScore}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography color="text.secondary" gutterBottom>
                    Response Rate
                  </Typography>
                  <Typography variant="h4">
                    {analytics.responseRate.toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowAnalytics(false)}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      {/* Floating Feedback Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000
        }}
        onClick={() => setShowFeedbackWidget(true)}
      >
        <Feedback />
      </Fab>

      {/* Quick Feedback Buttons */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 90,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 999
        }}
      >
        <Tooltip title="Quick thumbs up">
          <IconButton
            size="small"
            sx={{ bgcolor: 'success.main', color: 'white', '&:hover': { bgcolor: 'success.dark' } }}
            onClick={() => {
              // Quick positive feedback
              fetch('/api/v1/feedback/quick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'positive', url: window.location.href })
              });
              setShowSuccessMessage(true);
            }}
          >
            <ThumbUp fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Quick thumbs down">
          <IconButton
            size="small"
            sx={{ bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
            onClick={() => setShowFeedbackWidget(true)}
          >
            <ThumbDown fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Analytics Button (Admin only) */}
      <Tooltip title="View feedback analytics">
        <IconButton
          sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            bgcolor: 'background.paper',
            boxShadow: 2
          }}
          onClick={() => setShowAnalytics(true)}
        >
          <Analytics />
        </IconButton>
      </Tooltip>

      {/* Dialogs */}
      {renderFeedbackWidget()}
      {renderSurveyDialog()}
      {renderAnalyticsDashboard()}

      {/* Success Message */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={4000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setShowSuccessMessage(false)}
          severity="success"
          variant="filled"
        >
          Thank you for your feedback! We appreciate your input.
        </Alert>
      </Snackbar>
    </>
  );
};

export default ComprehensiveFeedbackSystem;