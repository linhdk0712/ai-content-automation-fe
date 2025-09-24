import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Rating,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Box,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import { useFeedback } from '../../hooks/useFeedback';

interface FeedbackSystemProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

export const FeedbackSystem: React.FC<FeedbackSystemProps> = ({
  open,
  onClose,
  feature
}) => {
  const [rating, setRating] = useState<number>(0);
  const [feedbackType, setFeedbackType] = useState<string>('general');
  const [message, setMessage] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { submitFeedback, isSubmitting } = useFeedback();
  
  const feedbackTags = [
    'Bug Report',
    'Feature Request',
    'UI/UX Issue',
    'Performance',
    'Documentation',
    'Suggestion',
    'Praise',
    'Other'
  ];
  
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  const handleSubmit = async () => {
    if (rating === 0 || !message.trim()) {
      return;
    }
    
    try {
      await submitFeedback({
        rating,
        feedbackType,
        message: message.trim(),
        tags: selectedTags,
        feature,
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      setShowSuccess(true);
      handleClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };
  
  const handleClose = () => {
    setRating(0);
    setFeedbackType('general');
    setMessage('');
    setSelectedTags([]);
    onClose();
  };
  
  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Share Your Feedback
          {feature && (
            <Typography variant="body2" color="textSecondary">
              About: {feature}
            </Typography>
          )}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <FormLabel component="legend">Overall Rating</FormLabel>
            <Rating
              value={rating}
              onChange={(_, newValue) => setRating(newValue || 0)}
              size="large"
              sx={{ mt: 1 }}
            />
          </Box>
          
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend">Feedback Type</FormLabel>
            <RadioGroup
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              row
            >
              <FormControlLabel value="general" control={<Radio />} label="General" />
              <FormControlLabel value="bug" control={<Radio />} label="Bug Report" />
              <FormControlLabel value="feature" control={<Radio />} label="Feature Request" />
              <FormControlLabel value="improvement" control={<Radio />} label="Improvement" />
            </RadioGroup>
          </FormControl>
          
          <Box sx={{ mb: 3 }}>
            <FormLabel component="legend">Tags (Optional)</FormLabel>
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {feedbackTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onClick={() => handleTagToggle(tag)}
                  color={selectedTags.includes(tag) ? 'primary' : 'default'}
                  variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your Feedback"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please share your thoughts, suggestions, or report any issues..."
            required
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={rating === 0 || !message.trim() || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success">
          Thank you for your feedback! We'll review it and get back to you.
        </Alert>
      </Snackbar>
    </>
  );
};