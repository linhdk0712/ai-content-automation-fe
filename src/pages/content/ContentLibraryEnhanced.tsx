import {
  Add,
  Analytics,
  Archive,
  Delete,
  Edit,
  MoreVert,
  Refresh,
  Search,
  Star,
  StarBorder,
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
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  TextField,
  Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentLibrary } from '../../hooks/useContentLibrary';
import { ContentResponse, ContentStatus, ContentType } from '../../types/api.types';
import { useI18n } from '../../hooks/useI18n';

const ContentLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  
  const {
    content,
    stats,
    loading,
    statsLoading,
    error,
    loadContentLibrary,
    loadStats,
    loadPopularTags,
    toggleFavorite,
    bulkStar,
    bulkArchive,
    bulkDelete  } = useContentLibrary();

  // State management
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedContent, setSelectedContent] = useState<ContentResponse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'delete' | 'archive' | 'star' | null>(null);

  // Load content on mount and when filters change
  useEffect(() => {
    const request = {
      status: filterStatus !== 'ALL' ? [filterStatus as ContentStatus] : undefined,
      contentType: filterType !== 'ALL' ? [filterType as ContentType] : undefined,
      page: page - 1,
      size: pageSize,
      sortBy,
      sortDirection: sortOrder.toUpperCase()
    };
    
    if (searchQuery.trim()) {
      // Use search functionality
      loadContentLibrary({ ...request, query: searchQuery } as any);
    } else {
      loadContentLibrary(request);
    }
  }, [page, pageSize, searchQuery, filterStatus, filterType, sortBy, sortOrder, loadContentLibrary]);

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

  // const handleSelectAll = () => {
  //   if (selectedItems.length === (content?.content.length || 0)) {
  //     setSelectedItems([]);
  //   } else {
  //     setSelectedItems(content?.content.map(item => item.id) || []);
  //   }
  // };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, content: ContentResponse) => {
    setAnchorEl(event.currentTarget);
    setSelectedContent(content);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedContent(null);
  };

  const handleEdit = (content: ContentResponse) => {
    navigate(`/content/edit/${content.id}`);
    handleMenuClose();
  };

  const handleDelete = async (content: ContentResponse) => {
    setSelectedContent(content);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (selectedContent) {
      await bulkDelete([selectedContent.id]);
      setDeleteDialogOpen(false);
      setSelectedContent(null);
    }
  };

  const handleToggleStar = async (content: ContentResponse) => {
    await toggleFavorite(content.id);
    handleMenuClose();
  };

  const handleBulkAction = (action: 'delete' | 'archive' | 'star') => {
    setBulkAction(action);
    setBulkActionDialogOpen(true);
  };

  const confirmBulkAction = async () => {
    if (bulkAction && selectedItems.length > 0) {
      try {
        switch (bulkAction) {
          case 'delete':
            await bulkDelete(selectedItems);
            break;
          case 'archive':
            await bulkArchive(selectedItems);
            break;
          case 'star':
            await bulkStar(selectedItems);
            break;
        }
        setSelectedItems([]);
        setBulkActionDialogOpen(false);
        setBulkAction(null);
      } catch (error) {
        console.error('Bulk action failed:', error);
      }
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'success';
      case 'DRAFT': return 'warning';
      case 'ARCHIVED': return 'default';
      case 'SCHEDULED': return 'info';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BLOG_POST': return '📝';
      case 'SOCIAL_MEDIA_POST': return '📱';
      case 'EMAIL': return '📧';
      case 'ARTICLE': return '📄';
      case 'PRODUCT_DESCRIPTION': return '🛍️';
      case 'AD_COPY': return '📢';
      case 'PRESS_RELEASE': return '📰';
      case 'NEWSLETTER': return '📬';
      case 'LANDING_PAGE': return '🌐';
      case 'VIDEO_SCRIPT': return '🎥';
      case 'PODCAST_SCRIPT': return '🎙️';
      case 'OTHER': return '📄';
      default: return '📄';
    }
  };

  // Simple debounce function
  function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            {t('contentLibrary.title')}
          </Typography>
          {stats && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {stats.totalContent} total content • {stats.publishedCount} published • {stats.favoritesCount} favorites
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Analytics />}
            onClick={() => loadStats()}
            disabled={statsLoading}
          >
            {t('common.analytics')}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/content/create')}
          >
            {t('contentCreator.generateContent')}
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder={t('contentLibrary.searchContent')}
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>{t('contentLibrary.filterByStatus')}</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label={t('contentLibrary.filterByStatus')}
              >
                <MenuItem value="ALL">{t('contentLibrary.allContent')}</MenuItem>
                <MenuItem value="DRAFT">{t('contentLibrary.drafts')}</MenuItem>
                <MenuItem value="PUBLISHED">{t('contentLibrary.published')}</MenuItem>
                <MenuItem value="ARCHIVED">{t('contentLibrary.archived')}</MenuItem>
                <MenuItem value="SCHEDULED">Scheduled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>{t('contentLibrary.filterByType')}</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                label={t('contentLibrary.filterByType')}
              >
                <MenuItem value="ALL">All Types</MenuItem>
                <MenuItem value="BLOG_POST">Blog Post</MenuItem>
                <MenuItem value="SOCIAL_MEDIA_POST">Social Media Post</MenuItem>
                <MenuItem value="EMAIL">Email</MenuItem>
                <MenuItem value="ARTICLE">Article</MenuItem>
                <MenuItem value="PRODUCT_DESCRIPTION">Product Description</MenuItem>
                <MenuItem value="AD_COPY">Ad Copy</MenuItem>
                <MenuItem value="PRESS_RELEASE">Press Release</MenuItem>
                <MenuItem value="NEWSLETTER">Newsletter</MenuItem>
                <MenuItem value="LANDING_PAGE">Landing Page</MenuItem>
                <MenuItem value="VIDEO_SCRIPT">Video Script</MenuItem>
                <MenuItem value="PODCAST_SCRIPT">Podcast Script</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>{t('contentLibrary.sortBy')}</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                label={t('contentLibrary.sortBy')}
              >
                <MenuItem value="updatedAt">{t('contentLibrary.modifiedDate')}</MenuItem>
                <MenuItem value="createdAt">{t('contentLibrary.createdDate')}</MenuItem>
                <MenuItem value="title">{t('contentLibrary.title')}</MenuItem>
                <MenuItem value="performanceScore">Performance</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={() => setViewMode('grid')} color={viewMode === 'grid' ? 'primary' : 'default'}>
                <ViewModule />
              </IconButton>
              <IconButton onClick={() => setViewMode('list')} color={viewMode === 'list' ? 'primary' : 'default'}>
                <ViewList />
              </IconButton>
              <IconButton onClick={() => window.location.reload()}>
                <Refresh />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              {selectedItems.length} item(s) selected
            </Typography>
            <Button
              size="small"
              startIcon={<Star />}
              onClick={() => handleBulkAction('star')}
            >
              Star
            </Button>
            <Button
              size="small"
              startIcon={<Archive />}
              onClick={() => handleBulkAction('archive')}
            >
              Archive
            </Button>
            <Button
              size="small"
              startIcon={<Delete />}
              color="error"
              onClick={() => handleBulkAction('delete')}
            >
              Delete
            </Button>
          </Box>
        </Box>
      )}

      {/* Error Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Content Grid/List */}
      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: pageSize }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={`skeleton-${index}`}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <Grid container spacing={2}>
              {content?.content.map((item) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          size="small"
                        />
                        <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                          {item.title}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, item)}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Chip
                          label={item.status}
                          color={getStatusColor(item.status)}
                          size="small"
                        />
                        <Chip
                          label={item.contentType}
                          variant="outlined"
                          size="small"
                          icon={<span>{getTypeIcon(item.contentType)}</span>}
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {item.textContent?.substring(0, 100)}...
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          {item.userName?.charAt(0)}
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                          {item.userName}
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    <CardActions>
                      <Button size="small" onClick={() => handleEdit(item)}>
                        <Edit />
                      </Button>
                      <Button size="small" onClick={() => handleToggleStar(item)}>
                        <StarBorder />
                      </Button>
                      <Button size="small" onClick={() => handleDelete(item)} color="error">
                        <Delete />
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box>
              {content?.content.map((item) => (
                <Card key={item.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {item.textContent?.substring(0, 200)}...
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <Chip
                            label={item.status}
                            color={getStatusColor(item.status)}
                            size="small"
                          />
                          <Chip
                            label={item.contentType}
                            variant="outlined"
                            size="small"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {item.userName} • {new Date(item.updatedAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton onClick={() => handleEdit(item)}>
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleToggleStar(item)}>
                          <StarBorder />
                        </IconButton>
                        <IconButton onClick={(e) => handleMenuOpen(e, item)}>
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </>
      )}

      {/* Pagination */}
      {content && content.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={content.totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedContent && handleEdit(selectedContent)}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => selectedContent && handleToggleStar(selectedContent)}>
          <StarBorder sx={{ mr: 1 }} />
          Toggle Star
        </MenuItem>
        <MenuItem onClick={() => selectedContent && handleDelete(selectedContent)}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
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
          {bulkAction === 'delete' && 'Delete Selected Content'}
          {bulkAction === 'archive' && 'Archive Selected Content'}
          {bulkAction === 'star' && 'Star Selected Content'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {bulkAction} {selectedItems.length} item(s)? 
            {bulkAction === 'delete' && ' This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmBulkAction} color={bulkAction === 'delete' ? 'error' : 'primary'} variant="contained">
            {bulkAction === 'delete' && 'Delete'}
            {bulkAction === 'archive' && 'Archive'}
            {bulkAction === 'star' && 'Star'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContentLibrary;
