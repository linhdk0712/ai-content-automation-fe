import { useContent } from '@/hooks/useContent';
import {
  Add,
  Analytics,
  Delete,
  Download,
  Edit,
  FileCopy,
  FilterList,
  Group,
  Lock,
  MoreVert,
  Person,
  Public,
  Refresh,
  Search,
  Share,
  Sort,
  Star,
  StarBorder,
  Upload,
  ViewList,
  ViewModule
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fab,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuItem as MenuItemComponent,
  MenuList,
  Pagination,
  Select,
  Skeleton,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useContentLibrary } from '../../hooks/useContentLibrary';

interface ContentItem {
  id: number;
  title: string;
  textContent: string;
  type: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    name: string;
    avatar?: string;
  };
  collaborators: Array<{
    id: number;
    name: string;
    avatar?: string;
  }>;
  tags: string[];
  performanceScore?: number;
  engagementRate?: number;
  isStarred: boolean;
  visibility: 'PUBLIC' | 'PRIVATE' | 'TEAM';
  scheduledAt?: string;
  publishedAt?: string;
}

const ContentLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    loading,
    deleteContent,
    duplicateContent,
    error  } = useContent();

  const {
    content,
    loadContentLibrary,
    searchContent,
    loadStats,
    loadPopularTags,
    toggleFavorite,
    // bulkDeleteLibrary,
    // bulkArchiveLibrary,
    exportLibrary
  } = useContentLibrary();

  // Use real data from content library
  const contents = content?.content || [];
  const totalCount = content?.totalElements || 0;

  // State management
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterAuthor, setFilterAuthor] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'delete' | 'archive' | null>(null);

  // Load contents on component mount and when filters change
  useEffect(() => {
    const request = {
      status: filterStatus !== 'ALL' ? [filterStatus as any] : undefined,
      contentType: filterType !== 'ALL' ? [filterType as any] : undefined,
      page: page - 1, // Convert to 0-based
      size: pageSize,
      sortBy,
      sortDirection: sortOrder.toUpperCase()
    };
    
    if (searchQuery.trim()) {
      searchContent({ ...request, query: searchQuery });
    } else {
      loadContentLibrary(request);
    }
  }, [page, pageSize, searchQuery, filterStatus, filterType, filterAuthor, sortBy, sortOrder, loadContentLibrary, searchContent]);

  // Load stats and tags on mount
  useEffect(() => {
    loadStats();
    loadPopularTags();
  }, [loadStats, loadPopularTags]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      setPage(1);
    }, 300),
    []
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(event.target.value);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case 'status':
        setFilterStatus(value);
        break;
      case 'type':
        setFilterType(value);
        break;
      case 'author':
        setFilterAuthor(value);
        break;
    }
    setPage(1);
  };

  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleSelectItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === contents.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(contents.map((content: any) => content.id));
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, content: ContentItem) => {
    setAnchorEl(event.currentTarget);
    setSelectedContent(content);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedContent(null);
  };

  const handleEdit = (content: ContentItem) => {
    navigate(`/content/edit/${content.id}`);
    handleMenuClose();
  };

  const handleDelete = async (content: ContentItem) => {
    setSelectedContent(content);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (selectedContent) {
      await deleteContent(selectedContent.id);
      setDeleteDialogOpen(false);
      setSelectedContent(null);
    }
  };

  const handleDuplicate = async (content: ContentItem) => {
    await duplicateContent(content.id, "");
    handleMenuClose();
  };

  const handleToggleStar = async (content: ContentItem) => {
    await toggleFavorite(content.id);
    handleMenuClose();
  };

  const handleBulkAction = (action: 'delete' | 'archive') => {
    setBulkAction(action);
    setBulkActionDialogOpen(true);
  };

  const confirmBulkAction = async () => {
    if (bulkAction && selectedItems.length > 0) {
      try {
        if (bulkAction === 'delete') {
          // await bulkDeleteLibrary(selectedItems);
          console.log('Bulk delete:', selectedItems);
        } else if (bulkAction === 'archive') {
          // await bulkArchiveLibrary(selectedItems);
          console.log('Bulk archive:', selectedItems);
        }
        setSelectedItems([]);
        setBulkActionDialogOpen(false);
        setBulkAction(null);
      } catch (error) {
        console.error('Bulk action failed:', error);
      }
    }
  };

  const handleExport = async () => {
    try {
      const request = {
        status: filterStatus !== 'ALL' ? [filterStatus as any] : undefined,
        contentType: filterType !== 'ALL' ? [filterType as any] : undefined,
        format: 'PDF' as const
      };
      const result = await exportLibrary(request);
      // Handle export result (e.g., download file)
      window.open(result.exportUrl, '_blank');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'success';
      case 'DRAFT': return 'warning';
      case 'SCHEDULED': return 'info';
      case 'ARCHIVED': return 'default';
      default: return 'default';
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC': return <Public fontSize="small" />;
      case 'TEAM': return <Group fontSize="small" />;
      case 'PRIVATE': return <Lock fontSize="small" />;
      default: return <Person fontSize="small" />;
    }
  };

  const renderGridView = () => (
    <Grid container spacing={3}>
      {contents.map((content: any) => (
        <Grid item xs={12} sm={6} md={4} key={content.id}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              position: 'relative',
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}
          >
            {/* Selection Checkbox */}
            <Checkbox
              checked={selectedItems.includes(content.id)}
              onChange={() => handleSelectItem(content.id)}
              sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}
            />

            {/* Star Button */}
            <IconButton
              onClick={() => handleToggleStar(content)}
              sx={{ position: 'absolute', top: 8, right: 40, zIndex: 1 }}
            >
              {content.isStarred ? <Star color="warning" /> : <StarBorder />}
            </IconButton>

            {/* Menu Button */}
            <IconButton
              onClick={(e) => handleMenuOpen(e, content)}
              sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
            >
              <MoreVert />
            </IconButton>

            <CardContent sx={{ flexGrow: 1, pt: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Chip 
                  label={content.status} 
                  color={getStatusColor(content.status) as any}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Tooltip title={`Visibility: ${content.visibility}`}>
                  {getVisibilityIcon(content.visibility)}
                </Tooltip>
              </Box>

              <Typography variant="h6" component="h2" gutterBottom noWrap>
                {content.title}
              </Typography>

              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 2,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {content.textContent}
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {content.tags.slice(0, 3).map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
                {content.tags.length > 3 && (
                  <Chip label={`+${content.tags.length - 3}`} size="small" variant="outlined" />
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar 
                  src={content.author.avatar} 
                  sx={{ width: 24, height: 24, mr: 1 }}
                >
                  {content.author.name.charAt(0)}
                </Avatar>
                <Typography variant="caption" color="text.secondary">
                  {content.author.name}
                </Typography>
              </Box>

              {content.collaborators.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Group fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box sx={{ display: 'flex', mr: 1 }}>
                    {content.collaborators.slice(0, 3).map((collaborator) => (
                      <Avatar
                        key={collaborator.id}
                        src={collaborator.avatar}
                        sx={{ width: 20, height: 20, ml: -0.5 }}
                      >
                        {collaborator.name.charAt(0)}
                      </Avatar>
                    ))}
                  </Box>
                  {content.collaborators.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{content.collaborators.length - 3}
                    </Typography>
                  )}
                </Box>
              )}

              {content.performanceScore && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Analytics fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    Score: {content.performanceScore}/100
                  </Typography>
                </Box>
              )}

              <Typography variant="caption" color="text.secondary">
                Updated {new Date(content.updatedAt).toLocaleDateString()}
              </Typography>
            </CardContent>

            <CardActions>
              <Button size="small" onClick={() => handleEdit(content)}>
                Edit
              </Button>
              <Button size="small" onClick={() => navigate(`/content/analytics/${content.id}`)}>
                Analytics
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderListView = () => (
    <Box>
      {contents.map((content: any) => (
        <Card key={content.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                <Checkbox
                  checked={selectedItems.includes(content.id)}
                  onChange={() => handleSelectItem(content.id)}
                  sx={{ mr: 2 }}
                />

                <IconButton onClick={() => handleToggleStar(content)} sx={{ mr: 1 }}>
                  {content.isStarred ? <Star color="warning" /> : <StarBorder />}
                </IconButton>

                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" component="h2" sx={{ mr: 2 }}>
                      {content.title}
                    </Typography>
                    <Chip 
                      label={content.status} 
                      color={getStatusColor(content.status) as any}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Tooltip title={`Visibility: ${content.visibility}`}>
                      {getVisibilityIcon(content.visibility)}
                    </Tooltip>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {content.textContent.substring(0, 150)}...
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        src={content.author.avatar} 
                        sx={{ width: 20, height: 20, mr: 0.5 }}
                      >
                        {content.author.name.charAt(0)}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        {content.author.name}
                      </Typography>
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      Updated {new Date(content.updatedAt).toLocaleDateString()}
                    </Typography>

                    {content.performanceScore && (
                      <Typography variant="caption" color="text.secondary">
                        Score: {content.performanceScore}/100
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button size="small" onClick={() => handleEdit(content)}>
                  Edit
                </Button>
                <Button size="small" onClick={() => navigate(`/content/analytics/${content.id}`)}>
                  Analytics
                </Button>
                <IconButton onClick={(e) => handleMenuOpen(e, content)}>
                  <MoreVert />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => window.location.reload()}>
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
            Content Library
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and organize your content collection
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => {/* Handle import */}}
          >
            Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/content/create')}
          >
            Create Content
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
            placeholder="Search content..."
            variant="outlined"
            size="small"
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
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
              onChange={(e) => handleSortChange(e.target.value)}
              label="Sort by"
            >
              <MenuItem value="updatedAt">Updated</MenuItem>
              <MenuItem value="createdAt">Created</MenuItem>
              <MenuItem value="title">Title</MenuItem>
              <MenuItem value="performanceScore">Performance</MenuItem>
            </Select>
          </FormControl>

          <IconButton onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
            <Sort sx={{ transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleBulkAction('delete')}
              >
                Delete ({selectedItems.length})
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleBulkAction('archive')}
              >
                Archive ({selectedItems.length})
              </Button>
            </Box>
          )}

          {/* View Mode Toggle */}
          <IconButton
            onClick={() => setViewMode('grid')}
            color={viewMode === 'grid' ? 'primary' : 'default'}
          >
            <ViewModule />
          </IconButton>
          <IconButton
            onClick={() => setViewMode('list')}
            color={viewMode === 'list' ? 'primary' : 'default'}
          >
            <ViewList />
          </IconButton>

          <IconButton onClick={() => window.location.reload()}>
            <Refresh />
          </IconButton>
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
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="ALL">All Status</MenuItem>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="PUBLISHED">Published</MenuItem>
                  <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                  <MenuItem value="ARCHIVED">Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  label="Type"
                >
                  <MenuItem value="ALL">All Types</MenuItem>
                  <MenuItem value="TEXT">Text</MenuItem>
                  <MenuItem value="MARKETING">Marketing</MenuItem>
                  <MenuItem value="SOCIAL_MEDIA">Social Media</MenuItem>
                  <MenuItem value="BLOG">Blog</MenuItem>
                  <MenuItem value="EMAIL">Email</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Author</InputLabel>
                <Select
                  value={filterAuthor}
                  onChange={(e) => handleFilterChange('author', e.target.value)}
                  label="Author"
                >
                  <MenuItem value="ALL">All Authors</MenuItem>
                  <MenuItem value={user?.id?.toString() || ''}>My Content</MenuItem>
                  {/* Add other authors dynamically */}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControlLabel
                  control={<Checkbox />}
                  label="Starred only"
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setFilterStatus('ALL');
                    setFilterType('ALL');
                    setFilterAuthor('ALL');
                    setSearchQuery('');
                  }}
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* Select All */}
      {contents.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedItems.length === contents.length}
                indeterminate={selectedItems.length > 0 && selectedItems.length < contents.length}
                onChange={handleSelectAll}
              />
            }
            label={`Select all (${selectedItems.length}/${contents.length})`}
          />
        </Box>
      )}

      {/* Content Grid/List */}
      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="text" width="80%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : contents.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No content found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery || filterStatus !== 'ALL' || filterType !== 'ALL' 
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first content'
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/content/create')}
          >
            Create Content
          </Button>
        </Box>
      ) : (
        <>
          {viewMode === 'grid' ? renderGridView() : renderListView()}
          
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

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/content/create')}
      >
        <Add />
      </Fab>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuList>
          <MenuItemComponent onClick={() => selectedContent && handleEdit(selectedContent)}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItemComponent>
          
          <MenuItemComponent onClick={() => selectedContent && handleDuplicate(selectedContent)}>
            <ListItemIcon>
              <FileCopy fontSize="small" />
            </ListItemIcon>
            <ListItemText>Duplicate</ListItemText>
          </MenuItemComponent>
          
          <MenuItemComponent onClick={() => selectedContent && handleToggleStar(selectedContent)}>
            <ListItemIcon>
              {selectedContent?.isStarred ? <StarBorder fontSize="small" /> : <Star fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{selectedContent?.isStarred ? 'Unstar' : 'Star'}</ListItemText>
          </MenuItemComponent>
          
          <MenuItemComponent onClick={() => {/* Handle share */}}>
            <ListItemIcon>
              <Share fontSize="small" />
            </ListItemIcon>
            <ListItemText>Share</ListItemText>
          </MenuItemComponent>
          
          <MenuItemComponent onClick={() => selectedContent && navigate(`/content/analytics/${selectedContent.id}`)}>
            <ListItemIcon>
              <Analytics fontSize="small" />
            </ListItemIcon>
            <ListItemText>Analytics</ListItemText>
          </MenuItemComponent>
          
          <Divider />
          
          <MenuItemComponent 
            onClick={() => selectedContent && handleDelete(selectedContent)}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItemComponent>
        </MenuList>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Content</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedContent?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog open={bulkActionDialogOpen} onClose={() => setBulkActionDialogOpen(false)}>
        <DialogTitle>
          {bulkAction === 'delete' ? 'Delete' : 'Archive'} Selected Content
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {bulkAction} {selectedItems.length} selected items?
            {bulkAction === 'delete' && ' This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmBulkAction} 
            color={bulkAction === 'delete' ? 'error' : 'primary'} 
            variant="contained"
          >
            {bulkAction === 'delete' ? 'Delete' : 'Archive'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default ContentLibrary;