import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Alert,
  Divider,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Add,
  Preview,
  Repeat,
  Schedule,
} from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { useRecurringPosts } from '../../hooks/useScheduling';
import { RecurringPattern, ScheduledPost } from '../../types/scheduling';
import moment from 'moment';

interface RecurringPostManagerProps {
  open: boolean;
  onClose: () => void;
}

interface RecurringPostForm {
  title: string;
  content: string;
  platforms: string[];
  startDate: Date;
  startTime: Date;
  pattern: RecurringPattern;
}

const RecurringPostManager: React.FC<RecurringPostManagerProps> = ({
  open,
  onClose,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<RecurringPostForm>({
    title: '',
    content: '',
    platforms: [],
    startDate: new Date(),
    startTime: new Date(),
    pattern: {
      type: 'weekly',
      interval: 1,
      daysOfWeek: [1], // Monday
    },
  });
  const [previewDates, setPreviewDates] = useState<Date[]>([]);

  const { createRecurringPost, isCreating } = useRecurringPosts();

  const availablePlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'];
  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  const generatePreviewDates = (pattern: RecurringPattern, startDate: Date, startTime: Date) => {
    const dates: Date[] = [];
    const baseDateTime = new Date(startDate);
    baseDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

    let currentDate = new Date(baseDateTime);
    const maxDates = 10; // Show next 10 occurrences
    const maxDate = pattern.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

    for (let i = 0; i < maxDates && currentDate <= maxDate; i++) {
      if (pattern.maxOccurrences && i >= pattern.maxOccurrences) break;

      // Check if this date is an exception
      const isException = pattern.exceptions?.some(exception =>
        moment(exception).isSame(currentDate, 'day')
      );

      if (!isException) {
        dates.push(new Date(currentDate));
      }

      // Calculate next occurrence
      switch (pattern.type) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + pattern.interval);
          break;
        case 'weekly':
          if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
            // Find next day of week
            let nextDay = currentDate.getDay();
            let daysToAdd = 1;
            
            while (daysToAdd <= 7) {
              nextDay = (nextDay + 1) % 7;
              if (pattern.daysOfWeek.includes(nextDay)) {
                currentDate.setDate(currentDate.getDate() + daysToAdd);
                break;
              }
              daysToAdd++;
            }
            
            if (daysToAdd > 7) {
              // If no valid day found in current week, move to next week
              currentDate.setDate(currentDate.getDate() + 7 * pattern.interval);
              currentDate.setDate(currentDate.getDate() - currentDate.getDay() + pattern.daysOfWeek[0]);
            }
          } else {
            currentDate.setDate(currentDate.getDate() + 7 * pattern.interval);
          }
          break;
        case 'monthly':
          if (pattern.dayOfMonth) {
            currentDate.setMonth(currentDate.getMonth() + pattern.interval);
            currentDate.setDate(pattern.dayOfMonth);
          } else {
            currentDate.setMonth(currentDate.getMonth() + pattern.interval);
          }
          break;
        default:
          // Custom pattern - for now, just add interval days
          currentDate.setDate(currentDate.getDate() + pattern.interval);
      }
    }

    return dates;
  };

  const handlePatternChange = (updates: Partial<RecurringPattern>) => {
    const newPattern = { ...formData.pattern, ...updates };
    setFormData(prev => ({ ...prev, pattern: newPattern }));
    
    // Update preview
    const preview = generatePreviewDates(newPattern, formData.startDate, formData.startTime);
    setPreviewDates(preview);
  };

  const handleCreateRecurring = () => {
    const scheduledTime = new Date(formData.startDate);
    scheduledTime.setHours(formData.startTime.getHours(), formData.startTime.getMinutes(), 0, 0);

    const post: Partial<ScheduledPost> = {
      title: formData.title,
      content: formData.content,
      platforms: formData.platforms,
      scheduledTime,
      status: 'scheduled',
      userId: 'current-user', // This should come from auth context
    };

    createRecurringPost({ post, pattern: formData.pattern });
    setShowCreateForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      platforms: [],
      startDate: new Date(),
      startTime: new Date(),
      pattern: {
        type: 'weekly',
        interval: 1,
        daysOfWeek: [1],
      },
    });
    setPreviewDates([]);
  };

  const renderPatternConfig = () => (
    <Stack spacing={3}>
      <FormControl fullWidth>
        <InputLabel>Pattern Type</InputLabel>
        <Select
          value={formData.pattern.type}
          onChange={(e) => handlePatternChange({ type: e.target.value as RecurringPattern['type'] })}
          title="Pattern Type"
        >
          <MenuItem value="daily">Daily</MenuItem>
          <MenuItem value="weekly">Weekly</MenuItem>
          <MenuItem value="monthly">Monthly</MenuItem>
          <MenuItem value="custom">Custom</MenuItem>
        </Select>
      </FormControl>

      <TextField
        label="Repeat Every"
        type="number"
        value={formData.pattern.interval}
        onChange={(e) => handlePatternChange({ interval: parseInt(e.target.value) || 1 })}
        InputProps={{
          endAdornment: (
            <Typography variant="body2" color="text.secondary">
              {formData.pattern.type === 'daily' ? 'day(s)' :
               formData.pattern.type === 'weekly' ? 'week(s)' :
               formData.pattern.type === 'monthly' ? 'month(s)' : 'day(s)'}
            </Typography>
          ),
        }}
        fullWidth
      />

      {formData.pattern.type === 'weekly' && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Days of Week
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {daysOfWeek.map(day => (
              <FormControlLabel
                key={day.value}
                control={
                  <Checkbox
                    checked={formData.pattern.daysOfWeek?.includes(day.value) || false}
                    onChange={(e) => {
                      const currentDays = formData.pattern.daysOfWeek || [];
                      const newDays = e.target.checked
                        ? [...currentDays, day.value]
                        : currentDays.filter(d => d !== day.value);
                      handlePatternChange({ daysOfWeek: newDays });
                    }}
                  />
                }
                label={day.label}
              />
            ))}
          </Stack>
        </Box>
      )}

      {formData.pattern.type === 'monthly' && (
        <TextField
          label="Day of Month"
          type="number"
          value={formData.pattern.dayOfMonth || ''}
          onChange={(e) => handlePatternChange({ dayOfMonth: parseInt(e.target.value) || undefined })}
          inputProps={{ min: 1, max: 31 }}
          fullWidth
          helperText="Leave empty to use the same day as start date"
        />
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <DatePicker
            label="End Date (Optional)"
            value={formData.pattern.endDate || null}
            onChange={(date) => handlePatternChange({ endDate: date || undefined })}
            slotProps={{
              textField: { fullWidth: true }
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Max Occurrences (Optional)"
            type="number"
            value={formData.pattern.maxOccurrences || ''}
            onChange={(e) => handlePatternChange({ maxOccurrences: parseInt(e.target.value) || undefined })}
            fullWidth
            inputProps={{ min: 1 }}
          />
        </Grid>
      </Grid>
    </Stack>
  );

  const renderPreview = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Box display="flex" alignItems="center" gap={1}>
            <Preview />
            Preview Schedule
          </Box>
        </Typography>
        
        {previewDates.length > 0 ? (
          <List dense>
            {previewDates.map((date, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={moment(date).format('dddd, MMMM Do YYYY')}
                  secondary={moment(date).format('h:mm A')}
                />
              </ListItem>
            ))}
            {previewDates.length >= 10 && (
              <ListItem>
                <ListItemText
                  primary="..."
                  secondary="And more occurrences"
                />
              </ListItem>
            )}
          </List>
        ) : (
          <Typography color="text.secondary">
            Configure the pattern to see preview dates
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const renderCreateForm = () => (
    <Stack spacing={3}>
      <TextField
        label="Post Title"
        value={formData.title}
        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        fullWidth
        required
      />

      <TextField
        label="Content"
        value={formData.content}
        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
        multiline
        rows={4}
        fullWidth
        required
      />

      <FormControl fullWidth>
        <InputLabel>Platforms</InputLabel>
        <Select
          multiple
          value={formData.platforms}
          onChange={(e) => setFormData(prev => ({ ...prev, platforms: e.target.value as string[] }))}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} size="small" />
              ))}
            </Box>
          )}
          title="Platforms"
        >
          {availablePlatforms.map((platform) => (
            <MenuItem key={platform} value={platform}>
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <DatePicker
            label="Start Date"
            value={formData.startDate}
            onChange={(date) => {
              if (date) {
                setFormData(prev => ({ ...prev, startDate: date }));
                const preview = generatePreviewDates(formData.pattern, date, formData.startTime);
                setPreviewDates(preview);
              }
            }}
            slotProps={{
              textField: { fullWidth: true }
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TimePicker
            label="Start Time"
            value={formData.startTime}
            onChange={(time) => {
              if (time) {
                setFormData(prev => ({ ...prev, startTime: time }));
                const preview = generatePreviewDates(formData.pattern, formData.startDate, time);
                setPreviewDates(preview);
              }
            }}
            slotProps={{
              textField: { fullWidth: true }
            }}
          />
        </Grid>
      </Grid>

      <Divider />

      <Typography variant="h6">
        <Box display="flex" alignItems="center" gap={1}>
          <Repeat />
          Recurring Pattern
        </Box>
      </Typography>

      {renderPatternConfig()}

      <Divider />

      {renderPreview()}
    </Stack>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Schedule />
          Recurring Post Manager
        </Box>
      </DialogTitle>
      <DialogContent>
        {!showCreateForm ? (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Recurring Posts</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowCreateForm(true)}
              >
                Create Recurring Post
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              Recurring posts help you maintain consistent content publishing. 
              Set up patterns to automatically schedule posts at regular intervals.
            </Alert>

            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No recurring posts configured yet. Create your first recurring post to get started.
            </Typography>
          </Box>
        ) : (
          renderCreateForm()
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={showCreateForm ? () => setShowCreateForm(false) : onClose}>
          {showCreateForm ? 'Back' : 'Close'}
        </Button>
        {showCreateForm && (
          <Button
            onClick={handleCreateRecurring}
            variant="contained"
            disabled={
              isCreating ||
              !formData.title ||
              !formData.content ||
              formData.platforms.length === 0
            }
          >
            {isCreating ? 'Creating...' : 'Create Recurring Post'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RecurringPostManager;