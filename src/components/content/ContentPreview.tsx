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
  TrendingUp
} from '@mui/icons-material';
import { useContentPreview } from '../../hooks/useContentPreview';

interface ContentPreviewProps {
  content?: string;
  title?: string;
  isGenerating?: boolean;
  metadata?: any;
  onContentChange?: (content: string) => void;
  onRegenerate?: () => void;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({
  content,
  title,
  isGenerating,
  metadata,
  onContentChange,
  onRegenerate
}) => {
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
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="h6">
            Generating Content...
          </Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
        </Box>
        <Typography variant="body2" color="text.secondary">
          This may take a few seconds depending on the selected AI provider and content complexity.
        </Typography>
      </CardContent>
    </Card>
  );

  const renderEmptyState = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center', py: 4 }}>
        <Psychology sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Ready to Generate
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter your prompt and click "Generate Content" to see AI-powered results here.
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
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Content Preview
          </Typography>
          <Box>
            <Tooltip title="Edit content">
              <IconButton
                onClick={() => setIsEditing(!isEditing)}
                color={isEditing ? 'primary' : 'default'}
              >
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy to clipboard">
              <IconButton onClick={handleCopy}>
                <ContentCopy />
              </IconButton>
            </Tooltip>
            {onRegenerate && (
              <Tooltip title="Regenerate content">
                <IconButton onClick={onRegenerate}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            )}
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <MoreVert />
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
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={8}
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={handleSaveEdit}>
                Save Changes
              </Button>
              <Button variant="outlined" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                maxHeight: 300,
                overflow: 'auto',
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1,
                border: 1,
                borderColor: 'divider'
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