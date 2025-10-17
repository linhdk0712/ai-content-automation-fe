import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Grid,
  LinearProgress,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Edit,
  ContentCopy,
  Download,
  Share,
  Refresh,
  MoreVert,
  Assessment,
  Visibility,
  Timer,
  MonetizationOn,
  Psychology,
  TrendingUp,
  Send,
  Save,
  CloudUpload
} from '@mui/icons-material';
import { useContentPreview } from '../../hooks/useContentPreview';
import { useI18n } from '../../hooks/useI18n';

interface ContentPreviewProps {
  content?: string;
  title?: string;
  isGenerating?: boolean;
  metadata?: any;
  onContentChange?: (content: string) => void;
  onRegenerate?: () => void;
  // Thêm props cho action buttons
  onSendToWorkflow?: () => void;
  onSaveToLibrary?: () => void;
  onSendToBackend?: () => void;
  isProcessingWorkflow?: boolean;
  isSaving?: boolean;
  isSendingToBackend?: boolean;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({
  content,
  title,
  isGenerating,
  metadata,
  onContentChange,
  onRegenerate,
  onSendToWorkflow,
  onSaveToLibrary,
  onSendToBackend,
  isProcessingWorkflow,
  isSaving,
  isSendingToBackend
}) => {
  const { t } = useI18n();
  const [editableContent, setEditableContent] = useState(content || '');
  const [isEditing, setIsEditing] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null as any);

  const {
    previewData,
    isAnalyzing,
    analyzeContent,
    exportContent,
    shareContent
  } = useContentPreview();

  useEffect(() => {
    setEditableContent(content || '');
    if (content) {
      analyzeContent(content);
    }
  }, [content, analyzeContent]);

  const handleSaveEdit = () => {
    setIsEditing(false);
    if (onContentChange) {
      onContentChange(editableContent);
    }
    analyzeContent(editableContent);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditableContent(content || '');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableContent);
      // Show success toast
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const handleExport = (format: string) => {
    exportContent(editableContent, format, title);
    setMenuAnchor(null);
  };

  const handleShare = () => {
    shareContent(editableContent, title);
    setMenuAnchor(null);
  };

  const getQualityColor = (score: number) => {
    if (score >= 8) return 'success';
    if (score >= 6) return 'warning';
    return 'error';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const renderLoadingState = () => (
    <Card sx={{
      height: '100%',
      minHeight: 400,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      border: '1px solid',
      borderColor: 'divider'
    }}>
      <CardContent sx={{ textAlign: 'center', py: 6 }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 3
        }}>
          <CircularProgress
            size={48}
            sx={{
              mb: 2,
              color: 'primary.main'
            }}
          />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Generating Content...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
            This may take a few seconds depending on the selected AI provider and content complexity.
          </Typography>
        </Box>
        <Box sx={{ width: '100%', maxWidth: 300, mx: 'auto' }}>
          <LinearProgress sx={{ borderRadius: 2, height: 6 }} />
        </Box>
      </CardContent>
    </Card>
  );

  const renderEmptyState = () => (
    <Card sx={{
      height: '100%',
      minHeight: 400,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: '1px solid',
      borderColor: 'divider'
    }}>
      <CardContent sx={{ textAlign: 'center', py: 6 }}>
        <Psychology sx={{
          fontSize: 80,
          mb: 3,
          opacity: 0.9
        }} />
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          {t('contentCreator.readyToGenerate')}
        </Typography>
        <Typography variant="body1" sx={{
          maxWidth: 400,
          mx: 'auto',
          opacity: 0.9,
          lineHeight: 1.6
        }}>
          {t('contentCreator.enterPromptInstruction')}
        </Typography>
      </CardContent>
    </Card>
  );

  if (isGenerating) {
    return renderLoadingState();
  }

  if (!content && !isGenerating) {
    return renderEmptyState();
  }

