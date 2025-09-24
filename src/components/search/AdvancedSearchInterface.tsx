import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  Button,
  Autocomplete,
  Card,
  CardContent,
  CardActions,
  Grid,
  Badge,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Rating,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Search,
  Clear,
  ExpandMore,
  Sort,
  ViewList,
  ViewModule,
  History,
  TrendingUp,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { debounce } from 'lodash';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'content' | 'template' | 'media' | 'user' | 'workspace';
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  rating?: number;
  views: number;
  likes: number;
  thumbnail?: string;
  metadata: Record<string, any>;
}

interface SearchFilter {
  id: string;
  name: string;
  type: 'checkbox' | 'range' | 'date' | 'select' | 'multiselect';
  options?: Array<{ value: string; label: string; count?: number }>;
  min?: number;
  max?: number;
  value?: any;
}

interface SearchFacet {
  id: string;
  name: string;
  filters: SearchFilter[];
  expanded: boolean;
}

interface AdvancedSearchInterfaceProps {
  onSearch?: (query: string, filters: Record<string, any>) => void;
  onResultClick?: (result: SearchResult) => void;
  searchResults?: SearchResult[];
  facets?: SearchFacet[];
  suggestions?: string[];
  recentSearches?: string[];
  trendingSearches?: string[];
  loading?: boolean;
  totalResults?: number;
  placeholder?: string;
}

const SearchContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  height: '100vh',
  backgroundColor: theme.palette.background.default,
}));

const SearchSidebar = styled(Paper)(({ theme }) => ({
  width: 320,
  padding: theme.spacing(2),
  overflowY: 'auto',
  height: 'fit-content',
  maxHeight: '100vh',
}));

const SearchMainArea = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const SearchBar = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  position: 'sticky',
  top: 0,
  zIndex: 100,
  backgroundColor: theme.palette.background.paper,
}));

const ResultsContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(0, 2),
}));

const ResultCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const SuggestionsList = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  zIndex: 1000,
  maxHeight: 300,
  overflowY: 'auto',
  marginTop: theme.spacing(0.5),
}));

const FilterChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.25),
}));

