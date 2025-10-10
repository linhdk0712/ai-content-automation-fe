import { useContent } from '@/hooks/useContent';
import {
  AccessTime,
  ArrowBack,
  Compare,
  Delete,
  Download,
  Edit,
  MoreVert,
  Redo,
  Restore,
  Search,
  Share,
  Sort,
  Undo,
  Visibility
} from '@mui/icons-material';
import {
  Alert,
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
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  ListItemIcon,
  Menu,
  MenuItem,
  Paper,
  Select,
  MenuItem as SelectMenuItem,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ContentVersion {
  id: number;
  versionNumber: number;
  textContent: string;
  changeDescription: string;
  changeType: 'CREATED' | 'UPDATED' | 'ROLLBACK' | 'MERGE' | 'AUTO_SAVE';
  createdBy: {
    id: number;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  isCurrent: boolean;
  tags?: string[];
  metadata?: {
    aiGenerated?: boolean;
    aiProvider?: string;
    generationCost?: number;
    editTime?: number;
  };
  characterCount: number;
}

interface DiffResult {
  added?: boolean;
  removed?: boolean;
  value: string;
}

const ContentVersions: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    content,
    versions,
    loading,
    error,
    loadContent,
    getVersionHistory,
    rollbackToVersion,
    compareVersions,
    deleteVersion,
    exportVersion
  } = useContent();

  // State management
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ContentVersion | null>(null);
  const [diffResult] = useState<DiffResult[]>([]);
  const [diffMode] = useState<'words' | 'lines'>('words');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [filterAuthor, setFilterAuthor] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('versionNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Load content and versions on mount
  useEffect(() => {
    if (id) {
      loadContent(parseInt(id));
      loadVersionHistory();
    }
  }, [id]);

  const loadVersionHistory = async () => {
    if (id) {
      await getVersionHistory((id));
    }
  };

  // Filter and sort versions
  const filteredVersions = versions
    .filter(version => {
      const matchesAuthor = filterAuthor === 'ALL' || version.createdBy === filterAuthor;
      const matchesType = filterType === 'ALL' || version.changeType === filterType;
      const matchesSearch = !searchQuery || 
        version.changeDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        version.textContent.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesAuthor && matchesType && matchesSearch;
    })
    .sort((a, b) => {
      const aValue = (a as any)[sortBy];
      const bValue = (b as any)[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleVersionSelect = (versionNumber: number) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionNumber)) {
        return prev.filter(v => v !== versionNumber);
      } else if (prev.length < 2) {
        return [...prev, versionNumber];
      } else {
        return [prev[1], versionNumber];
      }
    });
  };

  const handleCompareVersions = async () => {
    if (selectedVersions.length === 2) {
      const [version1, version2] = selectedVersions.sort((a, b) => a - b);
      const comparison = await compareVersions(id!, version1, version2);
      console.log(comparison);
     /*  const diff = diffMode === 'words' 
        ? diffWords(comparison.version1.textContent, comparison.version2.textContent)
        : diffLines(comparison.version1.textContent, comparison.version2.textContent);
      
      setDiffResult(diff); */
      setCompareDialogOpen(true);
    }
  };

  const handleRestoreVersion = async () => {
    if (selectedVersion) {
      try {
        await rollbackToVersion(id!, selectedVersion.versionNumber);
        setRestoreDialogOpen(false);
        setSelectedVersion(null);
        loadVersionHistory();
        
        // Show success message
        alert('Version restored successfully');
      } catch (error) {
        alert('Failed to restore version');
      }
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, version: ContentVersion) => {
    setAnchorEl(event.currentTarget);
    setSelectedVersion(version);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVersion(null);
  };

  const handleExportVersion = async (version: ContentVersion) => {
    try {
      await exportVersion(version.id.toString(), version.versionNumber);
      handleMenuClose();
    } catch (error) {
      alert('Failed to export version');
    }
  };

  const handleDeleteVersion = async (version: ContentVersion) => {
    if (version.isCurrent) {
      alert('Cannot delete the current version');
      return;
    }

    if (confirm(`Are you sure you want to delete version ${version.versionNumber}?`)) {
      try {
        await deleteVersion(version.id.toString(), version.versionNumber);
        loadVersionHistory();
        handleMenuClose();
      } catch (error) {
        alert('Failed to delete version');
      }
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'CREATED': return 'success';
      case 'UPDATED': return 'primary';
      case 'ROLLBACK': return 'warning';
      case 'MERGE': return 'info';
      case 'AUTO_SAVE': return 'default';
      default: return 'default';
    }
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'CREATED': return <Edit />;
      case 'UPDATED': return <Edit />;
      case 'ROLLBACK': return <Undo />;
      case 'MERGE': return <Redo />;
      case 'AUTO_SAVE': return <AccessTime />;
      default: return <Edit />;
    }
  };

  const renderDiffViewer = () => (
    <Box sx={{ maxHeight: 400, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Comparing Version {selectedVersions[0]} vs Version {selectedVersions[1]}
        </Typography>
        <FormControl size="small">
          <InputLabel>Diff Mode</InputLabel>
          <Select
            value={diffMode}
            onChange={() => {/* setDiffMode(e.target.value as 'words' | 'lines') */}}
            label="Diff Mode"
          >
            <SelectMenuItem value="words">Words</SelectMenuItem>
            <SelectMenuItem value="lines">Lines</SelectMenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Paper sx={{ p: 2, fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.6 }}>
        {diffResult.map((part, index) => (
          <span
            key={index}
            style={{
              backgroundColor: part.added 
                ? '#d4edda' 
                : part.removed 
                ? '#f8d7da' 
                : 'transparent',
              color: part.added 
                ? '#155724' 
                : part.removed 
                ? '#721c24' 
                : 'inherit',
              textDecoration: part.removed ? 'line-through' : 'none'
            }}
          >
            {part.value}
          </span>
        ))}
      </Paper>
    </Box>
  );

  const renderVersionCard = (version: ContentVersion) => (
    <Card 
      key={version.id}
      sx={{ 
        mb: 2,
        border: selectedVersions.includes(version.versionNumber) ? 2 : 1,
        borderColor: selectedVersions.includes(version.versionNumber) ? 'primary.main' : 'divider',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 2
        }
      }}
      onClick={() => handleVersionSelect(version.versionNumber)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6">
                Version {version.versionNumber}
              </Typography>
              
              {version.isCurrent && (
                <Chip label="Current" color="primary" size="small" />
              )}
              
              <Chip 
                label={version.changeType.replace('_', ' ')} 
                color={getChangeTypeColor(version.changeType) as any}
                size="small"
                icon={getChangeTypeIcon(version.changeType)}
              />
            </Box>

            <Typography variant="h6" gutterBottom>
              {version.textContent}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {version.changeDescription}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Avatar 
                  src={version.createdBy.avatar} 
                  sx={{ width: 24, height: 24 }}
                >
                  {version.createdBy.name.charAt(0)}
                </Avatar>
                <Typography variant="body2" color="text.secondary">
                  {version.createdBy.name}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary">
                {new Date(version.createdAt).toLocaleString()}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {version.textContent.length} words
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {version.characterCount} characters
              </Typography>
              {version.metadata?.editTime && (
                <Typography variant="caption" color="text.secondary">
                  {Math.round(version.metadata.editTime / 60)} min edit time
                </Typography>
              )}
            </Box>

            {version.metadata?.aiGenerated && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip 
                  label={`AI Generated (${version.metadata.aiProvider})`}
                  size="small"
                  color="info"
                  variant="outlined"
                />
                {version.metadata.generationCost && (
                  <Typography variant="caption" color="text.secondary">
                    Cost: ${version.metadata.generationCost.toFixed(4)}
                  </Typography>
                )}
              </Box>
            )}

            {version.tags && version.tags.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {version.tags.map((tag: string) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                <Chip label="No tags" size="small" variant="outlined" />
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleMenuOpen(e, version);
              }}
            >
              <MoreVert />
            </IconButton>

            {!version.isCurrent && (
              <Tooltip title="Restore this version">
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVersion(version);
                    setRestoreDialogOpen(true);
                  }}
                  color="primary"
                >
                  <Restore />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="View this version">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/content/view/${id}/version/${version.versionNumber}`);
                }}
              >
                <Visibility />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading version history...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {error.userMessage}
          </Typography>
          {error.code && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Error code: {error.code}
            </Typography>
          )}
        </Alert>
        <Button onClick={() => navigate(`/content/edit/${id}`)}>
          Back to Editor
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <IconButton onClick={() => navigate(`/content/edit/${id}`)}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4">
              Version History
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            {content?.title || 'Untitled Content'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Compare />}
            onClick={handleCompareVersions}
            disabled={selectedVersions.length !== 2}
          >
            Compare ({selectedVersions.length}/2)
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => {/* Handle export all versions */}}
          >
            Export All
          </Button>
        </Box>
      </Box>

      {/* Filters and Search */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search versions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Author</InputLabel>
              <Select
                value={filterAuthor}
                onChange={(e) => setFilterAuthor(e.target.value)}
                label="Author"
              >
                <SelectMenuItem value="ALL">All Authors</SelectMenuItem>
                <SelectMenuItem value={user?.id?.toString() || ''}>My Changes</SelectMenuItem>
                {/* Add other authors dynamically */}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Change Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Change Type"
              >
                <SelectMenuItem value="ALL">All Types</SelectMenuItem>
                <SelectMenuItem value="CREATED">Created</SelectMenuItem>
                <SelectMenuItem value="UPDATED">Updated</SelectMenuItem>
                <SelectMenuItem value="ROLLBACK">Rollback</SelectMenuItem>
                <SelectMenuItem value="AUTO_SAVE">Auto Save</SelectMenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <SelectMenuItem value="versionNumber">Version</SelectMenuItem>
                <SelectMenuItem value="createdAt">Date</SelectMenuItem>
                <SelectMenuItem value="wordCount">Word Count</SelectMenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={1}>
            <IconButton 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <Sort sx={{ transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />
            </IconButton>
          </Grid>

          <Grid item xs={12} sm={2}>
            <Button
              variant="outlined"
              onClick={() => {
                setFilterAuthor('ALL');
                setFilterType('ALL');
                setSearchQuery('');
                setSortBy('versionNumber');
                setSortOrder('desc');
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Selection Info */}
      {selectedVersions.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {selectedVersions.length === 1 
            ? `Version ${selectedVersions[0]} selected`
            : `Versions ${selectedVersions.join(' and ')} selected for comparison`
          }
          <Button 
            size="small" 
            onClick={() => setSelectedVersions([])}
            sx={{ ml: 2 }}
          >
            Clear Selection
          </Button>
        </Alert>
      )}

      {/* Versions List */}
      <Box>
        {filteredVersions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No versions found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery || filterAuthor !== 'ALL' || filterType !== 'ALL'
                ? 'Try adjusting your filters'
                : 'No version history available'
              }
            </Typography>
          </Box>
        ) : (
          filteredVersions.map((v) => renderVersionCard(v as unknown as ContentVersion))
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedVersion && navigate(`/content/view/${id}/version/${selectedVersion.versionNumber}`)}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          View Version
        </MenuItem>
        
        <MenuItem onClick={() => selectedVersion && navigate(`/content/edit/${id}?version=${selectedVersion.versionNumber}`)}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          Edit from Version
        </MenuItem>
        
        <MenuItem onClick={() => selectedVersion && handleExportVersion(selectedVersion)}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          Export Version
        </MenuItem>
        
        <MenuItem onClick={() => {/* Handle share */}}>
          <ListItemIcon>
            <Share fontSize="small" />
          </ListItemIcon>
          Share Version
        </MenuItem>
        
        <Divider />
        
        {selectedVersion && !selectedVersion.isCurrent && (
          <MenuItem 
            onClick={() => selectedVersion && handleDeleteVersion(selectedVersion)}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            Delete Version
          </MenuItem>
        )}
      </Menu>

      {/* Compare Dialog */}
      <Dialog 
        open={compareDialogOpen} 
        onClose={() => setCompareDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Version Comparison</DialogTitle>
        <DialogContent>
          {renderDiffViewer()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)}>
        <DialogTitle>Restore Version</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to restore to version {selectedVersion?.versionNumber}? 
            This will create a new version with the content from the selected version.
          </Typography>
          {selectedVersion && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Version {selectedVersion.versionNumber} Details:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedVersion.changeDescription}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Created by {selectedVersion.createdBy.name} on {new Date(selectedVersion.createdAt).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleRestoreVersion} variant="contained" color="warning">
            Restore Version
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContentVersions;