  return (
    <Card sx={{
      height: 'fit-content',
      minHeight: 400,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 3
    }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h6" sx={{
            fontWeight: 600,
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Visibility fontSize="small" />
            Content Preview
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Edit content">
              <IconButton
                onClick={() => setIsEditing(!isEditing)}
                color={isEditing ? 'primary' : 'default'}
                size="small"
                sx={{
                  borderRadius: 2,
                  bgcolor: isEditing ? 'primary.50' : 'transparent'
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy to clipboard">
              <IconButton
                onClick={handleCopy}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
            {onRegenerate && (
              <Tooltip title="Regenerate content">
                <IconButton
                  onClick={onRegenerate}
                  size="small"
                  sx={{ borderRadius: 2 }}
                >
                  <Refresh fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <IconButton
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              size="small"
              sx={{ borderRadius: 2 }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Title */}
        {title && (
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
        )}

        {/* Content */}
        {isEditing ? (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={10}
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              variant="outlined"
              placeholder="Edit your content here..."
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#fafbfc',
                  '&:hover': {
                    backgroundColor: '#f5f6f7',
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#ffffff',
                    boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
                  },
                }
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleCancelEdit}
                sx={{ borderRadius: 2 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveEdit}
                sx={{ borderRadius: 2 }}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.7,
                maxHeight: 400,
                overflow: 'auto',
                p: 3,
                bgcolor: '#fafbfc',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                fontSize: '1rem',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#c1c1c1',
                  borderRadius: '3px',
                  '&:hover': {
                    background: '#a8a8a8',
                  },
                },
              }}
            >
              {editableContent}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Metadata and Analytics */}
        {(metadata || previewData) && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Content Analytics
            </Typography>

            {/* Basic Stats */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">
                    {previewData?.wordCount || editableContent.split(/\s+/).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Words
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">
                    {previewData?.characterCount || editableContent.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Characters
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">
                    {previewData?.estimatedReadingTime || Math.ceil(editableContent.split(/\s+/).length / 200)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Min Read
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">
                    {metadata?.tokensUsed || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tokens
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Quality Scores */}
            {(metadata || previewData) && (
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {metadata?.qualityScore && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Assessment fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="caption">Quality Score</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LinearProgress
                          variant="determinate"
                          value={metadata.qualityScore * 10}
                          color={getQualityColor(metadata.qualityScore)}
                          sx={{ flexGrow: 1, mr: 1 }}
                        />
                        <Typography variant="body2">
                          {metadata.qualityScore}/10
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {(previewData?.readabilityScore || metadata?.readabilityScore) && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Visibility fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="caption">Readability</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LinearProgress
                          variant="determinate"
                          value={previewData?.readabilityScore || metadata?.readabilityScore}
                          color={getScoreColor(previewData?.readabilityScore || metadata?.readabilityScore)}
                          sx={{ flexGrow: 1, mr: 1 }}
                        />
                        <Typography variant="body2">
                          {Math.round(previewData?.readabilityScore || metadata?.readabilityScore)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {(previewData?.seoScore || metadata?.seoScore) && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <TrendingUp fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="caption">SEO Score</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LinearProgress
                          variant="determinate"
                          value={previewData?.seoScore || metadata?.seoScore}
                          color={getScoreColor(previewData?.seoScore || metadata?.seoScore)}
                          sx={{ flexGrow: 1, mr: 1 }}
                        />
                        <Typography variant="body2">
                          {Math.round(previewData?.seoScore || metadata?.seoScore)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {(previewData?.engagementPrediction || metadata?.engagementPrediction) && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Psychology fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="caption">Engagement</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LinearProgress
                          variant="determinate"
                          value={previewData?.engagementPrediction || metadata?.engagementPrediction}
                          color={getScoreColor(previewData?.engagementPrediction || metadata?.engagementPrediction)}
                          sx={{ flexGrow: 1, mr: 1 }}
                        />
                        <Typography variant="body2">
                          {Math.round(previewData?.engagementPrediction || metadata?.engagementPrediction)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            )}

            {/* Generation Info */}
            {metadata && (
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Timer fontSize="small" sx={{ mr: 0.5 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Response Time
                      </Typography>
                      <Typography variant="body2">
                        {(metadata.responseTimeMs / 1000).toFixed(1)}s
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MonetizationOn fontSize="small" sx={{ mr: 0.5 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Cost
                      </Typography>
                      <Typography variant="body2">
                        ${metadata.cost?.toFixed(4) || '0.0000'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Provider
                    </Typography>
                    <Typography variant="body2">
                      {metadata.provider}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            )}

            {/* Keywords and Hashtags */}
            {(previewData?.keywords || metadata?.keywords || previewData?.suggestedHashtags || metadata?.suggestedHashtags) && (
              <Box>
                {(previewData?.keywords || metadata?.keywords) && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      Keywords:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {(previewData?.keywords || metadata?.keywords)?.map((keyword: string, index: number) => (
                        <Chip key={index} label={keyword} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}

                {(previewData?.suggestedHashtags || metadata?.suggestedHashtags) && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      Suggested Hashtags:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {(previewData?.suggestedHashtags || metadata?.suggestedHashtags)?.map((hashtag: string, index: number) => (
                        <Chip key={index} label={hashtag} size="small" color="primary" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Action Buttons - Hiển thị khi có nội dung */}
        {content && !isGenerating && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box>
              <Typography variant="h6" gutterBottom sx={{
                fontWeight: 600,
                color: 'primary.main',
                mb: 2
              }}>
                Next Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={isProcessingWorkflow ? <CircularProgress size={20} /> : <Send />}
                    onClick={onSendToWorkflow}
                    disabled={isProcessingWorkflow || isSaving || isSendingToBackend}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      bgcolor: 'primary.main',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      }
                    }}
                  >
                    {isProcessingWorkflow ? 'Sending...' : 'Send to Workflow'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Generate AI avatar video
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={isSaving ? <CircularProgress size={20} /> : <Save />}
                    onClick={onSaveToLibrary}
                    disabled={isProcessingWorkflow || isSaving || isSendingToBackend}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      borderColor: 'success.main',
                      color: 'success.main',
                      '&:hover': {
                        borderColor: 'success.dark',
                        color: 'success.dark',
                        bgcolor: 'success.50'
                      }
                    }}
                  >
                    {isSaving ? 'Saving...' : 'Save to Library'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Store in content library
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={isSendingToBackend ? <CircularProgress size={20} /> : <CloudUpload />}
                    onClick={onSendToBackend}
                    disabled={isProcessingWorkflow || isSaving || isSendingToBackend}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      borderColor: 'info.main',
                      color: 'info.main',
                      '&:hover': {
                        borderColor: 'info.dark',
                        color: 'info.dark',
                        bgcolor: 'info.50'
                      }
                    }}
                  >
                    {isSendingToBackend ? 'Sending...' : 'Send to Backend'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Process with backend API
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </>
        )}

        {/* Actions Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem onClick={() => handleExport('txt')}>
            <ListItemIcon>
              <Download fontSize="small" />
            </ListItemIcon>
            <ListItemText>Export as Text</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleExport('docx')}>
            <ListItemIcon>
              <Download fontSize="small" />
            </ListItemIcon>
            <ListItemText>Export as Word</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleExport('pdf')}>
            <ListItemIcon>
              <Download fontSize="small" />
            </ListItemIcon>
            <ListItemText>Export as PDF</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleShare}>
            <ListItemIcon>
              <Share fontSize="small" />
            </ListItemIcon>
            <ListItemText>Share Content</ListItemText>
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

export default ContentPreview;