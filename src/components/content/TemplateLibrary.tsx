import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Rating,
  Alert,
  Skeleton,
  InputAdornment
} from '@mui/material';
import {
  Search,
  Favorite,
  FavoriteBorder,
  Visibility,
  Edit,
  Add,
  ArrowBack,
  TrendingUp,
} from '@mui/icons-material';
import { useTemplates } from '../../hooks/useTemplates';

interface TemplateLibraryProps {
  industry?: string;
  contentType?: string;
  language?: string;
  onTemplateSelect: (template: any) => void;
  onBackToCreate: () => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  industry,
  contentType,
  language,
  onTemplateSelect,
  onBackToCreate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState(industry || '');
  const [selectedContentType, setSelectedContentType] = useState(contentType || '');
  const [selectedLanguage, setSelectedLanguage] = useState(language || 'en');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeTab, setActiveTab] = useState(0);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const {
    templates,
    categories,
    favoriteTemplates,
    popularTemplates,
    userTemplates,
    isLoading,
    error,
    searchTemplates,
    getCategories,
    getFavoriteTemplates,
    getPopularTemplates,
    getUserTemplates,
    addToFavorites,
    removeFromFavorites,
    rateTemplate
  } = useTemplates();

  useEffect(() => {
    getCategories();
    getFavoriteTemplates();
    getPopularTemplates(20);
    getUserTemplates(0, 20);
  }, [getCategories, getFavoriteTemplates, getPopularTemplates, getUserTemplates]);

  useEffect(() => {
    const searchParams = {
      query: searchQuery,
      category: selectedCategory,
      industry: selectedIndustry,
      contentType: selectedContentType,
      language: selectedLanguage,
      sortBy,
      sortOrder,
      page: 0,
      size: 20
    };

    searchTemplates(searchParams);
  }, [searchQuery, selectedCategory, selectedIndustry, selectedContentType, selectedLanguage, sortBy, sortOrder, searchTemplates]);

  const handleTemplateSelect = (template: any) => {
    onTemplateSelect(template);
    onBackToCreate();
  };

  const handleToggleFavorite = async (template: any) => {
    const isFavorite = favoriteTemplates.some(fav => fav.id === template.id);
    
    if (isFavorite) {
      await removeFromFavorites(template.id);
    } else {
      await addToFavorites(template.id);
    }
  };

  const handleRateTemplate = async (templateId: string, rating: number) => {
    await rateTemplate(templateId, rating);
  };

  const renderTemplateCard = (template: any) => {
    const isFavorite = favoriteTemplates.some(fav => fav.id === template.id);

    return (
      <Card key={template.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="h6" sx={{ flexGrow: 1, mr: 1 }}>
              {template.name}
            </Typography>
            <IconButton
              size="small"
              onClick={() => handleToggleFavorite(template)}
              color={isFavorite ? 'error' : 'default'}
            >
              {isFavorite ? <Favorite /> : <FavoriteBorder />}
            </IconButton>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
            {template.description}
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
            <Chip label={template.category} size="small" color="primary" variant="outlined" />
            <Chip label={template.industry} size="small" variant="outlined" />
            <Chip label={template.contentType} size="small" variant="outlined" />
            {template.language !== 'en' && (
              <Chip label={template.language.toUpperCase()} size="small" variant="outlined" />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Rating
              value={template.averageRating || 0}
              onChange={(_, value) => value && handleRateTemplate(template.id, value)}
              size="small"
              sx={{ mr: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              ({template.usageCount || 0} uses)
            </Typography>
          </Box>

          {template.tags && template.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
              {template.tags.slice(0, 3).map((tag: string, index: number) => (
                <Chip key={index} label={`#${tag}`} size="small" variant="outlined" />
              ))}
              {template.tags.length > 3 && (
                <Typography variant="caption" color="text.secondary">
                  +{template.tags.length - 3} more
                </Typography>
              )}
            </Box>
          )}
        </CardContent>

        <Box sx={{ p: 2, pt: 0 }}>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<Visibility />}
                onClick={() => setPreviewTemplate(template as any)}
              >
                Preview
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="contained"
                size="small"
                onClick={() => handleTemplateSelect(template)}
              >
                Use Template
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Card>
    );
  };

  const renderSkeletonCards = () => (
    <Grid container spacing={2}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Grid item xs={12} sm={6} md={4} key={i}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="80%" height={32} />
              <Skeleton variant="text" width="100%" height={20} />
              <Skeleton variant="text" width="60%" height={20} />
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Skeleton variant="rectangular" width={60} height={24} />
                <Skeleton variant="rectangular" width={80} height={24} />
              </Box>
              <Skeleton variant="rectangular" width="100%" height={36} sx={{ mt: 2 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const getTemplatesByTab = () => {
    switch (activeTab) {
      case 0: // All Templates
        return templates;
      case 1: // Popular
        return popularTemplates;
      case 2: // Favorites
        return favoriteTemplates;
      case 3: // My Templates
        return userTemplates;
      default:
        return templates;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={onBackToCreate} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" gutterBottom>
            Template Library
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose from pre-built templates or create your own
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowCreateDialog(true)}
        >
          Create Template
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.name} value={category.name}>
                      {category.displayName} ({category.templateCount})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Industry</InputLabel>
                <Select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  label="Industry"
                >
                  <MenuItem value="">All Industries</MenuItem>
                  <MenuItem value="Marketing">Marketing</MenuItem>
                  <MenuItem value="E-commerce">E-commerce</MenuItem>
                  <MenuItem value="Healthcare">Healthcare</MenuItem>
                  <MenuItem value="Education">Education</MenuItem>
                  <MenuItem value="Technology">Technology</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Content Type</InputLabel>
                <Select
                  value={selectedContentType}
                  onChange={(e) => setSelectedContentType(e.target.value)}
                  label="Content Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="TEXT">General Text</MenuItem>
                  <MenuItem value="MARKETING">Marketing</MenuItem>
                  <MenuItem value="SOCIAL_MEDIA">Social Media</MenuItem>
                  <MenuItem value="EMAIL">Email</MenuItem>
                  <MenuItem value="BLOG">Blog</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="updated_at">Recently Updated</MenuItem>
                  <MenuItem value="created_at">Recently Created</MenuItem>
                  <MenuItem value="usage_count">Most Popular</MenuItem>
                  <MenuItem value="rating">Highest Rated</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab label="All Templates" />
          <Tab 
            label="Popular" 
            icon={<TrendingUp />} 
            iconPosition="start"
          />
          <Tab 
            label="Favorites" 
            icon={<Favorite />} 
            iconPosition="start"
          />
          <Tab 
            label="My Templates" 
            icon={<Edit />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Templates Grid */}
      {isLoading ? (
        renderSkeletonCards()
      ) : (
        <Grid container spacing={2}>
          {getTemplatesByTab().map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              {renderTemplateCard(template)}
            </Grid>
          ))}
          {getTemplatesByTab().length === 0 && !isLoading && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No templates found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search criteria or create a new template.
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Template Preview Dialog */}
      <Dialog
        open={Boolean(previewTemplate)}
        onClose={() => setPreviewTemplate(null as any)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {previewTemplate?.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Rating value={previewTemplate?.averageRating || 0} readOnly size="small" sx={{ mr: 1 }} />
              <Typography variant="caption" color="text.secondary">
                ({previewTemplate?.usageCount || 0} uses)
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {previewTemplate && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {previewTemplate.description}
              </Typography>

              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                <Chip label={previewTemplate.category} size="small" color="primary" />
                <Chip label={previewTemplate.industry} size="small" />
                <Chip label={previewTemplate.contentType} size="small" />
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                Template Content:
              </Typography>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                  maxHeight: 300,
                  overflow: 'auto'
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {previewTemplate.content}
                </Typography>
              </Box>

              {previewTemplate.variables && previewTemplate.variables.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Variables:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {previewTemplate.variables.map((variable: string, index: number) => (
                      <Chip key={index} label={`{{${variable}}}`} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewTemplate(null as any)}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              handleTemplateSelect(previewTemplate);
              setPreviewTemplate(null as any);
            }}
          >
            Use Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateLibrary;