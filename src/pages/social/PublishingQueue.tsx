import { usePublishing } from '@/hooks/usePublishing';
import {
  Add,
  Analytics,
  CheckCircle,
  Delete,
  Description,
  Drafts,
  Edit,
  Error,
  ExpandMore,
  Facebook,
  FilterList,
  Image,
  Instagram,
  LinkedIn,
  MoreVert,
  MusicNote,
  Pending,
  PlayArrow,
  Refresh,
  Schedule,
  Send,
  Stop,
  Twitter,
  VideoFile,
  Visibility,
  YouTube
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
  Card,
  CardContent,
  Checkbox,
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
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuItem as MenuItemComponent,
  MenuList,
  Pagination,
  Select,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface ScheduledPost {
  id: number;
  contentId: number;
  title: string;
  content: string;
  platforms: Array<{
    platform: 'facebook' | 'twitter' | 'instagram' | 'youtube' | 'linkedin' | 'tiktok';
    accountId: number;
    accountName: string;
    status: 'pending' | 'processing' | 'published' | 'failed' | 'cancelled';
    scheduledAt: string;
    publishedAt?: string;
    error?: string;
    postId?: string;
    postUrl?: string;
  }>;
  mediaFiles: Array<{
    id: number;
    type: 'image' | 'video' | 'document';
    url: string;
    filename: string;
    size: number;
  }>;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdBy: {
    id: number;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  scheduledAt: string;
  publishedAt?: string;
  tags: string[];
  metadata: {
    hashtags?: string[];
    mentions?: string[];
    location?: string;
    campaignId?: string;
    estimatedReach?: number;
  };
  analytics?: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    clicks: number;
  };
}

const PublishingQueue: React.FC = () => {
  const { user } = useAuth();
  const {
    scheduledPosts,
    loading,
    error,
    totalCount,
    loadScheduledPosts,
    publishNow,
    cancelPost,
    reschedulePost,
    deletePost,
    bulkAction,
    retryFailedPost
  } = usePublishing();

  // State management
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPlatform, setFilterPlatform] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('scheduledAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [newScheduleDate, setNewScheduleDate] = useState('');
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'publish' | 'cancel' | 'delete' | null>(null);

  // Platform configurations
  const platformConfigs = {
    facebook: { name: 'Facebook', icon: <Facebook />, color: '#1877F2' },
    twitter: { name: 'Twitter', icon: <Twitter />, color: '#1DA1F2' },
    instagram: { name: 'Instagram', icon: <Instagram />, color: '#E4405F' },
    youtube: { name: 'YouTube', icon: <YouTube />, color: '#FF0000' },
    linkedin: { name: 'LinkedIn', icon: <LinkedIn />, color: '#0A66C2' },
    tiktok: { name: 'TikTok', icon: <MusicNote />, color: '#000000' }
  };

  // Load posts on mount and when filters change
  useEffect(() => {
    loadScheduledPosts({
      page,
      pageSize,
      search: searchQuery,
      status: filterStatus !== 'ALL' ? filterStatus : undefined,
      platform: filterPlatform !== 'ALL' ? filterPlatform : undefined,
      priority: filterPriority !== 'ALL' ? filterPriority : undefined,
      sortBy,
      sortOrder
    });
  }, [page, pageSize, searchQuery, filterStatus, filterPlatform, filterPriority, sortBy, sortOrder]);

  const handlePostSelection = (postId: number) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPosts.length === scheduledPosts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(scheduledPosts.map(post => post.id));
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, post: ScheduledPost) => {
    setAnchorEl(event.currentTarget);
    setSelectedPost(post);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPost(null);
  };

  const handlePublishNow = async (postId: number) => {
    try {
      await publishNow(postId);
      loadScheduledPosts({});
    } catch (error) {
      console.error('Failed to publish post:', error);
    }
  };

  const handleCancelPost = async (postId: number) => {
    if (confirm('Are you sure you want to cancel this scheduled post?')) {
      try {
        await cancelPost(postId);
        loadScheduledPosts({});
      } catch (error) {
        console.error('Failed to cancel post:', error);
      }
    }
  };

  const handleReschedulePost = async () => {
    if (selectedPost && newScheduleDate) {
      try {
        await reschedulePost(selectedPost.id, newScheduleDate);
        setRescheduleDialogOpen(false);
        setNewScheduleDate('');
        setSelectedPost(null);
        loadScheduledPosts({});
      } catch (error) {
        console.error('Failed to reschedule post:', error);
      }
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await deletePost(postId);
        loadScheduledPosts({});
      } catch (error) {
        console.error('Failed to delete post:', error);
      }
    }
  };

  const handleRetryPost = async (postId: number) => {
    try {
      await retryFailedPost(postId);
      loadScheduledPosts({});
    } catch (error) {
      console.error('Failed to retry post:', error);
    }
  };

  const handleBulkAction = (action: 'publish' | 'cancel' | 'delete') => {
    setBulkActionType(action);
    setBulkActionDialogOpen(true);
  };

  const confirmBulkAction = async () => {
    if (bulkActionType && selectedPosts.length > 0) {
      try {
        await bulkAction(bulkActionType, selectedPosts);
        setSelectedPosts([]);
        setBulkActionDialogOpen(false);
        setBulkActionType(null);
        loadScheduledPosts({});
      } catch (error) {
        console.error('Failed to perform bulk action:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'success';
      case 'publishing': return 'primary';
      case 'scheduled': return 'info';
      case 'failed': return 'error';
      case 'cancelled': return 'default';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle color="success" />;
      case 'publishing': return <Send color="primary" />;
      case 'scheduled': return <Schedule color="info" />;
      case 'failed': return <Error color="error" />;
      case 'cancelled': return <Stop color="disabled" />;
      case 'draft': return <Drafts color="warning" />;
      default: return <Pending />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffMs > 0) {
      return 'soon';
    } else {
      return 'overdue';
    }
  };

  const renderPostCard = (post: ScheduledPost) => (
    <Card key={post.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexGrow: 1 }}>
            <Checkbox
              checked={selectedPosts.includes(post.id)}
              onChange={() => handlePostSelection(post.id)}
            />

            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h6" noWrap>
                  {post.title}
                </Typography>
                <Chip 
                  label={post.status} 
                  color={getStatusColor(post.status) as any}
                  size="small"
                  icon={getStatusIcon(post.status)}
                />
                <Chip 
                  label={post.priority} 
                  color={getPriorityColor(post.priority) as any}
                  size="small"
                />
              </Box>

              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 2,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {post.content}
              </Typography>

              {/* Platforms */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {post.platforms.map((platform, index) => {
                  const config = platformConfigs[platform.platform];
                  return (
                    <Tooltip 
                      key={index}
                      title={`${config.name} - ${platform.accountName} (${platform.status})`}
                    >
                      <Badge
                        color={getStatusColor(platform.status) as any}
                        variant="dot"
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                      >
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: config.color,
                            color: 'white'
                          }}
                        >
                          {config.icon}
                        </Avatar>
                      </Badge>
                    </Tooltip>
                  );
                })}
              </Box>

              {/* Media Files */}
              {post.mediaFiles.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  {post.mediaFiles.slice(0, 3).map((file) => (
                    <Chip
                      key={file.id}
                      label={file.type}
                      size="small"
                      variant="outlined"
                      icon={
                        file.type === 'image' ? <Image /> :
                        file.type === 'video' ? <VideoFile /> :
                        <Description />
                      }
                    />
                  ))}
                  {post.mediaFiles.length > 3 && (
                    <Chip 
                      label={`+${post.mediaFiles.length - 3}`} 
                      size="small" 
                      variant="outlined" 
                    />
                  )}
                </Box>
              )}

              {/* Tags and Metadata */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {post.tags.slice(0, 3).map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
                {post.metadata.hashtags && post.metadata.hashtags.length > 0 && (
                  <Chip 
                    label={`${post.metadata.hashtags.length} hashtags`} 
                    size="small" 
                    variant="outlined"
                    color="primary"
                  />
                )}
              </Box>

              {/* Timing and Author */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Avatar 
                    src={post.createdBy.avatar} 
                    sx={{ width: 20, height: 20 }}
                  >
                    {post.createdBy.name.charAt(0)}
                  </Avatar>
                  <Typography variant="caption" color="text.secondary">
                    {post.createdBy.name}
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Scheduled: {new Date(post.scheduledAt).toLocaleString()}
                </Typography>

                <Typography variant="caption" color="primary">
                  {formatDateTime(post.scheduledAt)}
                </Typography>
              </Box>

              {/* Analytics (if published) */}
              {post.analytics && (
                <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={3}>
                      <Typography variant="caption" color="text.secondary">Views</Typography>
                      <Typography variant="body2">{post.analytics.views}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="caption" color="text.secondary">Likes</Typography>
                      <Typography variant="body2">{post.analytics.likes}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="caption" color="text.secondary">Shares</Typography>
                      <Typography variant="body2">{post.analytics.shares}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="caption" color="text.secondary">Comments</Typography>
                      <Typography variant="body2">{post.analytics.comments}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <IconButton onClick={(e) => handleMenuOpen(e, post)}>
              <MoreVert />
            </IconButton>

            {post.status === 'scheduled' && (
              <Tooltip title="Publish Now">
                <IconButton 
                  onClick={() => handlePublishNow(post.id)}
                  color="primary"
                >
                  <PlayArrow />
                </IconButton>
              </Tooltip>
            )}

            {post.status === 'failed' && (
              <Tooltip title="Retry">
                <IconButton 
                  onClick={() => handleRetryPost(post.id)}
                  color="warning"
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Platform Status Details */}
        {post.platforms.some(p => p.status === 'failed' || p.error) && (
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle2" color="error">
                Platform Issues ({post.platforms.filter(p => p.status === 'failed').length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {post.platforms.filter(p => p.status === 'failed' || p.error).map((platform, index) => (
                  <ListItem key={index}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: platformConfigs[platform.platform].color, width: 24, height: 24 }}>
                        {platformConfigs[platform.platform].icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${platformConfigs[platform.platform].name} - ${platform.accountName}`}
                      secondary={platform.error || 'Failed to publish'}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading publishing queue...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => loadScheduledPosts({})}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Publishing Queue
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your scheduled and published content across all platforms
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => loadScheduledPosts({})}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {/* Navigate to create post */}}
          >
            Schedule Post
          </Button>
        </Box>
      </Box>

      {/* Toolbar */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {/* Search */}
          <TextField
            placeholder="Search posts..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 250 }}
          />

          {/* Filters Toggle */}
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>

          {/* Sort */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort by"
            >
              <MenuItem value="scheduledAt">Schedule Time</MenuItem>
              <MenuItem value="createdAt">Created</MenuItem>
              <MenuItem value="priority">Priority</MenuItem>
              <MenuItem value="status">Status</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Bulk Actions */}
          {selectedPosts.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => handleBulkAction('publish')}
              >
                Publish ({selectedPosts.length})
              </Button>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => handleBulkAction('cancel')}
              >
                Cancel ({selectedPosts.length})
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleBulkAction('delete')}
              >
                Delete ({selectedPosts.length})
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Filters Panel */}
      {showFilters && (
        <Card sx={{ mb: 3, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="ALL">All Status</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="publishing">Publishing</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
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
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="ALL">All Priorities</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Button
                variant="outlined"
                onClick={() => {
                  setFilterStatus('ALL');
                  setFilterPlatform('ALL');
                  setFilterPriority('ALL');
                  setSearchQuery('');
                }}
                fullWidth
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* Select All */}
      {scheduledPosts.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedPosts.length === scheduledPosts.length}
                indeterminate={selectedPosts.length > 0 && selectedPosts.length < scheduledPosts.length}
                onChange={handleSelectAll}
              />
            }
            label={`Select all (${selectedPosts.length}/${scheduledPosts.length})`}
          />
        </Box>
      )}

      {/* Posts List */}
      {scheduledPosts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No scheduled posts found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery || filterStatus !== 'ALL' || filterPlatform !== 'ALL' 
              ? 'Try adjusting your search or filters'
              : 'Schedule your first post to get started'
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {/* Navigate to create post */}}
          >
            Schedule Post
          </Button>
        </Box>
      ) : (
        <>
          {scheduledPosts.map(renderPostCard)}
          
          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={Math.ceil(totalCount / pageSize)}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        </>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuList>
          <MenuItemComponent onClick={() => {/* Handle view details */}}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            View Details
          </MenuItemComponent>
          
          <MenuItemComponent onClick={() => {/* Handle edit */}}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            Edit Post
          </MenuItemComponent>
          
          {selectedPost?.status === 'scheduled' && (
            <>
              <MenuItemComponent onClick={() => selectedPost && handlePublishNow(selectedPost.id)}>
                <ListItemIcon>
                  <PlayArrow fontSize="small" />
                </ListItemIcon>
                Publish Now
              </MenuItemComponent>
              
              <MenuItemComponent onClick={() => {
                setRescheduleDialogOpen(true);
                handleMenuClose();
              }}>
                <ListItemIcon>
                  <Schedule fontSize="small" />
                </ListItemIcon>
                Reschedule
              </MenuItemComponent>
            </>
          )}
          
          {selectedPost?.status === 'failed' && (
            <MenuItemComponent onClick={() => selectedPost && handleRetryPost(selectedPost.id)}>
              <ListItemIcon>
                <Refresh fontSize="small" />
              </ListItemIcon>
              Retry
            </MenuItemComponent>
          )}
          
          <MenuItemComponent onClick={() => {/* Handle analytics */}}>
            <ListItemIcon>
              <Analytics fontSize="small" />
            </ListItemIcon>
            View Analytics
          </MenuItemComponent>
          
          <Divider />
          
          <MenuItemComponent 
            onClick={() => {
              if (selectedPost) {
                handleCancelPost(selectedPost.id);
              }
              handleMenuClose();
            }}
            sx={{ color: 'warning.main' }}
          >
            <ListItemIcon>
              <Stop fontSize="small" color="warning" />
            </ListItemIcon>
            Cancel Post
          </MenuItemComponent>
          
          <MenuItemComponent 
            onClick={() => {
              if (selectedPost) {
                handleDeletePost(selectedPost.id);
              }
              handleMenuClose();
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

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onClose={() => setRescheduleDialogOpen(false)}>
        <DialogTitle>Reschedule Post</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="datetime-local"
            label="New Schedule Time"
            value={newScheduleDate}
            onChange={(e) => setNewScheduleDate(e.target.value)}
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRescheduleDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleReschedulePost} 
            variant="contained"
            disabled={!newScheduleDate}
          >
            Reschedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog open={bulkActionDialogOpen} onClose={() => setBulkActionDialogOpen(false)}>
        <DialogTitle>
          Confirm Bulk Action
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {bulkActionType} {selectedPosts.length} selected posts?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmBulkAction} 
            variant="contained"
            color={bulkActionType === 'delete' ? 'error' : 'primary'}
          >
            Confirm {bulkActionType}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PublishingQueue;