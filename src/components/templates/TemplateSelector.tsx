import {
  Close,
  Search,
  Star,
  StarBorder,
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
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTemplate } from '../../hooks/useTemplate';
import {
  Template,
  TemplateCategory,
  TemplateIndustry,
  TemplateLanguage,
  TemplateType
} from '../../types/template.types';

interface TemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: Template, processedContent?: string) => void;
  title?: string;
  subtitle?: string;
  allowPreview?: boolean;
  filterByCategory?: TemplateCategory;
  filterByIndustry?: TemplateIndustry;
  filterByType?: TemplateType;
  showFavoritesOnly?: boolean;
  showUserTemplatesOnly?: boolean;
  maxSelections?: number;
  multiSelect?: boolean;
}



const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  open,
  onClose,
  onSelect,
  title = 'Select a Template',
  subtitle = 'Choose a template to get started with your content creation',
  allowPreview = true,
  filterByCategory,
  filterByIndustry,
  showFavoritesOnly = false,
  showUserTemplatesOnly = false,
  maxSelections = 1,
  multiSelect = false
}) => {
  const {
    templates,
    favorites,
    popularTemplates,
    recentTemplates,
    loading,
    error,
    searchTemplates,
    getFavoriteTemplates,
    getPopularTemplates,
    getRecentTemplates,
    getUserTemplates,
    addToFavorites,
    removeFromFavorites,
    processTemplate,
    generatePreview
  } = useTemplate();

  // State management
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState<TemplateLanguage | 'ALL'>('ALL');
  const [selectedTemplates, setSelectedTemplates] = useState<Template[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [useTemplateDialogOpen, setUseTemplateDialogOpen] = useState(false);
  const [processingTemplate, setProcessingTemplate] = useState<Template | null>(null);

  // Load templates on mount and when filters change
  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open, tabValue, searchQuery, selectedCategory, selectedIndustry, selectedLanguage]);

  // Apply initial filters
  useEffect(() => {
    if (filterByCategory) {
      setSelectedCategory(filterByCategory);
    }
    if (filterByIndustry) {
      setSelectedIndustry(filterByIndustry);
    }
  }, [filterByCategory, filterByIndustry]);

  const loadTemplates = async () => {
    try {
      switch (tabValue) {
        case 0: // All Templates
          if (!showUserTemplatesOnly && !showFavoritesOnly) {
            await searchTemplates({
              query: searchQuery || undefined,
              category: selectedCategory !== 'ALL' ? selectedCategory as TemplateCategory : undefined,
              industry: selectedIndustry !== 'ALL' ? selectedIndustry as TemplateIndustry : undefined,
              language: selectedLanguage !== 'ALL' ? selectedLanguage : undefined,
              page: 0,
              size: 20
            });
          }
          break;
        case 1: // My Templates
          if (!showFavoritesOnly) {
            await getUserTemplates(0, 20);
          }
          break;
        case 2: // Favorites
          await getFavoriteTemplates();
          break;
        case 3: // Popular
          if (!showUserTemplatesOnly && !showFavoritesOnly) {
            await getPopularTemplates(20);
          }
          break;
        case 4: // Recent
          if (!showUserTemplatesOnly && !showFavoritesOnly) {
            await getRecentTemplates(20);
          }
          break;
      }
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    if (multiSelect) {
      if (selectedTemplates.find(t => t.id === template.id)) {
        setSelectedTemplates(prev => prev.filter(t => t.id !== template.id));
      } else if (selectedTemplates.length < maxSelections) {
        setSelectedTemplates(prev => [...prev, template]);
      }
    } else {
      // For single select, show use template dialog if template has variables
      if ((template as any).variables && (template as any).variables.length > 0) {
        setProcessingTemplate(template);
        setUseTemplateDialogOpen(true);
        // Initialize variable values
        const initialValues: Record<string, any> = {};
        (template as any).variables.forEach((variable: any) => {
          if (variable.defaultValue !== undefined) {
            initialValues[variable.name] = variable.defaultValue;
          }
        });
        setVariableValues(initialValues);
      } else {
        onSelect(template);
      }
    }
  };

  const handlePreview = async (template: Template) => {
    try {
      setPreviewTemplate(template);
      const preview = await generatePreview(template.id);
      setPreviewContent(preview);
      setPreviewDialogOpen(true);
    } catch (err) {
      console.error('Error generating preview:', err);
    }
  };

  const handleUseTemplate = async () => {
    if (!processingTemplate) return;

    try {
      const result = await processTemplate({
        templateId: processingTemplate.id,
        variables: variableValues
      });
      
      onSelect(processingTemplate, result.processedContent);
      setUseTemplateDialogOpen(false);
      setProcessingTemplate(null);
      setVariableValues({});
    } catch (err) {
      console.error('Error processing template:', err);
    }
  };

  const handleToggleFavorite = async (template: Template, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        await removeFromFavorites(template.id);
      } else {
        await addToFavorites(template.id);
      }
    } catch (err) {
      console.error('Error updating favorite status:', err);
    }
  };

  const handleMultiSelect = () => {
    if (selectedTemplates.length > 0) {
      selectedTemplates.forEach(template => onSelect(template));
      setSelectedTemplates([]);
    }
  };

  const getCurrentTemplates = () => {
    if (showFavoritesOnly) return favorites;
    if (showUserTemplatesOnly) return templates.filter(t => t.createdBy === 1); // Assuming user ID
    
    switch (tabValue) {
      case 0: return templates;
      case 1: return templates.filter(t => t.createdBy === 1); // User templates
      case 2: return favorites;
      case 3: return popularTemplates;
      case 4: return recentTemplates;
      default: return templates;
    }
  };

  const renderTemplateCard = (template: Template) => {
    const isSelected = selectedTemplates.find(t => t.id === template.id);
    const isFavorite = favorites.find(t => t.id === template.id);

    return (
      <Card 
        key={template.id}
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          cursor: 'pointer',
          border: isSelected ? 2 : 0,
          borderColor: 'primary.main',
          '&:hover': { boxShadow: 4 }
        }}
        onClick={() => handleTemplateSelect(template)}
      >
        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontSize: '1rem' }}>
              {template.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {allowPreview && (
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(template);
                  }}
                >
                  <Visibility fontSize="small" />
                </IconButton>
              )}
              <IconButton 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(template, !!isFavorite);
                }}
              >
                {isFavorite ? <Star fontSize="small" color="primary" /> : <StarBorder fontSize="small" />}
              </IconButton>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, minHeight: 32, fontSize: '0.875rem' }}>
            {template.description}
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
            <Chip label={template.category.replace('_', ' ')} size="small" />
            <Chip label={(template as any).type.replace('_', ' ')} size="small" variant="outlined" />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar src={(template as any).createdBy?.avatar} sx={{ width: 16, height: 16 }}>
              {(template as any).createdBy?.name?.charAt(0) || 'U'}
            </Avatar>
            <Typography variant="caption" color="text.secondary">
              {(template as any).createdBy?.name || 'Unknown'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderSkeletonCards = () => (
    <Grid container spacing={2}>
      {Array.from({ length: 8 }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Skeleton variant="text" height={24} />
              <Skeleton variant="text" height={20} />
              <Skeleton variant="text" height={20} />
              <Skeleton variant="rectangular" height={60} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">{title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            </Box>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Search and Filters */}
          <Paper sx={{ p: 2, m: 2, mb: 0 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
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
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    label="Category"
                  >
                    <MenuItem value="ALL">All Categories</MenuItem>
                    {Object.values(TemplateCategory).map((category) => (
                      <MenuItem key={category} value={category}>
                        {category.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Industry</InputLabel>
                  <Select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    label="Industry"
                  >
                    <MenuItem value="ALL">All Industries</MenuItem>
                    {Object.values(TemplateIndustry).map((industry) => (
                      <MenuItem key={industry} value={industry}>
                        {industry.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
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
            </Grid>
          </Paper>

          {/* Tabs */}
          {!showFavoritesOnly && !showUserTemplatesOnly && (
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mx: 2 }}>
              <Tabs value={tabValue} onChange={(__e, newValue) => setTabValue(newValue)}>
                <Tab label="All Templates" />
                <Tab label="My Templates" />
                <Tab label="Favorites" />
                <Tab label="Popular" />
                <Tab label="Recent" />
              </Tabs>
            </Box>
          )}

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          )}

          {/* Templates Grid */}
          <Box sx={{ p: 2, minHeight: 400, maxHeight: 600, overflow: 'auto' }}>
            {loading ? (
              renderSkeletonCards()
            ) : (
              <Grid container spacing={2}>
                {getCurrentTemplates().map(renderTemplateCard)}
              </Grid>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          {multiSelect && selectedTemplates.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 'auto' }}>
              <Typography variant="body2">
                {selectedTemplates.length} selected
              </Typography>
              <Button onClick={() => setSelectedTemplates([])}>
                Clear
              </Button>
            </Box>
          )}
          <Button onClick={onClose}>Cancel</Button>
          {multiSelect && (
            <Button 
              onClick={handleMultiSelect} 
              variant="contained"
              disabled={selectedTemplates.length === 0}
            >
              Use Selected ({selectedTemplates.length})
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Preview: {previewTemplate?.name}
        </DialogTitle>
        <DialogContent>
          <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 400, overflow: 'auto' }}>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {previewContent}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          {previewTemplate && (
            <Button 
              onClick={() => {
                handleTemplateSelect(previewTemplate);
                setPreviewDialogOpen(false);
              }} 
              variant="contained"
            >
              Use This Template
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Use Template Dialog */}
      <Dialog open={useTemplateDialogOpen} onClose={() => setUseTemplateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Configure Template: {processingTemplate?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Fill in the variables below to customize your template:
          </Typography>
          
          <Grid container spacing={2}>
            {(processingTemplate as any)?.variables?.map((variable: any) => (
              <Grid item xs={12} md={6} key={variable.id}>
                {variable.type === 'SELECT' ? (
                  <FormControl fullWidth>
                    <InputLabel>{variable.label}</InputLabel>
                    <Select
                      value={variableValues[variable.name] || ''}
                      onChange={(e) => setVariableValues(prev => ({ ...prev, [variable.name]: e.target.value }))}
                      label={variable.label}
                    >
                      {variable.options?.map((option: any) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    label={variable.label}
                    value={variableValues[variable.name] || ''}
                    onChange={(e) => setVariableValues(prev => ({ ...prev, [variable.name]: e.target.value }))}
                    placeholder={variable.placeholder}
                    required={variable.required}
                    multiline={variable.type === 'TEXT' && variable.name.includes('description')}
                    rows={variable.type === 'TEXT' && variable.name.includes('description') ? 3 : 1}
                    helperText={variable.description}
                  />
                )}
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUseTemplateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUseTemplate} variant="contained">
            Use Template
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TemplateSelector;
