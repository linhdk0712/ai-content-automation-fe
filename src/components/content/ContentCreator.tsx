import { AutoAwesome, History, Settings } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Alert as MuiAlert,
  Snackbar,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useContentGeneration } from '../../hooks/useContentGeneration';
import { useTemplates } from '../../hooks/useTemplates';
import { contentService } from '../../services/content.service';
import { triggerAiAvatarWorkflow } from '../../services/n8n.service';
import { generateContentId } from '../../utils/uuid';
import { ContentType } from '../../types/api.types';
import { useI18n } from '../../hooks/useI18n';
import {
  ContentTypeSelect,
  IndustrySelect,
  LanguageSelect,
  TargetAudienceSelect,
  ToneSelect
} from '../common/ListOfValuesSelect';

import ContentPreview from './ContentPreview';
import GenerationHistory from './GenerationHistory';
import TemplateLibrary from './TemplateLibrary';

interface ContentCreatorProps {
  workspaceId?: string;
}

const ContentCreator: React.FC<ContentCreatorProps> = ({ workspaceId }) => {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState('');
  const [industry, setIndustry] = useState('');
  const [contentType, setContentType] = useState('');
  const [language, setLanguage] = useState('vi');
  const [tone, setTone] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Removed hardcoded arrays - now using List of Values system

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

  // Validation function
  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Required fields validation
    if (!prompt.trim()) {
      errors.prompt = t('contentCreator.contentPromptRequired');
    }

    if (!industry.trim()) {
      errors.industry = t('contentCreator.industryRequired');
    }

    if (!contentType.trim()) {
      errors.contentType = t('contentCreator.contentTypeRequired');
    }

    if (!language.trim()) {
      errors.language = t('contentCreator.languageRequired');
    }

    if (!tone.trim()) {
      errors.tone = t('contentCreator.toneRequired');
    }

    if (!targetAudience.trim()) {
      errors.targetAudience = t('contentCreator.targetAudienceRequired');
    }



    // Optional: Validate prompt length
    if (prompt.trim() && prompt.trim().length < 10) {
      errors.prompt = t('contentCreator.promptTooShort');
    }

    if (prompt.trim() && prompt.trim().length > 2000) {
      errors.prompt = t('contentCreator.promptTooLong');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGenerate = async () => {
    // Clear previous validation errors
    setValidationErrors({});

    // Validate form
    if (!validateForm()) {
      setToastSeverity('error');
      setToastMsg(t('contentCreator.fillRequiredFields'));
      setToastOpen(true);
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
      maxTokens: 500,
      temperature: 0.7,
      workspaceId,
      preferredProvider: 'openai',
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
      aiProvider: 'openai',
      aiModel: null, // Let backend auto-select the model
      aiParameters: {
        temperature: 0.7,
        maxTokens: 500
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
        title: generationResult.title,
        input: generationResult.content,
        metadata: {
          industry: industry,
          contentType: contentType,
          language: language,
          tone: tone,
          targetAudience: targetAudience
        }
      };
      // Use existing content ID or generate a new one
      const contentId = lastContentId || generateContentId();
      console.log('Using content ID for workflow:', contentId);

      const run = await triggerAiAvatarWorkflow(contentId, contentData);
      setToastSeverity('success');
      setToastMsg(t('contentCreator.sentToWorkflow'));
      setToastOpen(true);

      // Navigate to workflow run page after a short delay
      setTimeout(() => {
        window.location.href = `/workflows/run/${run.id}`;
      }, 1500);
    } catch (e) {
      setToastSeverity('error');
      setToastMsg(t('contentCreator.failedToSendWorkflow'));
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
        contentType: ContentType.ARTICLE,
        industry,
        language,
        fromAiGeneration: true,
        aiProvider: generationResult?.provider,
        metadata: generationResult ? { ...generationResult } as Record<string, unknown> : undefined,
      });
      setLastContentId(saved?.id ?? 0);
      setToastSeverity('success');
      setToastMsg(t('contentCreator.savedToLibrary'));
      setToastOpen(true);

      // Navigate to content library after a short delay
      setTimeout(() => {
        window.location.href = `/content/library`;
      }, 1500);
    } catch (e) {
      setToastSeverity('error');
      setToastMsg(t('contentCreator.failedToSave'));
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
      setToastMsg(t('contentCreator.sentToBackend'));
      setToastOpen(true);
    } catch (e) {
      setToastSeverity('error');
      setToastMsg(t('contentCreator.failedToSendBackend'));
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
              {t('contentCreator.contentGeneration')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {t('contentCreator.createAiPoweredContent')}
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
                {t('contentCreator.usingTemplate')}: <strong>{selectedTemplate.name}</strong>
              </Alert>
            )}

            {/* Main Prompt */}
            <TextField
              fullWidth
              multiline
              rows={4}
              label={t('contentCreator.contentPrompt')}
              placeholder={t('contentCreator.contentPromptPlaceholder')}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                // Clear validation error when user starts typing
                if (validationErrors.prompt) {
                  setValidationErrors(prev => ({ ...prev, prompt: '' }));
                }
              }}
              error={!!validationErrors.prompt}
              helperText={validationErrors.prompt || `${prompt.length}/2000 characters`}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              inputProps={{ maxLength: 2000 }}
            />

            {/* Industry and Content Type */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                {t('contentCreator.contentSettings')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <IndustrySelect
                      value={industry}
                      onChange={(value) => {
                        setIndustry(value as string);
                        if (validationErrors.industry) {
                          setValidationErrors(prev => ({ ...prev, industry: '' }));
                        }
                      }}
                      placeholder={t('contentCreator.selectIndustry')}
                      showIcons={true}
                    />
                    {validationErrors.industry && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                        {validationErrors.industry}
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <ContentTypeSelect
                      value={contentType}
                      onChange={(value) => {
                        setContentType(value as string);
                        if (validationErrors.contentType) {
                          setValidationErrors(prev => ({ ...prev, contentType: '' }));
                        }
                      }}
                      placeholder={t('contentCreator.selectContentType')}
                      showIcons={true}
                    />
                    {validationErrors.contentType && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                        {validationErrors.contentType}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Language and Tone */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                {t('contentCreator.styleAndLanguage')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <LanguageSelect
                      value={language}
                      onChange={(value) => {
                        setLanguage(value as string);
                        if (validationErrors.language) {
                          setValidationErrors(prev => ({ ...prev, language: '' }));
                        }
                      }}
                      showIcons={true}
                    />
                    {validationErrors.language && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                        {validationErrors.language}
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <ToneSelect
                      value={tone}
                      onChange={(value) => {
                        setTone(value as string);
                        if (validationErrors.tone) {
                          setValidationErrors(prev => ({ ...prev, tone: '' }));
                        }
                      }}
                      placeholder={t('contentCreator.selectTone')}
                      showIcons={true}
                    />
                    {validationErrors.tone && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                        {validationErrors.tone}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Target Audience */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                {t('contentCreator.targetAudience')}
              </Typography>
              <TargetAudienceSelect
                value={targetAudience}
                onChange={(value) => {
                  setTargetAudience(value as string);
                  if (validationErrors.targetAudience) {
                    setValidationErrors(prev => ({ ...prev, targetAudience: '' }));
                  }
                }}
                placeholder={t('contentCreator.selectTargetAudience')}
                showIcons={true}
              />
              {validationErrors.targetAudience && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  {validationErrors.targetAudience}
                </Typography>
              )}
            </Box>







            {/* Validation Errors Summary */}
            {Object.keys(validationErrors).length > 0 && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  {t('contentCreator.completeRequiredFields')}
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {Object.entries(validationErrors).map(([field, error]) => (
                    error && (
                      <Typography component="li" variant="body2" key={field} sx={{ mb: 0.5 }}>
                        {error}
                      </Typography>
                    )
                  ))}
                </Box>
              </Alert>
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
                disabled={isGenerating || Object.keys(validationErrors).length > 0}
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
                {isGenerating ? t('contentCreator.generatingContent') : t('contentCreator.generateContent')}
              </Button>

              {/* Quick Actions */}
              <Box sx={{
                display: 'flex',
                gap: 1.5,
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <Chip
                  label={t('contentCreator.templates')}
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
                  label={t('contentCreator.history')}
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
          {t('contentCreator.create')}
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
          {t('contentCreator.templates')}
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
          {t('contentCreator.history')}
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