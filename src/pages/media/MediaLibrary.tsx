import {
  Add,
  AudioFile,
  CloudUpload,
  Delete,
  Description,
  Download,
  Edit,
  FilterList,
  Folder,
  Image,
  MoreVert,
  Refresh,
  Search,
  Share,
  Star,
  StarBorder,
  VideoFile,
  ViewList,
  ViewModule,
  Visibility
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
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
  LinearProgress,
  ListItemIcon,
  Menu,
  MenuItem,
  MenuItem as MenuItemComponent,
  MenuList,
  Pagination,
  Select,
  Skeleton,
  TextField,
  Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../hooks/useAuth';
import { useMediaLibrary } from '../../hooks/useMediaLibrary';

interface MediaFile {
  id: number;
  filename: string;
  originalName: string;
  type: 'image' | 'video' | 'audio' | 'document';
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  uploadedBy: {
    id: number;
    name: string;
    avatar?: string;
  };
  uploadedAt: string;
  tags: string[];
  isStarred: boolean;
  usageCount: number;
  folder?: {
    id: number;
    name: string;
  };
  metadata: {
    alt?: string;
    description?: string;
    copyright?: string;
    location?: string;
  };
}

interface Folder {
  id: number;
  name: string;
  parentId?: number;
  fileCount: number;
  createdAt: string;
  createdBy: {
    id: number;
    name: string;
  };
}

const MediaLibrary: React.FC = () => {
  const { user } = useAuth();
  const {
    files,
    folders,
    loading,
    error,
    totalCount,
    loadFiles,
    uploadFiles,
    deleteFile,
    createFolder,
    bulkDelete,
    toggleStar
  } = useMediaLibrary();

  // State management
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterFolder, setFilterFolder] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('uploadedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(24);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load files on mount and when filters change
  useEffect(() => {
    loadFiles({
      page,
      pageSize,
      search: searchQuery,
      type: filterType !== 'ALL' ? filterType : undefined,
      folderId: filterFolder,
      sortBy,
      sortOrder
    });
  }, [page, pageSize, searchQuery, filterType, filterFolder, sortBy, sortOrder]);

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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      acceptedFiles.forEach((file) => {
        formData.append('files', file);
      });

      if (filterFolder) {
        formData.append('folderId', filterFolder.toString());
      }

      await uploadFiles(formData, (progress: number) => {
        setUploadProgress(progress);
      });

      loadFiles({});
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [filterFolder, uploadFiles, loadFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.md']
    },
    maxSize: 100 * 1024 * 1024 // 100MB
  });

  const handleFileSelection = (fileId: number) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map((file: MediaFile) => file.id));
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, file: MediaFile) => {
    setAnchorEl(event.currentTarget);
    setSelectedFile(file);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFile(null);
  };

  const handleDeleteFile = async (fileId: number) => {
    if (confirm('Are you sure you want to delete this file?')) {
      try {
        await deleteFile(fileId);
        loadFiles({});
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedFiles.length} selected files?`)) {
      try {
        await bulkDelete(selectedFiles);
        setSelectedFiles([]);
        loadFiles({});
      } catch (error) {
        console.error('Failed to delete files:', error);
      }
    }
  };

  const handleToggleStar = async (fileId: number) => {
    try {
      await toggleStar(fileId);
      loadFiles({});
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder({
        name: newFolderName.trim(),
        parentId: filterFolder || undefined
      });
      setFolderDialogOpen(false);
      setNewFolderName('');
      loadFiles({});
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image />;
      case 'video': return <VideoFile />;
      case 'audio': return <AudioFile />;
      case 'document': return <Description />;
      default: return <Description />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderGridView = () => (
    <Grid container spacing={2}>
      {files.map((file: MediaFile) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
          <Card 
            sx={{ 
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
              checked={selectedFiles.includes(file.id)}
              onChange={() => handleFileSelection(file.id)}
              sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1, bgcolor: 'rgba(255,255,255,0.8)' }}
            />

            {/* Star Button */}
            <IconButton
              onClick={() => handleToggleStar(file.id)}
              sx={{ position: 'absolute', top: 8, right: 40, zIndex: 1, bgcolor: 'rgba(255,255,255,0.8)' }}
            >
              {file.isStarred ? <Star color="warning" /> : <StarBorder />}
            </IconButton>

            {/* Menu Button */}
            <IconButton
              onClick={(e) => handleMenuOpen(e, file)}
              sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, bgcolor: 'rgba(255,255,255,0.8)' }}
            >
              <MoreVert />
            </IconButton>

            {/* File Preview */}
            {file.type === 'image' ? (
              <CardMedia
                component="img"
                height="200"
                image={file.thumbnailUrl || file.url}
                alt={file.metadata.alt || file.filename}
                sx={{ objectFit: 'cover' }}
              />
            ) : (
              <Box
                sx={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100'
                }}
              >
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
                  {getFileIcon(file.type)}
                </Avatar>
              </Box>
            )}

            <CardContent sx={{ pt: 1 }}>
              <Typography variant="subtitle2" noWrap title={file.originalName}>
                {file.originalName}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Chip 
                  label={file.type} 
                  size="small" 
                  color="primary"
                  variant="outlined"
                />
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(file.size)}
                </Typography>
              </Box>

              {file.type === 'image' && file.width && file.height && (
                <Typography variant="caption" color="text.secondary" display="block">
                  {file.width} × {file.height}
                </Typography>
              )}

              {file.type === 'video' && file.duration && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Duration: {Math.floor(file.duration / 60)}:{(file.duration % 60).toString().padStart(2, '0')}
                </Typography>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                <Avatar 
                  src={file.uploadedBy.avatar} 
                  sx={{ width: 16, height: 16 }}
                >
                  {file.uploadedBy.name.charAt(0)}
                </Avatar>
                <Typography variant="caption" color="text.secondary">
                  {file.uploadedBy.name}
                </Typography>
              </Box>

              <Typography variant="caption" color="text.secondary" display="block">
                {new Date(file.uploadedAt).toLocaleDateString()}
              </Typography>

              {file.usageCount > 0 && (
                <Chip 
                  label={`Used ${file.usageCount} times`} 
                  size="small" 
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderListView = () => (
    <Box>
      {files.map((file: MediaFile) => (
        <Card key={file.id} sx={{ mb: 1 }}>
          <CardContent sx={{ py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                <Checkbox
                  checked={selectedFiles.includes(file.id)}
                  onChange={() => handleFileSelection(file.id)}
                />

                <Avatar
                  src={file.type === 'image' ? file.thumbnailUrl : undefined}
                  sx={{ width: 40, height: 40 }}
                >
                  {getFileIcon(file.type)}
                </Avatar>

                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" noWrap>
                    {file.originalName}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Chip label={file.type} size="small" variant="outlined" />
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(file.size)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      by {file.uploadedBy.name}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={() => handleToggleStar(file.id)}>
                  {file.isStarred ? <Star color="warning" /> : <StarBorder />}
                </IconButton>
                <IconButton onClick={(e) => handleMenuOpen(e, file)}>
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
        <Button onClick={() => loadFiles({})}>
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
            Media Library
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your images, videos, and other media files
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Folder />}
            onClick={() => setFolderDialogOpen(true)}
          >
            New Folder
          </Button>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload Files
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
            placeholder="Search files..."
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
              onChange={(e) => setSortBy(e.target.value as string)}
              label="Sort by"
            >
              <MenuItem value="uploadedAt">Upload Date</MenuItem>
              <MenuItem value="filename">Name</MenuItem>
              <MenuItem value="size">Size</MenuItem>
              <MenuItem value="usageCount">Usage</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Bulk Actions */}
          {selectedFiles.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                color="error"
                onClick={handleBulkDelete}
              >
                Delete ({selectedFiles.length})
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

          <IconButton onClick={() => loadFiles({})}>
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
                <InputLabel>File Type</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="File Type"
                >
                  <MenuItem value="ALL">All Types</MenuItem>
                  <MenuItem value="image">Images</MenuItem>
                  <MenuItem value="video">Videos</MenuItem>
                  <MenuItem value="audio">Audio</MenuItem>
                  <MenuItem value="document">Documents</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Folder</InputLabel>
                <Select
                  value={filterFolder || ''}
                  onChange={(e) => setFilterFolder(e.target.value ? parseInt(e.target.value as string) : null)}
                  label="Folder"
                >
                  <MenuItem value="">All Folders</MenuItem>
                  {folders.map((folder: Folder) => (
                    <MenuItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControlLabel
                control={<Checkbox />}
                label="Starred only"
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <Button
                variant="outlined"
                onClick={() => {
                  setFilterType('ALL');
                  setFilterFolder(null);
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* Select All */}
      {files.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedFiles.length === files.length}
                indeterminate={selectedFiles.length > 0 && selectedFiles.length < files.length}
                onChange={handleSelectAll}
              />
            }
            label={`Select all (${selectedFiles.length}/${files.length})`}
          />
        </Box>
      )}

      {/* Upload Drop Zone */}
      {isDragActive && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5">Drop files here to upload</Typography>
          </Card>
        </Box>
      )}

      {/* Files Grid/List */}
      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : files.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No files found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery || filterType !== 'ALL' || filterFolder 
              ? 'Try adjusting your search or filters'
              : 'Upload your first files to get started'
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload Files
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
              onChange={(_, newPage: number) => setPage(newPage)}
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
        aria-label="upload"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setUploadDialogOpen(true)}
      >
        <Add />
      </Fab>

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Files</DialogTitle>
        <DialogContent>
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: 'primary.main',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <input {...getInputProps()} />
            <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drag & drop files here, or click to select
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supports images, videos, audio, and documents up to 100MB
            </Typography>
          </Box>

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Uploading... {uploadProgress}%
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={folderDialogOpen} onClose={() => setFolderDialogOpen(false)}>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value as string)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFolderDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateFolder}
            variant="contained"
            disabled={!newFolderName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuList>
          <MenuItemComponent onClick={() => {/* Handle view */}}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            View Details
          </MenuItemComponent>
          
          <MenuItemComponent onClick={() => {/* Handle edit */}}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            Edit Info
          </MenuItemComponent>
          
          <MenuItemComponent onClick={() => {/* Handle download */}}>
            <ListItemIcon>
              <Download fontSize="small" />
            </ListItemIcon>
            Download
          </MenuItemComponent>
          
          <MenuItemComponent onClick={() => {/* Handle share */}}>
            <ListItemIcon>
              <Share fontSize="small" />
            </ListItemIcon>
            Share
          </MenuItemComponent>
          
          <Divider />
          
          <MenuItemComponent 
            onClick={() => {
              if (selectedFile) {
                handleDeleteFile(selectedFile.id);
              }
              handleMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            Delete
          </MenuItemComponent>
        </MenuList>
      </Menu>
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

export default MediaLibrary;