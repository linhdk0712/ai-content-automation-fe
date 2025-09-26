import React, { useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Button,
  Alert,
  Chip,
  Stack,
} from '@mui/material'
import {
  ListOfValuesSelect,
  SocialPlatformSelect,
  TemplateCategorySelect,
  ContentTypeSelect,
  AIProviderSelect,
  LanguageSelect,
  CountrySelect,
} from '../common/ListOfValuesSelect'
import {
  ListOfValuesAutocomplete,
  SocialPlatformAutocomplete,
  TemplateCategoryAutocomplete,
  IndustryAutocomplete,
  ToneAutocomplete,
} from '../common/ListOfValuesAutocomplete'
import {
  useAvailableCategories,
  useBulkListOfValues,
  useSearchListOfValues,
} from '../../hooks/useListOfValues'

/**
 * Demo component showcasing the centralized List of Values system
 */
export const ListOfValuesDemo: React.FC = () => {
  // Form state
  const [formData, setFormData] = useState({
    socialPlatform: '',
    socialPlatforms: [] as string[],
    templateCategory: '',
    contentType: '',
    aiProvider: '',
    language: 'vi',
    country: '',
    industry: '',
    tone: '',
    targetAudiences: [] as string[],
  })

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Hooks for demo
  const { data: categories, isLoading: categoriesLoading } = useAvailableCategories()
  const { data: bulkData, isLoading: bulkLoading } = useBulkListOfValues([
    'social-platforms',
    'template-categories',
    'content-types',
  ])
  const { data: searchResults, isLoading: searchLoading } = useSearchListOfValues(
    searchQuery,
    undefined,
    { enabled: searchQuery.length >= 2 }
  )

  const handleFormChange = (field: string) => (value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleReset = () => {
    setFormData({
      socialPlatform: '',
      socialPlatforms: [],
      templateCategory: '',
      contentType: '',
      aiProvider: '',
      language: 'vi',
      country: '',
      industry: '',
      tone: '',
      targetAudiences: [],
    })
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        List of Values Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        This demo showcases the centralized List of Values system for managing dropdown options across the application.
      </Typography>

      <Grid container spacing={3}>
        {/* Select Components Demo */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Select Components" />
            <CardContent>
              <Stack spacing={3}>
                <SocialPlatformSelect
                  label="Social Platform (Single)"
                  value={formData.socialPlatform}
                  onChange={handleFormChange('socialPlatform')}
                  placeholder="Choose a platform"
                />

                <SocialPlatformSelect
                  label="Social Platforms (Multiple)"
                  value={formData.socialPlatforms}
                  onChange={handleFormChange('socialPlatforms')}
                  multiple
                  placeholder="Choose platforms"
                />

                <TemplateCategorySelect
                  label="Template Category"
                  value={formData.templateCategory}
                  onChange={handleFormChange('templateCategory')}
                />

                <ContentTypeSelect
                  label="Content Type"
                  value={formData.contentType}
                  onChange={handleFormChange('contentType')}
                />

                <AIProviderSelect
                  label="AI Provider"
                  value={formData.aiProvider}
                  onChange={handleFormChange('aiProvider')}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Autocomplete Components Demo */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Autocomplete Components" />
            <CardContent>
              <Stack spacing={3}>
                <LanguageSelect
                  label="Language"
                  value={formData.language}
                  onChange={handleFormChange('language')}
                />

                <CountrySelect
                  label="Country"
                  value={formData.country}
                  onChange={handleFormChange('country')}
                />

                <IndustryAutocomplete
                  label="Industry"
                  value={formData.industry}
                  onChange={handleFormChange('industry')}
                  returnFullObject={false}
                />

                <ToneAutocomplete
                  label="Tone"
                  value={formData.tone}
                  onChange={handleFormChange('tone')}
                  returnFullObject={false}
                />

                <ListOfValuesAutocomplete
                  category="target-audiences"
                  label="Target Audiences"
                  value={formData.targetAudiences}
                  onChange={handleFormChange('targetAudiences')}
                  multiple
                  returnFullObject={false}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Available Categories */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Available Categories" />
            <CardContent>
              {categoriesLoading ? (
                <Typography>Loading categories...</Typography>
              ) : (
                <Stack spacing={1}>
                  {categories?.map(category => (
                    <Chip
                      key={category}
                      label={category}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Bulk Data Demo */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Bulk Data Loading" />
            <CardContent>
              {bulkLoading ? (
                <Typography>Loading bulk data...</Typography>
              ) : (
                <Stack spacing={2}>
                  {Object.entries(bulkData || {}).map(([category, values]) => (
                    <Box key={category}>
                      <Typography variant="subtitle2" gutterBottom>
                        {category} ({values.length} items)
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {values.slice(0, 3).map(value => (
                          <Chip
                            key={value.value}
                            label={value.displayLabel || value.label}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {values.length > 3 && (
                          <Chip
                            label={`+${values.length - 3} more`}
                            size="small"
                            variant="outlined"
                            color="secondary"
                          />
                        )}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Search Demo */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Search Functionality" />
            <CardContent>
              <Stack spacing={2}>
                <input
                  type="text"
                  placeholder="Search values..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    width: '100%',
                  }}
                />

                {searchLoading && <Typography>Searching...</Typography>}

                {searchResults && Object.keys(searchResults).length > 0 && (
                  <Stack spacing={1}>
                    {Object.entries(searchResults).map(([category, values]) => (
                      <Box key={category}>
                        <Typography variant="subtitle2" gutterBottom>
                          {category}
                        </Typography>
                        <Stack spacing={0.5}>
                          {values.map(value => (
                            <Chip
                              key={`${category}-${value.value}`}
                              label={value.displayLabel || value.label}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}

                {searchQuery.length >= 2 && searchResults && Object.keys(searchResults).length === 0 && (
                  <Typography color="text.secondary">No results found</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Form Values */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Current Form Values" 
              action={
                <Button onClick={handleReset} variant="outlined" size="small">
                  Reset
                </Button>
              }
            />
            <CardContent>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '16px', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '14px',
              }}>
                {JSON.stringify(formData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </Grid>

        {/* Usage Instructions */}
        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="h6" gutterBottom>
              How to Use
            </Typography>
            <Typography variant="body2" paragraph>
              1. <strong>Import components:</strong> Use pre-built components like SocialPlatformSelect, TemplateCategorySelect, etc.
            </Typography>
            <Typography variant="body2" paragraph>
              2. <strong>Custom categories:</strong> Use ListOfValuesSelect or ListOfValuesAutocomplete with any category name.
            </Typography>
            <Typography variant="body2" paragraph>
              3. <strong>Hooks:</strong> Use hooks like useListOfValues, useBulkListOfValues for custom implementations.
            </Typography>
            <Typography variant="body2">
              4. <strong>Caching:</strong> All data is automatically cached using React Query for optimal performance.
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ListOfValuesDemo