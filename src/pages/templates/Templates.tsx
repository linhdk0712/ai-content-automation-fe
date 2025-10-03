import {
  AccountBalance,
  Add,
  BusinessCenter,
  Campaign as CampaignIcon,
  Code,
  ContentCopy,
  Delete,
  Description,
  Download,
  Edit,
  Email,
  Factory,
  Flight,
  Home,
  MoreHoriz,
  MoreVert,
  Movie,
  People,
  Restaurant,
  School,
  Search,
  Share,
  StarBorder,
  Store,
  Visibility,
  VolunteerActivism
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { templateService } from '../../services/template.service';
import { useI18n } from '../../hooks/useI18n';
import {
  CreateTemplateRequest,
  Template,
  TemplateCategory,
  TemplateIndustry,
  TemplateLanguage,
  TemplateSearchRequest
} from '../../types/template.types';

// Category Icons Mapping - Updated to match backend categories
const categoryIcons: Record<TemplateCategory, React.ReactElement> = {
  [TemplateCategory.MARKETING]: <CampaignIcon />,
  [TemplateCategory.ECOMMERCE]: <Store />,
  [TemplateCategory.HEALTHCARE]: <People />,
  [TemplateCategory.EDUCATION]: <School />,
  [TemplateCategory.TECHNOLOGY]: <Code />,
  [TemplateCategory.FINANCE]: <AccountBalance />,
  [TemplateCategory.TRAVEL]: <Flight />,
  [TemplateCategory.FOOD]: <Restaurant />,
  [TemplateCategory.FASHION]: <Store />,
  [TemplateCategory.REAL_ESTATE]: <Home />,
  [TemplateCategory.SOCIAL_MEDIA]: <Share />,
  [TemplateCategory.BLOG_POST]: <Description />,
  [TemplateCategory.EMAIL]: <Email />,
  [TemplateCategory.ADVERTISEMENT]: <CampaignIcon />,
  [TemplateCategory.PRODUCT_DESCRIPTION]: <Store />,
  [TemplateCategory.NEWS_ARTICLE]: <Description />,
  [TemplateCategory.CREATIVE_WRITING]: <Description />,
  [TemplateCategory.BUSINESS]: <BusinessCenter />,
  [TemplateCategory.GENERAL]: <MoreHoriz />
};

// Industry Icons Mapping
const industryIcons: Record<TemplateIndustry, React.ReactElement> = {
  [TemplateIndustry.TECHNOLOGY]: <Code />,
  [TemplateIndustry.HEALTHCARE]: <People />,
  [TemplateIndustry.FINANCE]: <AccountBalance />,
  [TemplateIndustry.EDUCATION]: <School />,
  [TemplateIndustry.RETAIL]: <Store />,
  [TemplateIndustry.MANUFACTURING]: <Factory />,
  [TemplateIndustry.REAL_ESTATE]: <Home />,
  [TemplateIndustry.TRAVEL]: <Flight />,
  [TemplateIndustry.FOOD_BEVERAGE]: <Restaurant />,
  [TemplateIndustry.ENTERTAINMENT]: <Movie />,
  [TemplateIndustry.NON_PROFIT]: <VolunteerActivism />,
  [TemplateIndustry.GOVERNMENT]: <AccountBalance />,
  [TemplateIndustry.CONSULTING]: <BusinessCenter />,
  [TemplateIndustry.MARKETING]: <CampaignIcon />,
  [TemplateIndustry.OTHER]: <MoreHoriz />
};



const Templates: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  
  // State management
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'ALL'>('ALL');
  const [selectedIndustry, setSelectedIndustry] = useState<TemplateIndustry | 'ALL'>('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState<TemplateLanguage | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Create template form - Updated to match backend DTO
  const [createForm, setCreateForm] = useState<CreateTemplateRequest>({
    name: '',
    description: '',
    promptTemplate: '',
    category: TemplateCategory.GENERAL,
    language: 'vi',
    tags: [],
    isPublic: false
  });

  // Load templates on mount and when filters change
  useEffect(() => {
    loadTemplates();
  }, [tabValue, searchQuery, selectedCategory, selectedIndustry, selectedLanguage, sortBy, sortOrder, currentPage]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const searchRequest: TemplateSearchRequest = {
        query: searchQuery || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        industry: selectedIndustry !== 'ALL' ? selectedIndustry : undefined,
        language: selectedLanguage !== 'ALL' ? selectedLanguage : undefined,
        sortBy,
        sortDir: sortOrder,
        page: currentPage,
        size: 12
      };

      console.log('Loading templates with request:', searchRequest);
      console.log('Tab value:', tabValue);

      let response;
      switch (tabValue) {
        case 0: // All Templates
          response = await templateService.searchTemplates(searchRequest);
          break;
        case 1: // My Templates
          response = await templateService.getUserTemplates(currentPage, 12);
          break;
        case 2: // Favorites
          const favorites = await templateService.getFavoriteTemplates();
          response = { templates: favorites, totalElements: favorites.length, totalPages: 1, currentPage: 0, pageSize: 12 };
          break;
        case 3: // Popular
          const popular = await templateService.getPopularTemplates(12);
          response = { templates: popular, totalElements: popular.length, totalPages: 1, currentPage: 0, pageSize: 12 };
          break;
        case 4: // Trending (instead of Recent since backend doesn't have recent endpoint)
          const trending = await templateService.getTrendingTemplates(12);
          response = { templates: trending, totalElements: trending.length, totalPages: 1, currentPage: 0, pageSize: 12 };
          break;
        default:
          response = await templateService.searchTemplates(searchRequest);
      }

      console.log('Template service response:', response);
      console.log('Templates array:', response.templates);
      console.log('Templates length:', response.templates?.length);

      setTemplates(response.templates);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      setError('Failed to load templates');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const newTemplate = await templateService.createTemplate(createForm);
      setTemplates(prev => [newTemplate, ...prev]);
      setCreateDialogOpen(false);
      setCreateForm({
        name: '',
        description: '',
        promptTemplate: '',
        category: TemplateCategory.GENERAL,
        language: 'vi',
        tags: [],
        isPublic: false
      });
    } catch (err) {
      setError('Failed to create template');
      console.error('Error creating template:', err);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      await templateService.deleteTemplate(selectedTemplate.id);
      setTemplates(prev => prev.filter(t => t.id !== selectedTemplate.id));
      setDeleteDialogOpen(false);
      setSelectedTemplate(null);
    } catch (err) {
      setError('Failed to delete template');
      console.error('Error deleting template:', err);
    }
  };

  const handleToggleFavorite = async (templateId: number, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        await templateService.removeFromFavorites(templateId);
      } else {
        await templateService.addToFavorites(templateId);
      }
      loadTemplates(); // Reload to update favorite status
    } catch (err) {
      setError('Failed to update favorite status');
      console.error('Error updating favorite:', err);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, template: Template) => {
    setAnchorEl(event.currentTarget);
    setSelectedTemplate(template);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTemplate(null);
  };



  const renderTemplateCard = (template: Template) => (
    <Card 
      key={template.id} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: 'pointer',
        '&:hover': { boxShadow: 4 }
      }}
      onClick={() => navigate(`/templates/${template.id}`)}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={template.category}>
              {categoryIcons[template.category]}
            </Tooltip>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              {template.name}
            </Typography>
          </Box>
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              handleMenuClick(e, template);
            }}
          >
            <MoreVert />
          </IconButton>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
          {template.description}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={template.category.replace('_', ' ')} 
            color="primary"
            size="small"
          />
          <Chip 
            label={template.licenseType} 
            color="secondary"
            size="small"
          />
          {template.isFeatured && (
            <Chip 
              label="Featured" 
              color="success"
              size="small"
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Avatar sx={{ width: 24, height: 24 }}>
            {template.createdBy}
          </Avatar>
          <Typography variant="caption" color="text.secondary">
            User {template.createdBy}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {new Date(template.createdAt).toLocaleDateString()}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {template.usageCount} uses
            </Typography>
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite(template.id, false); // Assuming not favorite for now
              }}
            >
              <StarBorder fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderSkeletonCards = () => (
    <Grid container spacing={3}>
      {Array.from({ length: 12 }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Skeleton variant="text" height={32} />
              <Skeleton variant="text" height={20} />
              <Skeleton variant="text" height={20} />
              <Skeleton variant="rectangular" height={100} sx={{ mt: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Skeleton variant="circular" width={24} height={24} />
                <Skeleton variant="text" width={60} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Template Library
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Template
        </Button>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
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
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | 'ALL')}
                label="Category"
              >
                <MenuItem value="ALL">All Categories</MenuItem>
                {Object.values(TemplateCategory).map((category) => (
                  <MenuItem key={category} value={category}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {categoryIcons[category]}
                      {category.replace('_', ' ')}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Industry</InputLabel>
              <Select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value as TemplateIndustry | 'ALL')}
                label="Industry"
              >
                <MenuItem value="ALL">All Industries</MenuItem>
                {Object.values(TemplateIndustry).map((industry) => (
                  <MenuItem key={industry} value={industry}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {industryIcons[industry]}
                      {industry.replace('_', ' ')}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as TemplateLanguage | 'ALL')}
                label="Language"
              >
                <MenuItem value="ALL">All Languages</MenuItem>
                {Object.values(TemplateLanguage).map((language) => (
                  <MenuItem key={language} value={language}>
                    {language}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                label="Sort By"
              >
                <MenuItem value="NAME">Name</MenuItem>
                <MenuItem value="CREATED_AT">Created Date</MenuItem>
                <MenuItem value="UPDATED_AT">Updated Date</MenuItem>
                <MenuItem value="RATING">Rating</MenuItem>
                <MenuItem value="USAGE_COUNT">Usage Count</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="All Templates" />
          <Tab label="My Templates" />
          <Tab label="Favorites" />
          <Tab label="Popular" />
          <Tab label="Trending" />
        </Tabs>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && renderSkeletonCards()}

      {/* Templates Grid */}
      {!loading && (
        <>
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="caption">
                Debug: Templates count: {templates.length}, Total elements: {totalElements}, Total pages: {totalPages}
              </Typography>
            </Box>
          )}
          
          <Grid container spacing={3}>
            {templates.length > 0 ? (
              templates.map(renderTemplateCard)
            ) : (
              <Grid item xs={12}>
                <Alert severity="info">
                  No templates found. Try adjusting your search criteria.
                </Alert>
              </Grid>
            )}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage + 1}
                onChange={(e, page) => setCurrentPage(page - 1)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Create Template Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template Name"
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={createForm.category}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value as TemplateCategory }))}
                  label="Category"
                >
                  {Object.values(TemplateCategory).map((category) => (
                    <MenuItem key={category} value={category}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {categoryIcons[category]}
                        {category.replace('_', ' ')}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Prompt Template"
                value={createForm.promptTemplate}
                onChange={(e) => setCreateForm(prev => ({ ...prev, promptTemplate: e.target.value }))}
                multiline
                rows={8}
                placeholder="Enter your template prompt here... Use {{variable_name}} for variables"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={createForm.isPublic}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                  />
                }
                label="Make this template public"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateTemplate} variant="contained" disabled={!createForm.name}>
            Create Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Template</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedTemplate?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteTemplate} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleMenuClose(); navigate(`/templates/${selectedTemplate?.id}/edit`); }}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); navigate(`/templates/${selectedTemplate?.id}`); }}>
          <Visibility sx={{ mr: 1 }} />
          View
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); setShareDialogOpen(true); }}>
          <Share sx={{ mr: 1 }} />
          Share
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); }}>
          <ContentCopy sx={{ mr: 1 }} />
          Duplicate
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); }}>
          <Download sx={{ mr: 1 }} />
          Export
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleMenuClose(); setDeleteDialogOpen(true); }} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default Templates;