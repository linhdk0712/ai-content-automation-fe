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
  MenuItem,
  Alert as MuiAlert,
  Select,
  Slider,
  Snackbar,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useState, useMemo } from 'react';
import { useContentGeneration } from '../../hooks/useContentGeneration';
import { useTemplates } from '../../hooks/useTemplates';
import { contentService } from '../../services/content.service';
import { triggerAiAvatarWorkflow } from '../../services/n8n.service';
import { ContentType } from '../../types/api.types';
import {
  ContentTypeSelect,
  IndustrySelect,
  LanguageSelect,
  TargetAudienceSelect,
  ToneSelect
} from '../common/ListOfValuesSelect';
import AIProviderSelector from './AIProviderSelector';
import ContentPreview from './ContentPreview';
import GenerationHistory from './GenerationHistory';
import TemplateLibrary from './TemplateLibrary';

interface ContentCreatorProps {
  workspaceId?: string;
}

const ContentCreator: React.FC<ContentCreatorProps> = ({ workspaceId }) => {
  const [prompt, setPrompt] = useState('');
  const [industry, setIndustry] = useState('');
  const [contentType, setContentType] = useState('');
  const [language, setLanguage] = useState('vi');
  const [tone, setTone] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
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
    loadTemplates } = useTemplates();

  const [isTriggering, setIsTriggering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingToBackend, setIsSendingToBackend] = useState(false);
  const [lastContentId, setLastContentId] = useState<number | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info'>('info');

  // // Removed hardcoded arrays - now using List of Values system
  //   { value: 'de', label: 'German' },
  //   { value: 'zh', label: 'Chinese' },
  //   { value: 'ja', label: 'Japanese' },
  //   { value: 'ko', label: 'Korean' }
  // ];

  const optimizationOptions = [
    { value: 'QUALITY', label: 'Highest Quality', description: 'Best AI models for premium results' },
    { value: 'COST', label: 'Cost Effective', description: 'Optimize for lowest cost' },
    { value: 'SPEED', label: 'Fastest Response', description: 'Prioritize quick generation' },
    { value: 'BALANCED', label: 'Balanced', description: 'Good balance of quality, cost, and speed' }
  ];

  // Debounce template loading to avoid excessive API calls
  const debouncedFilters = useMemo(() => ({ industry, contentType }), [industry, contentType]);

  useEffect(() => {
    // Only load templates if we have at least one filter value
    if (debouncedFilters.industry || debouncedFilters.contentType) {
      // Add a small delay to debounce rapid changes
      const timeoutId = setTimeout(() => {
        loadTemplates({ 
          industry: debouncedFilters.industry, 
          contentType: debouncedFilters.contentType, 
          limit: 10 
        });
      }, 300);

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilters.industry, debouncedFilters.contentType]);

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
      tone,
      targetAudience,
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

  useEffect(() => {
    // Set content ID after successful generation
    if (generationResult?.success) {
      // Some providers/responses may not return a persisted contentId yet.
      // Fallback to 0 to allow sending raw content to workflow.
      const maybeId = (generationResult as any)?.contentId ?? 0;
      setLastContentId(maybeId);
    }
  }, [generationResult]);

  const handleSendToWorkflow = async () => {
    if (!generationResult?.content) return;

    setIsTriggering(true);
    try {
      const contentData = {
        title: generationResult?.title,
        content: generationResult?.content,
        metadata: generationResult,
        industry,
        contentType,
        language
      };
      const run = await triggerAiAvatarWorkflow(lastContentId ?? 0, contentData);
      setToastSeverity('success');
      setToastMsg('Sent to AI Avatar workflow successfully!');
      setToastOpen(true);

      // Navigate to workflow run page after a short delay
      setTimeout(() => {
        window.location.href = `/workflows/run/${run.id}`;
      }, 1500);
    } catch (e) {
      setToastSeverity('error');
      setToastMsg('Failed to send to workflow');
      setToastOpen(true);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!generationResult?.content) return;

    setIsSaving(true);
    try {
      const saved = await contentService.createContent({
        title: generationResult?.title || 'Untitled',
        textContent: generationResult?.content,
        contentType: ContentType.TEXT,
        industry,
        language,
        fromAiGeneration: true,
        aiProvider: generationResult?.provider,
        metadata: generationResult,
      });
      setLastContentId(saved?.id ?? 0);
      setToastSeverity('success');
      setToastMsg('Content saved to library successfully!');
      setToastOpen(true);

      // Navigate to content library after a short delay
      setTimeout(() => {
        window.location.href = `/content/library`;
      }, 1500);
    } catch (e) {
      setToastSeverity('error');
      setToastMsg('Failed to save content');
      setToastOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendToBackend = async () => {
    if (!generationResult?.content) return;

    setIsSendingToBackend(true);
    try {
      // Simulate backend API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setToastSeverity('success');
      setToastMsg('Content sent to backend successfully!');
      setToastOpen(true);
    } catch (e) {
      setToastSeverity('error');
      setToastMsg('Failed to send content to backend');
      setToastOpen(true);
    } finally {
      setIsSendingToBackend(false);
    }
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
    <Box
      className="content-creator-layout"
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        gap: 3,
        alignItems: 'flex-start',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '100%',
      }}
    >
      {/* Left Panel - Input Form */}
      <Box
        className="content-creator-form"
        sx={{
          flex: { lg: '0 0 500px' },
          width: { xs: '100%', lg: '500px' },
          maxWidth: '100%'
        }}
      >
        <Card sx={{
          height: 'fit-content',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden'
        }}>
          <Box sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 3,
            mb: 0
          }}>
            <Typography variant="h6" sx={{
              fontWeight: 600,
              mb: 0.5
            }}>
              Content Generation
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Create AI-powered content with advanced customization
            </Typography>
          </Box>
          <CardContent sx={{ p: 3, pt: 3 }}>

            {/* Template Selection */}
            {selectedTemplate && (
              <Alert
                severity="info"
                onClose={handleClearTemplate}
                sx={{ mb: 3, borderRadius: 2 }}
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
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              helperText={`${prompt.length}/2000 characters`}
              inputProps={{ maxLength: 2000 }}
            />

            {/* Industry and Content Type */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                Content Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <IndustrySelect
                    value={industry}
                    onChange={(value) => setIndustry(value as string)}
                    placeholder="Select industry"
                    showIcons={true}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ContentTypeSelect
                    value={contentType}
                    onChange={(value) => setContentType(value as string)}
                    placeholder="Select content type"
                    showIcons={true}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Language and Tone */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                Style & Language
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <LanguageSelect
                    value={language}
                    onChange={(value) => setLanguage(value as string)}
                    showIcons={true}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ToneSelect
                    value={tone}
                    onChange={(value) => setTone(value as string)}
                    placeholder="Select tone"
                    showIcons={true}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Target Audience */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                Target Audience
              </Typography>
              <TargetAudienceSelect
                value={targetAudience}
                onChange={(value) => setTargetAudience(value as string)}
                placeholder="Select target audience"
                showIcons={true}
              />
            </Box>

            {/* Optimization Criteria */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                Optimization
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={optimizationCriteria}
                  onChange={(e) => setOptimizationCriteria(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 2,
                    backgroundColor: 'background.paper',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'background.paper',
                      boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        border: '1px solid',
                        borderColor: 'divider',
                        mt: 0.5,
                        '& .MuiMenuItem-root': {
                          borderRadius: 1,
                          mx: 0.5,
                          my: 0.25,
                          minHeight: 56,
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Select optimization
                    </Typography>
                  </MenuItem>
                  {optimizationOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ py: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.25 }}>
                          {option.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                          {option.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* AI Provider Selection */}
            <Box sx={{ mb: 4 }}>
              <AIProviderSelector
                selectedProvider={selectedProvider}
                onProviderSelect={setSelectedProvider}
                optimizationCriteria={optimizationCriteria}
              />
            </Box>

            {/* Advanced Settings */}
            <Box sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              pt: 3,
              mt: 3
            }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showAdvancedSettings}
                    onChange={(e) => setShowAdvancedSettings(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    Advanced Settings
                  </Typography>
                }
                sx={{ mb: 2 }}
              />
            </Box>

            {showAdvancedSettings && (
              <Box sx={{
                mb: 3,
                p: 3,
                bgcolor: 'grey.50',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
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
                  sx={{ mb: 3 }}
                />

                <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
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
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {generationError}
              </Alert>
            )}

            {/* Generate Button */}
            <Box sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              pt: 3,
              mt: 3
            }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                startIcon={isGenerating ? <CircularProgress size={20} /> : <AutoAwesome />}
                sx={{
                  mb: 3,
                  py: 2,
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    boxShadow: '0 6px 24px rgba(102, 126, 234, 0.5)',
                    transform: 'translateY(-1px)',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #ccc 0%, #999 100%)',
                    boxShadow: 'none',
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {isGenerating ? 'Generating Content...' : 'Generate Content'}
              </Button>

              {/* Quick Actions */}
              <Box sx={{
                display: 'flex',
                gap: 1.5,
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <Chip
                  label="📝 Use Template"
                  onClick={() => setActiveTab('templates')}
                  variant="outlined"
                  size="medium"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: 'primary.50',
                      borderColor: 'primary.main',
                    }
                  }}
                />
                <Chip
                  label="📊 View History"
                  onClick={() => setActiveTab('history')}
                  variant="outlined"
                  size="medium"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: 'primary.50',
                      borderColor: 'primary.main',
                    }
                  }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Right Panel - Preview */}
      <Box
        className="content-creator-preview"
        sx={{
          flex: 1,
          width: { xs: '100%', lg: 'auto' },
          maxWidth: '100%',
          minWidth: 0
        }}
      >
        <ContentPreview
          content={generationResult?.content}
          title={generationResult?.title}
          isGenerating={isGenerating}
          metadata={generationResult}
          onSendToWorkflow={handleSendToWorkflow}
          onSaveToLibrary={handleSaveToLibrary}
          onSendToBackend={handleSendToBackend}
          isProcessingWorkflow={isTriggering}
          isSaving={isSaving}
          isSendingToBackend={isSendingToBackend}
        />
      </Box>
    </Box>
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
    <Box sx={{
      width: '100%',
      maxWidth: '100%',
      mx: 'auto'
    }}>
      {/* Tab Navigation */}
      <Box sx={{
        mb: 5,
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 1.5,
        p: 1.5,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Button
          variant={activeTab === 'create' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('create')}
          startIcon={<AutoAwesome />}
          sx={{
            minWidth: { xs: '100px', sm: '120px' },
            borderRadius: 2
          }}
        >
          Create
        </Button>
        <Button
          variant={activeTab === 'templates' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('templates')}
          startIcon={<Settings />}
          sx={{
            minWidth: { xs: '100px', sm: '120px' },
            borderRadius: 2
          }}
        >
          Templates
        </Button>
        <Button
          variant={activeTab === 'history' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('history')}
          startIcon={<History />}
          sx={{
            minWidth: { xs: '100px', sm: '120px' },
            borderRadius: 2
          }}
        >
          History
        </Button>
      </Box>

      {/* Tab Content */}
      <Box sx={{ width: '100%' }}>
        {activeTab === 'create' && renderCreateTab()}
        {activeTab === 'templates' && renderTemplatesTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </Box>



      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert elevation={6} variant="filled" onClose={() => setToastOpen(false)} severity={toastSeverity}>
          {toastMsg}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default ContentCreator;