export const AdvancedSearchInterface: React.FC<AdvancedSearchInterfaceProps> = ({
  onSearch,
  onResultClick,
  searchResults = [],
  facets = [],
  suggestions = [],
  recentSearches = [],
  trendingSearches = [],
  loading = false,
  totalResults = 0,
  placeholder = "Search content, templates, media...",
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [expandedFacets, setExpandedFacets] = useState<Set<string>>(new Set(['type', 'category']));
  const [searchHistory, setSearchHistory] = useState<string[]>(recentSearches);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string, filters: Record<string, any>) => {
      onSearch?.(searchQuery, filters);
    }, 300),
    [onSearch]
  );

  // Handle search input change
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setShowSuggestions(value.length > 0);
    debouncedSearch(value, activeFilters);
  }, [activeFilters, debouncedSearch]);

  // Handle filter change
  const handleFilterChange = useCallback((filterId: string, value: any) => {
    const newFilters = { ...activeFilters };
    
    if (value === null || value === undefined || value === '' || 
        (Array.isArray(value) && value.length === 0)) {
      delete newFilters[filterId];
    } else {
      newFilters[filterId] = value;
    }
    
    setActiveFilters(newFilters);
    debouncedSearch(query, newFilters);
  }, [activeFilters, query, debouncedSearch]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    
    // Add to search history
    const newHistory = [suggestion, ...searchHistory.filter(h => h !== suggestion)].slice(0, 10);
    setSearchHistory(newHistory);
    
    debouncedSearch(suggestion, activeFilters);
  }, [searchHistory, activeFilters, debouncedSearch]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
    debouncedSearch(query, {});
  }, [query, debouncedSearch]);

  // Toggle facet expansion
  const toggleFacet = useCallback((facetId: string) => {
    const newExpanded = new Set(expandedFacets);
    if (newExpanded.has(facetId)) {
      newExpanded.delete(facetId);
    } else {
      newExpanded.add(facetId);
    }
    setExpandedFacets(newExpanded);
  }, [expandedFacets]);

  // Render filter component based on type
  const renderFilter = useCallback((filter: SearchFilter) => {
    const value = activeFilters[filter.id];

    switch (filter.type) {
      case 'checkbox':
        return (
          <FormGroup>
            {filter.options?.map((option) => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    checked={Array.isArray(value) ? value.includes(option.value) : false}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      const newValues = e.target.checked
                        ? [...currentValues, option.value]
                        : currentValues.filter(v => v !== option.value);
                      handleFilterChange(filter.id, newValues);
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>{option.label}</span>
                    {option.count && (
                      <Badge badgeContent={option.count} color="primary" />
                    )}
                  </Box>
                }
              />
            ))}
          </FormGroup>
        );

      case 'range':
        return (
          <Box sx={{ px: 1 }}>
            <Slider
              value={value || [filter.min || 0, filter.max || 100]}
              onChange={(_, newValue) => handleFilterChange(filter.id, newValue)}
              valueLabelDisplay="auto"
              min={filter.min || 0}
              max={filter.max || 100}
              marks={[
                { value: filter.min || 0, label: filter.min?.toString() || '0' },
                { value: filter.max || 100, label: filter.max?.toString() || '100' },
              ]}
            />
          </Box>
        );

      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <DatePicker
                label="From"
                value={value?.from || null}
                onChange={(date) => handleFilterChange(filter.id, { ...value, from: date })}
                slotProps={{ textField: { size: 'small' } }}
              />
              <DatePicker
                label="To"
                value={value?.to || null}
                onChange={(date) => handleFilterChange(filter.id, { ...value, to: date })}
                slotProps={{ textField: { size: 'small' } }}
              />
            </Box>
          </LocalizationProvider>
        );

      case 'select':
        return (
          <Autocomplete
            options={filter.options || []}
            getOptionLabel={(option) => option.label}
            value={filter.options?.find(o => o.value === value) || null}
            onChange={(_, newValue) => handleFilterChange(filter.id, newValue?.value)}
            renderInput={(params) => <TextField {...params} size="small" />}
            size="small"
          />
        );

      case 'multiselect':
        return (
          <Autocomplete
            multiple
            options={filter.options || []}
            getOptionLabel={(option) => option.label}
            value={filter.options?.filter(o => Array.isArray(value) && value.includes(o.value)) || []}
            onChange={(_, newValues) => handleFilterChange(filter.id, newValues.map(v => v.value))}
            renderInput={(params) => <TextField {...params} size="small" />}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => (
                <FilterChip
                  {...getTagProps({ index })}
                  key={option.value}
                  label={option.label}
                  size="small"
                />
              ))
            }
            size="small"
          />
        );

      default:
        return null;
    }
  }, [activeFilters, handleFilterChange]);

  // Render search result
  const renderResult = useCallback((result: SearchResult) => {
    return (
      <ResultCard key={result.id} onClick={() => onResultClick?.(result)}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {result.thumbnail && (
              <Box
                component="img"
                src={result.thumbnail}
                sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1 }}
              />
            )}
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                {result.title}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                {result.description}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip label={result.type} size="small" color="primary" />
                <Chip label={result.category} size="small" variant="outlined" />
                {result.rating && (
                  <Rating value={result.rating} size="small" readOnly />
                )}
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Avatar src={result.author.avatar} sx={{ width: 20, height: 20 }}>
                    {result.author.name.charAt(0)}
                  </Avatar>
                  <Typography variant="caption">{result.author.name}</Typography>
                </Box>
                
                <Typography variant="caption" color="textSecondary">
                  {result.views} views • {result.likes} likes
                </Typography>
                
                <Typography variant="caption" color="textSecondary">
                  {result.updatedAt.toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
        
        {result.tags.length > 0 && (
          <CardActions sx={{ pt: 0 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {result.tags.slice(0, 5).map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQueryChange(tag);
                  }}
                />
              ))}
              {result.tags.length > 5 && (
                <Chip label={`+${result.tags.length - 5} more`} size="small" variant="outlined" />
              )}
            </Box>
          </CardActions>
        )}
      </ResultCard>
    );
  }, [onResultClick, handleQueryChange]);

  return (
    <SearchContainer>
      {/* Search Sidebar */}
      <SearchSidebar>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        
        {Object.keys(activeFilters).length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">Active Filters</Typography>
              <Button size="small" onClick={clearAllFilters}>
                Clear All
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {Object.entries(activeFilters).map(([key, value]) => (
                <FilterChip
                  key={key}
                  label={`${key}: ${Array.isArray(value) ? value.join(', ') : value}`}
                  onDelete={() => handleFilterChange(key, null)}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}
        
        {facets.map((facet) => (
          <Accordion
            key={facet.id}
            expanded={expandedFacets.has(facet.id)}
            onChange={() => toggleFacet(facet.id)}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle2">{facet.name}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {facet.filters.map((filter) => (
                <Box key={filter.id} sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    {filter.name}
                  </Typography>
                  {renderFilter(filter)}
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
        
        {/* Search History */}
        {searchHistory.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              <History sx={{ mr: 1, verticalAlign: 'middle' }} />
              Recent Searches
            </Typography>
            <List dense>
              {searchHistory.slice(0, 5).map((search, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => handleSuggestionClick(search)}
                >
                  <ListItemText primary={search} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
        
        {/* Trending Searches */}
        {trendingSearches.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
              Trending
            </Typography>
            <List dense>
              {trendingSearches.slice(0, 5).map((search, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => handleSuggestionClick(search)}
                >
                  <ListItemText primary={search} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </SearchSidebar>

      {/* Main Search Area */}
      <SearchMainArea>
        {/* Search Bar */}
        <SearchBar>
          <Box sx={{ position: 'relative' }}>
            <TextField
              fullWidth
              placeholder={placeholder}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => setShowSuggestions(query.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: query && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => handleQueryChange('')}>
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            {/* Suggestions Dropdown */}
            <Collapse in={showSuggestions && suggestions.length > 0}>
              <SuggestionsList>
                <List>
                  {suggestions.slice(0, 8).map((suggestion, index) => (
                    <ListItem
                      key={index}
                      button
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <ListItemIcon>
                        <Search />
                      </ListItemIcon>
                      <ListItemText primary={suggestion} />
                    </ListItem>
                  ))}
                </List>
              </SuggestionsList>
            </Collapse>
          </Box>
          
          {/* Search Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              {totalResults.toLocaleString()} results found
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                startIcon={<Sort />}
                onClick={(e) => {
                  // Handle sort menu
                }}
                size="small"
              >
                Sort: {sortBy}
              </Button>
              
              <IconButton
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                size="small"
              >
                {viewMode === 'list' ? <ViewModule /> : <ViewList />}
              </IconButton>
            </Box>
          </Box>
        </SearchBar>

        {/* Results */}
        <ResultsContainer>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>Searching...</Typography>
            </Box>
          ) : searchResults.length > 0 ? (
            <Grid container spacing={viewMode === 'grid' ? 2 : 0}>
              {searchResults.map((result) => (
                <Grid item xs={12} md={viewMode === 'grid' ? 6 : 12} key={result.id}>
                  {renderResult(result)}
                </Grid>
              ))}
            </Grid>
          ) : query ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                No results found
              </Typography>
              <Typography color="textSecondary">
                Try adjusting your search terms or filters
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                Start searching
              </Typography>
              <Typography color="textSecondary">
                Enter keywords to find content, templates, and more
              </Typography>
            </Box>
          )}
        </ResultsContainer>
      </SearchMainArea>
    </SearchContainer>
  );
};

export default AdvancedSearchInterface;