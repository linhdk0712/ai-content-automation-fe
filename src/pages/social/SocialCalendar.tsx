import {
  Add,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Delete,
  Edit,
  Error,
  Facebook,
  Instagram,
  LinkedIn,
  MoreVert,
  MusicNote,
  Pending,
  Refresh,
  Schedule,
  Today,
  Twitter,
  ViewDay,
  ViewModule,
  ViewWeek,
  Visibility,
  YouTube
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  ListItemIcon,
  Menu,
  MenuItem,
  MenuItem as MenuItemComponent,
  MenuList,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import moment from 'moment';
import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CalendarEvent, useSocialCalendar } from '../../hooks/useSocialCalendar';

const localizer = momentLocalizer(moment);

const SocialCalendar: React.FC = () => {
  const {
    events,
    loading,
    deleteEvent,
  } = useSocialCalendar();

  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showConflicts, setShowConflicts] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Platform configurations
  const platformConfigs = {
    facebook: { name: 'Facebook', icon: <Facebook />, color: '#1877F2' },
    twitter: { name: 'Twitter', icon: <Twitter />, color: '#1DA1F2' },
    instagram: { name: 'Instagram', icon: <Instagram />, color: '#E4405F' },
    youtube: { name: 'YouTube', icon: <YouTube />, color: '#FF0000' },
    linkedin: { name: 'LinkedIn', icon: <LinkedIn />, color: '#0A66C2' },
    tiktok: { name: 'TikTok', icon: <MusicNote />, color: '#000000' }
  };

  // Events loading would be handled by the hook automatically

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedEvent({
      id: '0',
      title: '',
      start,
      end,
      platform: 'facebook',
        status: 'scheduled',
      content: '',
    });
    setEventDialogOpen(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDetailDialogOpen(true);
  };




  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this scheduled post?')) {
      try {
        await deleteEvent(eventId.toString());
        setDetailDialogOpen(false);
        setSelectedEvent(null);
        // Events would be refreshed automatically by the hook
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  };

  const handleDuplicateEvent = async (eventId: string) => {
    try {
      // Duplicate functionality would be implemented here
      console.log('Duplicating event:', eventId);
      // Events would be refreshed automatically by the hook
    } catch (error) {
      console.error('Failed to duplicate event:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'success';
      case 'publishing': return 'primary';
      case 'scheduled': return 'info';
      case 'failed': return 'error';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle color="success" />;
      case 'publishing': return <Schedule color="primary" />;
      case 'scheduled': return <Schedule color="info" />;
      case 'failed': return <Error color="error" />;
      case 'draft': return <Pending color="warning" />;
      default: return <Pending />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#2196f3';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const eventStyleGetter = () => {
    const priorityColor = getPriorityColor('medium'); // Default priority
    return {
      style: {
        backgroundColor: priorityColor,
        borderColor: priorityColor,
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '12px'
      }
    };
  };

  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <Box sx={{ p: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
        {getStatusIcon(event.status)}
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'inherit' }}>
          {event.title}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 0.25, mb: 0.5 }}>
        {(() => {
          const config = platformConfigs[event.platform as keyof typeof platformConfigs];
          return (
            <Avatar
              sx={{ 
                width: 16, 
                height: 16, 
                bgcolor: config?.color || '#9e9e9e',
                '& .MuiAvatar-img': { width: 12, height: 12 }
              }}
            >
              {config?.icon || <MusicNote />}
            </Avatar>
          );
        })()}
      </Box>
      
      <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.8 }}>
        {moment(event.start).format('HH:mm')}
      </Typography>
    </Box>
  );

  const renderEventDialog = () => (
    <Dialog 
      open={eventDialogOpen} 
      onClose={() => setEventDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {selectedEvent?.id === '0' ? 'Schedule New Post' : 'Edit Scheduled Post'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Post Title"
              value={selectedEvent?.title || ''}
              onChange={(e) => setSelectedEvent(prev => prev ? { ...prev, title: e.target.value } : null)}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="datetime-local"
              label="Start Time"
              value={selectedEvent ? moment(selectedEvent.start).format('YYYY-MM-DDTHH:mm') : ''}
              onChange={(e) => setSelectedEvent(prev => prev ? { ...prev, start: new Date(e.target.value) } : null)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="datetime-local"
              label="End Time"
              value={selectedEvent ? moment(selectedEvent.end).format('YYYY-MM-DDTHH:mm') : ''}
              onChange={(e) => setSelectedEvent(prev => prev ? { ...prev, end: new Date(e.target.value) } : null)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Content"
              value={selectedEvent?.content || ''}
              onChange={(e) => setSelectedEvent(prev => prev ? { ...prev, content: e.target.value } : null)}
            />
          </Grid>
          
          {/* Priority removed as it's not part of CalendarEvent interface */}
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Platforms
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(platformConfigs).map(([key, config]) => (
                <Chip
                  key={key}
                  label={config.name}
                  icon={config.icon}
                  clickable
                  color={selectedEvent?.platform === key ? 'primary' : 'default'}
                  onClick={() => {
                    if (!selectedEvent) return;
                    setSelectedEvent({ ...selectedEvent, platform: key as any });
                  }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEventDialogOpen(false)}>
          Cancel
        </Button>
        <Button 
          onClick={() => {}}
          variant="contained"
          disabled={!selectedEvent?.title || !selectedEvent.platform}
        >
          Schedule Post
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderDetailDialog = () => (
    <Dialog 
      open={detailDialogOpen} 
      onClose={() => setDetailDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {selectedEvent?.title}
          </Typography>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MoreVert />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {selectedEvent && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip 
                  label={selectedEvent.status} 
                  color={getStatusColor(selectedEvent.status) as any}
                  icon={getStatusIcon(selectedEvent.status)}
                />
                <Chip 
                  label="Medium" 
                  sx={{ bgcolor: getPriorityColor('medium'), color: 'white' }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom>
                Scheduled Time
              </Typography>
              <Typography variant="body2">
                {moment(selectedEvent.start).format('MMMM Do YYYY, h:mm A')}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom>
                Duration
              </Typography>
              <Typography variant="body2">
                {moment.duration(moment(selectedEvent.end).diff(moment(selectedEvent.start))).humanize()}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Content
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedEvent.content}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Platform
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {(() => {
                  const config = platformConfigs[selectedEvent.platform as keyof typeof platformConfigs];
                  return (
                    <Tooltip title={`${config?.name || selectedEvent.platform}`}>
                      <Avatar sx={{ bgcolor: config?.color || '#9e9e9e', color: 'white' }}>
                        {config?.icon || <MusicNote />}
                      </Avatar>
                    </Tooltip>
                  );
                })()}
              </Box>
            </Grid>
            
            {/* Media files and tags sections removed as they're not part of CalendarEvent interface */}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDetailDialogOpen(false)}>
          Close
        </Button>
        <Button 
          onClick={() => {
            setDetailDialogOpen(false);
            setEventDialogOpen(true);
          }}
          variant="outlined"
        >
          Edit
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading calendar...</Typography>
      </Box>
    );
  }

  // Error handling would be implemented here if needed

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Social Media Calendar
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Plan and schedule your content across all platforms
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {/* Events would be refreshed automatically */}}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              const now = new Date();
              setSelectedEvent({
                id: '0',
                title: '',
                start: now,
                end: moment(now).add(1, 'hour').toDate(),
                platform: 'facebook',
                status: 'scheduled',
                content: ''
              });
              setEventDialogOpen(true);
            }}
          >
            Schedule Post
          </Button>
        </Box>
      </Box>

      {/* Toolbar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            {/* Navigation */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => setCurrentDate(moment(currentDate).subtract(1, currentView === 'month' ? 'month' : 'week').toDate())}>
                <ChevronLeft />
              </IconButton>
              <Button
                variant="outlined"
                onClick={() => setCurrentDate(new Date())}
                startIcon={<Today />}
              >
                Today
              </Button>
              <IconButton onClick={() => setCurrentDate(moment(currentDate).add(1, currentView === 'month' ? 'month' : 'week').toDate())}>
                <ChevronRight />
              </IconButton>
              <Typography variant="h6" sx={{ ml: 2 }}>
                {moment(currentDate).format('MMMM YYYY')}
              </Typography>
            </Box>

            {/* View Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant={currentView === 'month' ? 'contained' : 'outlined'}
                onClick={() => setCurrentView('month')}
                startIcon={<ViewModule />}
                size="small"
              >
                Month
              </Button>
              <Button
                variant={currentView === 'week' ? 'contained' : 'outlined'}
                onClick={() => setCurrentView('week')}
                startIcon={<ViewWeek />}
                size="small"
              >
                Week
              </Button>
              <Button
                variant={currentView === 'day' ? 'contained' : 'outlined'}
                onClick={() => setCurrentView('day')}
                startIcon={<ViewDay />}
                size="small"
              >
                Day
              </Button>
            </Box>

            {/* Filters */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Platform</InputLabel>
                <Select
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                  label="Platform"
                >
                  <MenuItem value="ALL">All Platforms</MenuItem>
                  {Object.entries(platformConfigs).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      {config.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="ALL">All Status</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={showConflicts}
                    onChange={(e) => setShowConflicts(e.target.checked)}
                  />
                }
                label="Show Conflicts"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent>
          <Box sx={{ height: 600 }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={currentView}
              onView={(view) => setCurrentView(view as any)}
              date={currentDate}
              onNavigate={setCurrentDate}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              eventPropGetter={eventStyleGetter}
              components={{
                event: EventComponent
              }}
              views={['month', 'week', 'day', 'agenda']}
              step={30}
              showMultiDayTimes
              popup
              popupOffset={30}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuList>
          <MenuItemComponent onClick={() => {
            setDetailDialogOpen(false);
            setEventDialogOpen(true);
            setAnchorEl(null);
          }}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            Edit Post
          </MenuItemComponent>
          
          <MenuItemComponent onClick={() => {
            if (selectedEvent) {
              handleDuplicateEvent(selectedEvent.id);
            }
            setAnchorEl(null);
          }}>
            <ListItemIcon>
              <Schedule fontSize="small" />
            </ListItemIcon>
            Duplicate
          </MenuItemComponent>
          
          <MenuItemComponent onClick={() => {/* Handle view analytics */}}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            View Analytics
          </MenuItemComponent>
          
          <Divider />
          
          <MenuItemComponent 
            onClick={() => {
              if (selectedEvent) {
                handleDeleteEvent(selectedEvent.id);
              }
              setAnchorEl(null);
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            Delete Post
          </MenuItemComponent>
        </MenuList>
      </Menu>

      {/* Dialogs */}
      {renderEventDialog()}
      {renderDetailDialog()}
    </Box>
  );
};

export default SocialCalendar;