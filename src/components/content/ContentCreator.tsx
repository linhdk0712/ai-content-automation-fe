import { AutoAwesome, History, Settings } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useContentGeneration } from '../../hooks/useContentGeneration';
import { useTemplates } from '../../hooks/useTemplates';
import AIProviderSelector from './AIProviderSelector';
import ContentPreview from './ContentPreview';
import GenerationHistory from './GenerationHistory';
import TemplateLibrary from './TemplateLibrary';

interface ContentCreatorProps {
  workspaceId?: string;
}

const ContentCreator: React.FC<ContentCreatorProps> = ({ workspaceId }) => {
  const [prompt, setPrompt] = useState('');
  const [industry, setIndustry] = useState('Marketing');
  const [contentType, setContentType] = useState('TEXT');
  const [language, setLanguage] = useState('en');
  const [maxTokens, setMaxTokens] = useState(500);
  const [temperature, setTemperature] = useState(0.7);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [optimizationCriteria, setOptimizationCriteria] = useState('BALANCED');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('create');

  const {
    generateContent,
    isGenerating,
    generationResult,
    error: generationError,
    clearError
  } = useContentGeneration();

  const {
    loadTemplates  } = useTemplates();

  const industries = [
    'Marketing',
    'E-commerce',
    'Healthcare',
    'Education',
    'Technology',
    'Finance',
    'Real Estate',
    'Food & Beverage'
  ];

  const contentTypes = [
    { value: 'TEXT', label: 'General Text' },
    { value: 'MARKETING', label: 'Marketing Content' },
    { value: 'TECHNICAL', label: 'Technical Documentation' },
    { value: 'CREATIVE', label: 'Creative Writing' },
    { value: 'EDUCATIONAL', label: 'Educational Content' },
    { value: 'SOCIAL_MEDIA', label: 'Social Media Post' },
    { value: 'EMAIL', label: 'Email Content' },
    { value: 'BLOG', label: 'Blog Article' }
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'vi', label: 'Vietnamese' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' }
  ];

  const optimizationOptions = [
    { value: 'QUALITY', label: 'Highest Quality', description: 'Best AI models for premium results' },
    { value: 'COST', label: 'Cost Effective', description: 'Optimize for lowest cost' },
    { value: 'SPEED', label: 'Fastest Response', description: 'Prioritize quick generation' },
    { value: 'BALANCED', label: 'Balanced', description: 'Good balance of quality, cost, and speed' }
  ];

  useEffect(() => {
    loadTemplates({ industry, contentType, limit: 10 });
  }, [industry, contentType, loadTemplates]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return;
    }

    clearError();

    const request = {
      prompt: prompt.trim(),
      industry,
      contentType,
      language,
      maxTokens,
      temperature,
      workspaceId,
      preferredProvider: selectedProvider || undefined,
      optimizationCriteria,
      templateId: selectedTemplate?.id,
      templateVariables: selectedTemplate?.variables,
      templateName: selectedTemplate?.name,
      templatePrompt: selectedTemplate?.prompt,
      templateIndustry: selectedTemplate?.industry,
      templateContentType: selectedTemplate?.contentType,
      templateLanguage: selectedTemplate?.language,
      templateTone: selectedTemplate?.tone,
      templateTargetAudience: selectedTemplate?.targetAudience,
      templateMediaUrls: selectedTemplate?.mediaUrls,
      templateThumbnailUrl: selectedTemplate?.thumbnailUrl,
      templateScheduledPublishTime: selectedTemplate?.scheduledPublishTime,
      templateMetadata: selectedTemplate?.metadata,
      templateTags: selectedTemplate?.tags,
      templateHashtags: selectedTemplate?.hashtags,
      templateSeoTitle: selectedTemplate?.seoTitle,
      templateSeoDescription: selectedTemplate?.seoDescription,
      templateKeywords: selectedTemplate?.keywords,
      aiProvider: selectedProvider,
      aiModel: selectedProvider,
      aiParameters: {
        temperature: temperature,
        maxTokens: maxTokens
      },
    };

    await generateContent(request);
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setPrompt(template.content || '');
    setIndustry(template.industry || industry);
    setContentType(template.contentType || contentType);
    setLanguage(template.language || language);
  };

  const handleClearTemplate = () => {
    setSelectedTemplate(null as any);
  };

  const renderCreateTab = () => (
    <Grid container spacing={3}>
      {/* Left Panel - Input Form */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Content Generation
            </Typography>

            {/* Template Selection */}
            {selectedTemplate && (
              <Alert 
                severity="info" 
                onClose={handleClearTemplate}
                sx={{ mb: 2 }}
              >
                Using template: <strong>{selectedTemplate.name}</strong>
              </Alert>
            )}

            {/* Main Prompt */}
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Content Prompt"
              placeholder="Describe what content you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              sx={{ mb: 2 }}
              helperText={`${prompt.length}/2000 characters`}
              inputProps={{ maxLength: 2000 }}
            />

            {/* Industry and Content Type */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Industry</InputLabel>
                  <Select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    label="Industry"
                  >
                    {industries.map((ind) => (
                      <MenuItem key={ind} value={ind}>
                        {ind}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Content Type</InputLabel>
                  <Select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    label="Content Type"
                  >
                    {contentTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Language */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Language</InputLabel>
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                label="Language"
              >
                {languages.map((lang) => (
                  <MenuItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Optimization Criteria */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Optimization</InputLabel>
              <Select
                value={optimizationCriteria}
                onChange={(e) => setOptimizationCriteria(e.target.value)}
                label="Optimization"
              >
                {optimizationOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box>
                      <Typography variant="body2">{option.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* AI Provider Selection */}
            <AIProviderSelector
              selectedProvider={selectedProvider}
              onProviderSelect={setSelectedProvider}
              optimizationCriteria={optimizationCriteria}
              sx={{ mb: 2 }}
            />

            {/* Advanced Settings */}
            <FormControlLabel
              control={
                <Switch
                  checked={showAdvancedSettings}
                  onChange={(e) => setShowAdvancedSettings(e.target.checked)}
                />
              }
              label="Advanced Settings"
              sx={{ mb: 1 }}
            />

            {showAdvancedSettings && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Max Tokens: {maxTokens}
                </Typography>
                <Slider
                  value={maxTokens}
                  onChange={(_, value) => setMaxTokens(value as number)}
                  min={50}
                  max={4000}
                  step={50}
                  marks={[
                    { value: 50, label: '50' },
                    { value: 500, label: '500' },
                    { value: 1000, label: '1K' },
                    { value: 2000, label: '2K' },
                    { value: 4000, label: '4K' }
                  ]}
                  sx={{ mb: 2 }}
                />

                <Typography variant="subtitle2" gutterBottom>
                  Temperature: {temperature}
                </Typography>
                <Slider
                  value={temperature}
                  onChange={(_, value) => setTemperature(value as number)}
                  min={0}
                  max={2}
                  step={0.1}
                  marks={[
                    { value: 0, label: 'Focused' },
                    { value: 0.7, label: 'Balanced' },
                    { value: 1.5, label: 'Creative' },
                    { value: 2, label: 'Random' }
                  ]}
                />
              </Box>
            )}

            {/* Error Display */}
            {generationError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {generationError}
              </Alert>
            )}

            {/* Generate Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              startIcon={isGenerating ? <CircularProgress size={20} /> : <AutoAwesome />}
              sx={{ mb: 2 }}
            >
              {isGenerating ? 'Generating...' : 'Generate Content'}
            </Button>

            {/* Quick Actions */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="Use Template"
                onClick={() => setActiveTab('templates')}
                variant="outlined"
                size="small"
              />
              <Chip
                label="View History"
                onClick={() => setActiveTab('history')}
                variant="outlined"
                size="small"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Right Panel - Preview */}
      <Grid item xs={12} md={6}>
        <ContentPreview
          content={generationResult?.content}
          title={generationResult?.title}
          isGenerating={isGenerating}
          metadata={generationResult}
        />
      </Grid>
    </Grid>
  );

  const renderTemplatesTab = () => (
    <TemplateLibrary
      industry={industry}
      contentType={contentType}
      language={language}
      onTemplateSelect={handleTemplateSelect}
      onBackToCreate={() => setActiveTab('create')}
    />
  );

  const renderHistoryTab = () => (
    <GenerationHistory
      onRegenerateContent={(historyEntry) => {
        setPrompt(historyEntry.prompt || '');
        setIndustry(historyEntry.industry || industry);
        setContentType(historyEntry.contentType || contentType);
        setActiveTab('create');
      }}
      onBackToCreate={() => setActiveTab('create')}
    />
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          AI Content Creator
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Generate high-quality content using advanced AI models
        </Typography>
      </Box>

      {/* Tab Navigation */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant={activeTab === 'create' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('create')}
          startIcon={<AutoAwesome />}
          sx={{ mr: 1 }}
        >
          Create
        </Button>
        <Button
          variant={activeTab === 'templates' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('templates')}
          startIcon={<Settings />}
          sx={{ mr: 1 }}
        >
          Templates
        </Button>
        <Button
          variant={activeTab === 'history' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('history')}
          startIcon={<History />}
        >
          History
        </Button>
      </Box>

      {/* Tab Content */}
      {activeTab === 'create' && renderCreateTab()}
      {activeTab === 'templates' && renderTemplatesTab()}
      {activeTab === 'history' && renderHistoryTab()}
    </Box>
  );
};

export default ContentCreator;