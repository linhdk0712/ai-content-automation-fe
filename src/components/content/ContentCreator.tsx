import { AutoAwesome, History, Settings } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Alert as MuiAlert,
  Select,
  Slider,
  Snackbar,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useContentGeneration } from '../../hooks/useContentGeneration';
import { useTemplates } from '../../hooks/useTemplates';
import { contentService } from '../../services/content.service';
import { triggerAiAvatarWorkflow } from '../../services/n8n.service';
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
    loadTemplates  } = useTemplates();

  const [offerTriggerOpen, setOfferTriggerOpen] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  useEffect(() => {
    // Offer sending to AI Avatar workflow after successful generation
    if (generationResult?.success) {
      // Some providers/responses may not return a persisted contentId yet.
      // Fallback to 0 to allow sending raw content to workflow.
      const maybeId = (generationResult as any)?.contentId ?? 0;
      setLastContentId(maybeId);
      setOfferTriggerOpen(true);
    }
  }, [generationResult]);

  const handleSendToWorkflow = async () => {
    // Allow triggering even when content isn't saved yet (use 0 as placeholder id)
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
      setOfferTriggerOpen(false);
      setToastSeverity('success');
      setToastMsg('Sent to AI Avatar workflow');
      setToastOpen(true);
      window.location.href = `/workflows/run/${run.id}`;
    } catch (e) {
      setOfferTriggerOpen(false);
      setToastSeverity('error');
      setToastMsg('Failed to send to workflow');
      setToastOpen(true);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!generationResult?.content) {
      setOfferTriggerOpen(false);
      return;
    }
    setIsSaving(true);
    try {
      const saved = await contentService.createContent({
        title: generationResult?.title || 'Untitled',
        textContent: generationResult?.content,
        contentType: 'TEXT' as any,
        industry,
        language,
        fromAiGeneration: true,
        aiProvider: generationResult?.provider,
        metadata: generationResult as any,
      } as any);
      setLastContentId(saved?.id ?? 0);
      setToastSeverity('success');
      setToastMsg('Saved to Content Library');
      setToastOpen(true);
      setOfferTriggerOpen(false);
      window.location.href = `/content/${saved.id}`;
    } catch (e) {
      setToastSeverity('error');
      setToastMsg('Failed to save content');
      setToastOpen(true);
      setOfferTriggerOpen(false);
    } finally {
      setIsSaving(false);
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
          borderColor: 'divider'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ 
              fontWeight: 600,
              color: 'primary.main',
              mb: 3
            }}>
              Content Generation
            </Typography>

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
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <IndustrySelect
                  label="Industry"
                  value={industry}
                  onChange={(value) => setIndustry(value as string)}
                  placeholder="Select industry"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <ContentTypeSelect
                  label="Content Type"
                  value={contentType}
                  onChange={(value) => setContentType(value as string)}
                  placeholder="Select content type"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>

            {/* Language and Tone */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <LanguageSelect
                  label="Language"
                  value={language}
                  onChange={(value) => setLanguage(value as string)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <ToneSelect
                  label="Tone"
                  value={tone}
                  onChange={(value) => setTone(value as string)}
                  placeholder="Select tone"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>

            {/* Target Audience */}
            <Box sx={{ mb: 3 }}>
              <TargetAudienceSelect
                label="Target Audience"
                value={targetAudience}
                onChange={(value) => setTargetAudience(value as string)}
                placeholder="Select target audience"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>

            {/* Optimization Criteria */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Optimization</InputLabel>
                  <Select
                    value={optimizationCriteria}
                    onChange={(e) => setOptimizationCriteria(e.target.value)}
                    label="Optimization"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="BALANCED">Balanced</MenuItem>
                    <MenuItem value="CREATIVE">Creative</MenuItem>
                    <MenuItem value="FACTUAL">Factual</MenuItem>
                    <MenuItem value="ENGAGING">Engaging</MenuItem>
                    ))
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Optimization</InputLabel>
                  <Select
                    value={optimizationCriteria}
                    onChange={(e) => setOptimizationCriteria(e.target.value)}
                    label="Optimization"
                    sx={{ borderRadius: 2 }}
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
              </Grid>
            </Grid>

            {/* AI Provider Selection */}
            <AIProviderSelector
              selectedProvider={selectedProvider}
              onProviderSelect={setSelectedProvider}
              optimizationCriteria={optimizationCriteria}
              sx={{ mb: 3 }}
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
              sx={{ mb: 2 }}
            />

            {showAdvancedSettings && (
              <Box sx={{ 
                mb: 3, 
                p: 3, 
                bgcolor: 'grey.50', 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
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

                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
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
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              startIcon={isGenerating ? <CircularProgress size={20} /> : <AutoAwesome />}
              sx={{ 
                mb: 3,
                py: 1.5,
                borderRadius: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                }
              }}
            >
              {isGenerating ? 'Generating...' : 'Generate Content'}
            </Button>

            {/* Quick Actions */}
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              <Chip
                label="Use Template"
                onClick={() => setActiveTab('templates')}
                variant="outlined"
                size="small"
                sx={{ borderRadius: 2 }}
              />
              <Chip
                label="View History"
                onClick={() => setActiveTab('history')}
                variant="outlined"
                size="small"
                sx={{ borderRadius: 2 }}
              />
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

      <Dialog open={offerTriggerOpen} onClose={() => setOfferTriggerOpen(false)}>
        <DialogTitle>Send to AI Avatar Workflow?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your content is ready. Do you want to send it to the AI Avatar workflow in n8n to generate voice and video automatically?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
        <Button onClick={() => setOfferTriggerOpen(false)} disabled={isTriggering || isSaving}>Not now</Button>
        <Button onClick={handleSaveToLibrary} disabled={isTriggering || isSaving}>
          {isSaving ? 'Saving…' : 'Save to Library'}
        </Button>
        <Button variant="contained" onClick={handleSendToWorkflow} disabled={isTriggering || isSaving}>
            {isTriggering ? 'Sending…' : 'Send to Workflow'}
          </Button>
        </DialogActions>
      </Dialog>

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