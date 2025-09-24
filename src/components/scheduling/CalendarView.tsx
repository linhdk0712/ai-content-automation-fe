import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Alert,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Delete,
  ContentCopy,
} from '@mui/icons-material';
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import moment from 'moment';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ScheduledPost, CalendarEvent } from '../../types/scheduling';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface CalendarViewProps {
  scheduledPosts: ScheduledPost[];
  onCreatePost: (post: Partial<ScheduledPost>) => void;
  onUpdatePost: (id: string, data: Partial<ScheduledPost>) => void;
  onDeletePost: (id: string) => void;
}

interface PostDialogData {
  id?: string;
  title: string;
  content: string;
  scheduledTime: Date;
  platforms: string[];
}

const CalendarView: React.FC<CalendarViewProps> = ({
  scheduledPosts,
  onCreatePost,
  onUpdatePost,
  onDeletePost,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [postDialogData, setPostDialogData] = useState<PostDialogData>({
    title: '',
    content: '',
    scheduledTime: new Date(),
    platforms: [],
  });

  const availablePlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'];

  // Convert scheduled posts to calendar events
  const calendarEvents = useMemo((): CalendarEvent[] => {
    return scheduledPosts.map(post => ({
      id: post.id,
      title: post.title,
      start: new Date(post.scheduledTime),
      end: new Date(new Date(post.scheduledTime).getTime() + 30 * 60 * 1000), // 30 minutes duration
      resource: post,
      color: getEventColor(post.status),
    }));
  }, [scheduledPosts]);

  function getEventColor(status: string): string {
    switch (status) {
      case 'scheduled': return '#1976d2';
      case 'published': return '#2e7d32';
      case 'failed': return '#d32f2f';
      case 'cancelled': return '#757575';
      default: return '#1976d2';
    }
  }

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setPostDialogData({
      title: '',
      content: '',
      scheduledTime: start,
      platforms: [],
    });
    setShowPostDialog(true);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    if (event.resource) {
      setPostDialogData({
        id: event.resource.id,
        title: event.resource.title,
        content: event.resource.content,
        scheduledTime: new Date(event.resource.scheduledTime),
        platforms: event.resource.platforms,
      });
      setShowPostDialog(true);
    }
  }, []);

  const handleEventDrop = useCallback(({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
    if (event.resource) {
      onUpdatePost(event.resource.id, {
        scheduledTime: start,
      });
    }
  }, [onUpdatePost]);

  const handleEventResize = useCallback(({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
    // For scheduling, we don't really need resize functionality, but we can update the time
    if (event.resource) {
      onUpdatePost(event.resource.id, {
        scheduledTime: start,
      });
    }
  }, [onUpdatePost]);

  const handleSavePost = () => {
    if (postDialogData.id) {
      // Update existing post
      onUpdatePost(postDialogData.id, {
        title: postDialogData.title,
        content: postDialogData.content,
        scheduledTime: postDialogData.scheduledTime,
        platforms: postDialogData.platforms,
      });
    } else {
      // Create new post
      onCreatePost({
        title: postDialogData.title,
        content: postDialogData.content,
        scheduledTime: postDialogData.scheduledTime,
        platforms: postDialogData.platforms,
        status: 'scheduled',
        userId: 'current-user', // This should come from auth context
      });
    }
    setShowPostDialog(false);
    setSelectedEvent(null);
  };

  const handleDeletePost = () => {
    if (postDialogData.id) {
      onDeletePost(postDialogData.id);
      setShowPostDialog(false);
      setSelectedEvent(null);
    }
  };

  const handleDuplicatePost = () => {
    const newTime = new Date(postDialogData.scheduledTime);
    newTime.setDate(newTime.getDate() + 1); // Schedule for next day

    onCreatePost({
      title: `${postDialogData.title} (Copy)`,
      content: postDialogData.content,
      scheduledTime: newTime,
      platforms: postDialogData.platforms,
      status: 'scheduled',
      userId: 'current-user',
    });
    setShowPostDialog(false);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  const CustomEvent = ({ event }: { event: CalendarEvent }) => (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
        {event.title}
      </Typography>
      {event.resource && (
        <Box>
          <Typography variant="caption" display="block">
            {event.resource.platforms.join(', ')}
          </Typography>
          <Chip
            label={event.resource.status}
            size="small"
            sx={{ height: 16, fontSize: '0.6rem' }}
          />
        </Box>
      )}
    </Box>
  );

  const DnDCalendar = withDragAndDrop<CalendarEvent, object>(Calendar as any);

  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ height: '600px', width: '100%' }}>
        {/* Calendar Controls */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={() => setCurrentDate(moment(currentDate).subtract(1, currentView === Views.MONTH ? 'month' : 'week').toDate())}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
              {moment(currentDate).format(currentView === Views.MONTH ? 'MMMM YYYY' : 'MMM DD, YYYY')}
            </Typography>
            <IconButton onClick={() => setCurrentDate(moment(currentDate).add(1, currentView === Views.MONTH ? 'month' : 'week').toDate())}>
              <ChevronRight />
            </IconButton>
            <Button
              startIcon={<Today />}
              onClick={() => setCurrentDate(new Date())}
              variant="outlined"
              size="small"
            >
              Today
            </Button>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              variant={currentView === Views.MONTH ? 'contained' : 'outlined'}
              onClick={() => setCurrentView(Views.MONTH)}
              size="small"
            >
              Month
            </Button>
            <Button
              variant={currentView === Views.WEEK ? 'contained' : 'outlined'}
              onClick={() => setCurrentView(Views.WEEK)}
              size="small"
            >
              Week
            </Button>
            <Button
              variant={currentView === Views.DAY ? 'contained' : 'outlined'}
              onClick={() => setCurrentView(Views.DAY)}
              size="small"
            >
              Day
            </Button>
          </Stack>
        </Box>

        {/* Calendar */}
        <Paper sx={{ height: '500px', p: 1 }}>
          <DnDCalendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            view={currentView}
            onView={setCurrentView}
            date={currentDate}
            onNavigate={setCurrentDate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onEventDrop={handleEventDrop as any}
            onEventResize={handleEventResize as any}
            selectable
            resizable
            eventPropGetter={eventStyleGetter}
            components={{
              event: CustomEvent,
            }}
            step={30}
            timeslots={2}
            min={new Date(2024, 0, 1, 6, 0)} // 6 AM
            max={new Date(2024, 0, 1, 23, 59)} // 11:59 PM
          />
        </Paper>

        {/* Post Dialog */}
        <Dialog
          open={showPostDialog}
          onClose={() => setShowPostDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {postDialogData.id ? 'Edit Scheduled Post' : 'Create Scheduled Post'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="Title"
                value={postDialogData.title}
                onChange={(e) => setPostDialogData(prev => ({ ...prev, title: e.target.value }))}
                fullWidth
                required
              />

              <TextField
                label="Content"
                value={postDialogData.content}
                onChange={(e) => setPostDialogData(prev => ({ ...prev, content: e.target.value }))}
                multiline
                rows={4}
                fullWidth
                required
              />

              <TextField
                label="Scheduled Time"
                type="datetime-local"
                value={moment(postDialogData.scheduledTime).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => setPostDialogData(prev => ({ 
                  ...prev, 
                  scheduledTime: new Date(e.target.value) 
                }))}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />

              <FormControl fullWidth>
                <InputLabel>Platforms</InputLabel>
                title="Platforms"
                <Select
                  multiple
                  value={postDialogData.platforms}
                  onChange={(e) => setPostDialogData(prev => ({ 
                    ...prev, 
                    platforms: e.target.value as string[] 
                  }))}
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

              {selectedEvent?.resource && (
                <Alert severity="info">
                  Status: {selectedEvent.resource.status} | 
                  Created: {moment(selectedEvent.resource.createdAt).format('MMM DD, YYYY HH:mm')}
                </Alert>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPostDialog(false)}>
              Cancel
            </Button>
            {postDialogData.id && (
              <>
                <Button
                  onClick={handleDuplicatePost}
                  startIcon={<ContentCopy />}
                  color="secondary"
                >
                  Duplicate
                </Button>
                <Button
                  onClick={handleDeletePost}
                  startIcon={<Delete />}
                  color="error"
                >
                  Delete
                </Button>
              </>
            )}
            <Button
              onClick={handleSavePost}
              variant="contained"
              disabled={!postDialogData.title || !postDialogData.content || postDialogData.platforms.length === 0}
            >
              {postDialogData.id ? 'Update' : 'Schedule'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DndProvider>
  );
};

export default CalendarView;