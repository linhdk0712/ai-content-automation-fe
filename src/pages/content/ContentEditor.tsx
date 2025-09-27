import { useAuth } from '@/hooks/useAuth';
import { useContent } from '@/hooks/useContent';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ContentStatus } from '@/types/api.types';
import {
  AutoAwesome,
  Code,
  Comment,
  ExpandMore,
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  FormatUnderlined,
  Group,
  Image,
  Link,
  Publish,
  Save,
  Schedule
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface ContentVersion {
  id: number;
  versionNumber: number;
  textContent: string;
  changeDescription: string;
  changeType: 'CREATED' | 'UPDATED' | 'ROLLBACK';
  createdBy: {
    id: number;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  isCurrent: boolean;
}

interface Comment {
  id: number;
  content: string;
  author: {
    id: number;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  resolved: boolean;
  position?: {
    start: number;
    end: number;
  };
}

interface Collaborator {
  id: number;
  name: string;
  avatar?: string;
  isOnline: boolean;
  cursor?: {
    position: number;
    color: string;
  };
}

const ContentEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    content,
    loading,
    error,
    loadContent
  } = useContent();

  // WebSocket for real-time collaboration
  const { send, subscribe, unsubscribe, isConnected } = useWebSocket();

  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.DRAFT);
  const [visibility, setVisibility] = useState<'PRIVATE' | 'TEAM' | 'PUBLIC'>('PRIVATE');
  const [scheduledDate, setScheduledDate] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Version history
  const [versions] = useState<ContentVersion[]>([]);
 
  
  // Comments
  const [comments] = useState<Comment[]>([]);
  
  const [newComment, setNewComment] = useState('');
  const [selectedText, setSelectedText] = useState<{start: number, end: number} | null>(null);
  
  // Collaboration
  const [collaborators] = useState<Collaborator[]>([]);
  
  const [inviteEmail, setInviteEmail] = useState('');
  
  // UI state
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'warning' | 'info'}>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  // Load content on mount
  useEffect(() => {
    if (id) {
      loadContent(parseInt(id));
      loadVersionHistory();
      loadComments();
      joinCollaborationSession();
    }
  }, [id]);

  // Set content data when loaded
  useEffect(() => {
    if (content) {
      setTitle(content.title || '');
      setTextContent(content.textContent || '');
      setTags(content.tags || []);
      setStatus(content.status || ContentStatus.DRAFT);
      setVisibility('PRIVATE');
      setScheduledDate(content.scheduledPublishTime || '');
    }
  }, [content]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveEnabled && hasUnsavedChanges && !isSaving) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [title, textContent, tags, hasUnsavedChanges, autoSaveEnabled, isSaving]);

  // Real-time collaboration setup
  useEffect(() => {
    if (id) {
      // Subscribe to channels - handlers will be set up via WebSocket service
      subscribe('content-updated', (data) => console.log('Content updated:', data));
      subscribe('collaborator-joined', (data) => console.log('Collaborator joined:', data));
      subscribe('collaborator-left', (data) => console.log('Collaborator left:', data));
      subscribe('cursor-moved', (data) => console.log('Cursor moved:', data));
      subscribe('comment-added', (data) => console.log('Comment added:', data));

      return () => {
        unsubscribe('content-updated');
        unsubscribe('collaborator-joined');
        unsubscribe('collaborator-left');
        unsubscribe('cursor-moved');
        unsubscribe('comment-added');
      };
    }
  }, [id]);

  const loadVersionHistory = async () => {
    // Version history loading would be implemented here
  };

  const loadComments = async () => {
    // Load comments for this content
    // This would be implemented in the useContent hook
  };

  const joinCollaborationSession = () => {
    if (id) {
      send({
        type: 'join_collaboration',
        data: {
          contentId: id,
          userId: user?.id,
          userName: user?.username
        }
      });
    }
  };

  const handleContentChange = (field: string, value: any) => {
    setHasUnsavedChanges(true);
    
    switch (field) {
      case 'title':
        setTitle(value);
        break;
      case 'textContent':
        setTextContent(value);
        // Emit cursor position for real-time collaboration
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          send({
            type: 'cursor_moved',
            data: {
              contentId: id,
              position: range.startOffset,
              userId: user?.id
            }
          });
        }
        break;
      case 'tags':
        setTags(value);
        break;
    }
  };

  const handleAutoSave = async () => {
    // Auto-save functionality would be implemented here
    setHasUnsavedChanges(false);
    setLastSaved(new Date());
  };

  const handleManualSave = async () => {
    // Manual save functionality would be implemented here
    setHasUnsavedChanges(false);
    setLastSaved(new Date());
  };

  const handlePublish = async () => {
    // Publish functionality would be implemented here
    setStatus(ContentStatus.PUBLISHED);
    setPublishDialogOpen(false);
  };

  const handleSchedule = async () => {
    // Schedule functionality would be implemented here
    setStatus(ContentStatus.SCHEDULED);
    setScheduleDialogOpen(false);
  };

  const handleVersionRollback = async () => {
    // Version rollback functionality would be implemented here
    setHasUnsavedChanges(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    // Add comment functionality would be implemented here
    setNewComment('');
    setSelectedText(null);
  };

  const handleResolveComment = async () => {
    // Resolve comment functionality would be implemented here
  };

  const handleInviteCollaborator = async () => {
    if (!inviteEmail.trim()) return;
    
    // Invite collaborator functionality would be implemented here
    setInviteEmail('');
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      handleContentChange('tags', updatedTags);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    handleContentChange('tags', updatedTags);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const start = range.startOffset;
      const end = range.endOffset;
      
      if (start !== end) {
        setSelectedText({ start, end });
      }
    }
  };

  // Real-time collaboration handlers





  const renderEditor = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Editor Toolbar */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        p: 1, 
        borderBottom: 1, 
        borderColor: 'divider',
        flexWrap: 'wrap'
      }}>
        <Tooltip title="Bold">
          <IconButton size="small">
            <FormatBold />
          </IconButton>
        </Tooltip>
        <Tooltip title="Italic">
          <IconButton size="small">
            <FormatItalic />
          </IconButton>
        </Tooltip>
        <Tooltip title="Underline">
          <IconButton size="small">
            <FormatUnderlined />
          </IconButton>
        </Tooltip>
        
        <Divider orientation="vertical" flexItem />
        
        <Tooltip title="Bullet List">
          <IconButton size="small">
            <FormatListBulleted />
          </IconButton>
        </Tooltip>
        <Tooltip title="Numbered List">
          <IconButton size="small">
            <FormatListNumbered />
          </IconButton>
        </Tooltip>
        
        <Divider orientation="vertical" flexItem />
        
        <Tooltip title="Insert Link">
          <IconButton size="small">
            <Link />
          </IconButton>
        </Tooltip>
        <Tooltip title="Insert Image">
          <IconButton size="small">
            <Image />
          </IconButton>
        </Tooltip>
        <Tooltip title="Code Block">
          <IconButton size="small">
            <Code />
          </IconButton>
        </Tooltip>
        
        <Divider orientation="vertical" flexItem />
        
        <Tooltip title="AI Assist">
          <IconButton size="small" color="primary">
            <AutoAwesome />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Title Input */}
      <TextField
        fullWidth
        variant="standard"
        placeholder="Enter title..."
        value={title}
        onChange={(e) => handleContentChange('title', e.target.value)}
        sx={{ 
          p: 2,
          '& .MuiInput-root': {
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }
        }}
        InputProps={{
          disableUnderline: true
        }}
      />

      {/* Content Editor */}
      <TextField
        ref={editorRef}
        fullWidth
        multiline
        variant="standard"
        placeholder="Start writing your content..."
        value={textContent}
        onChange={(e) => handleContentChange('textContent', e.target.value)}
        onSelect={handleTextSelection}
        sx={{ 
          flexGrow: 1,
          p: 2,
          '& .MuiInput-root': {
            height: '100%',
            alignItems: 'flex-start'
          },
          '& textarea': {
            height: '100% !important',
            overflow: 'auto !important'
          }
        }}
        InputProps={{
          disableUnderline: true
        }}
      />

      {/* Word Count and Status */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: 1, 
        borderTop: 1, 
        borderColor: 'divider',
        bgcolor: 'grey.50'
      }}>
        <Typography variant="caption" color="text.secondary">
          {textContent.length} characters • {textContent.split(/\s+/).filter(word => word.length > 0).length} words
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isSaving && <LinearProgress sx={{ width: 100 }} />}
          {lastSaved && (
            <Typography variant="caption" color="text.secondary">
              Last saved: {lastSaved.toLocaleTimeString()}
            </Typography>
          )}
          {hasUnsavedChanges && (
            <Chip label="Unsaved changes" size="small" color="warning" />
          )}
        </Box>
      </Box>
    </Box>
  );

  const renderPreview = () => (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        {title || 'Untitled'}
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        {tags.map((tag) => (
          <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
        ))}
      </Box>
      
      <Typography 
        variant="body1" 
        sx={{ 
          whiteSpace: 'pre-wrap',
          lineHeight: 1.7
        }}
      >
        {textContent || 'No content yet...'}
      </Typography>
    </Box>
  );

  const renderVersionHistory = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Version History
      </Typography>
      
      <List>
        {versions.map((version) => (
          <ListItem key={version.id} divider>
            <ListItemAvatar>
              <Avatar src={version.createdBy.avatar}>
                {version.createdBy.name.charAt(0)}
              </Avatar>
            </ListItemAvatar>
            
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2">
                    Version {version.versionNumber}
                  </Typography>
                  {version.isCurrent && (
                    <Chip label="Current" size="small" color="primary" />
                  )}
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {version.changeDescription}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {version.createdBy.name} • {new Date(version.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              }
            />
            
            {!version.isCurrent && (
              <Button
                size="small"
                onClick={() => handleVersionRollback()}
              >
                Restore
              </Button>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const renderComments = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Comments
      </Typography>
      
      {/* Add Comment */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          sx={{ mb: 1 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {selectedText ? `Selected text: ${textContent.substring(selectedText.start, selectedText.end)}` : 'General comment'}
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={handleAddComment}
            disabled={!newComment.trim()}
          >
            Add Comment
          </Button>
        </Box>
      </Box>
      
      {/* Comments List */}
      <List>
        {comments.map((comment) => (
          <ListItem key={comment.id} divider>
            <ListItemAvatar>
              <Avatar src={comment.author.avatar}>
                {comment.author.name.charAt(0)}
              </Avatar>
            </ListItemAvatar>
            
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2">
                    {comment.author.name}
                  </Typography>
                  {comment.resolved && (
                    <Chip label="Resolved" size="small" color="success" />
                  )}
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {comment.content}
                  </Typography>
                  {comment.position && (
                    <Typography variant="caption" color="primary" sx={{ mb: 1, display: 'block' }}>
                      "{textContent.substring(comment.position.start, comment.position.end)}"
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {new Date(comment.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              }
            />
            
            {!comment.resolved && (
              <Button
                size="small"
                onClick={() => handleResolveComment()}
              >
                Resolve
              </Button>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const renderCollaborators = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Collaborators
      </Typography>
      
      {/* Invite Collaborator */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Enter email to invite..."
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          sx={{ mb: 1 }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleInviteCollaborator}
          disabled={!inviteEmail.trim()}
        >
          Send Invitation
        </Button>
      </Box>
      
      {/* Active Collaborators */}
      <List>
        {collaborators.map((collaborator) => (
          <ListItem key={collaborator.id}>
            <ListItemAvatar>
              <Badge
                color={collaborator.isOnline ? 'success' : 'default'}
                variant="dot"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              >
                <Avatar src={collaborator.avatar}>
                  {collaborator.name.charAt(0)}
                </Avatar>
              </Badge>
            </ListItemAvatar>
            
            <ListItemText
              primary={collaborator.name}
              secondary={collaborator.isOnline ? 'Online' : 'Offline'}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading content...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => navigate('/content')}>
          Back to Content Library
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">
            {title || 'Untitled Content'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={status} 
              color={status === ContentStatus.PUBLISHED ? 'success' : status === ContentStatus.SCHEDULED ? 'info' : 'default'}
              size="small"
            />
            
            {isConnected && (
              <Tooltip title="Real-time collaboration active">
                <Badge color="success" variant="dot">
                  <Group fontSize="small" />
                </Badge>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoSaveEnabled}
                onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                size="small"
              />
            }
            label="Auto-save"
          />
          
          <Button
            variant="outlined"
            startIcon={<Save />}
            onClick={handleManualSave}
            disabled={isSaving || !hasUnsavedChanges}
          >
            Save
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Schedule />}
            onClick={() => setScheduleDialogOpen(true)}
          >
            Schedule
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Publish />}
            onClick={() => setPublishDialogOpen(true)}
            disabled={status === ContentStatus.PUBLISHED}
          >
            Publish
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex' }}>
        {/* Left Panel - Editor */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Edit" />
            <Tab label="Preview" />
          </Tabs>
          
          <Box sx={{ flexGrow: 1 }}>
            {activeTab === 0 ? renderEditor() : renderPreview()}
          </Box>
        </Box>

        {/* Right Panel - Sidebar */}
        <Box sx={{ 
          width: 350, 
          borderLeft: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Settings */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Visibility</InputLabel>
                  <Select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as any)}
                    label="Visibility"
                  >
                    <MenuItem value="PRIVATE">Private</MenuItem>
                    <MenuItem value="TEAM">Team</MenuItem>
                    <MenuItem value="PUBLIC">Public</MenuItem>
                  </Select>
                </FormControl>

                {/* Tags */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        onDelete={() => handleRemoveTag(tag)}
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button size="small" onClick={handleAddTag}>
                      Add
                    </Button>
                  </Box>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Version History */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">
                Version History ({versions.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              {renderVersionHistory()}
            </AccordionDetails>
          </Accordion>

          {/* Comments */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">
                Comments ({comments.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              {renderComments()}
            </AccordionDetails>
          </Accordion>

          {/* Collaborators */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">
                Collaborators ({collaborators.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              {renderCollaborators()}
            </AccordionDetails>
          </Accordion>
        </Box>
      </Box>

      {/* Publish Dialog */}
      <Dialog open={publishDialogOpen} onClose={() => setPublishDialogOpen(false)}>
        <DialogTitle>Publish Content</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to publish this content? It will be visible to users based on your visibility settings.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePublish} variant="contained">
            Publish
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)}>
        <DialogTitle>Schedule Content</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="datetime-local"
            label="Schedule Date & Time"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSchedule} 
            variant="contained"
            disabled={!scheduledDate}
          >
            Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContentEditor;