import {
  Cancel,
  CheckCircle,
  Pending,
  Send,
  Stop
} from '@mui/icons-material';
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
  DialogTitle,
  Grid,
  LinearProgress,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ContentTypeSelect,
  IndustrySelect,
  LanguageSelect,
  TargetAudienceSelect,
  ToneSelect
} from '../../components/common/ListOfValuesSelect';
import { useWorkflow } from '../../hooks/useWorkflow';
import { triggerAiAvatarWorkflow } from '../../services/n8n.service';
import { generateContentId } from '../../utils/uuid';
import { useI18n } from '../../hooks/useI18n';
import { useErrorHandler } from '../../utils/error-handler';
import { useSocket } from '../../hooks/useSocket';


interface ContentData {
  title: string;
  content: string;
  industry?: string;
  contentType?: string;
  language?: string;
  tone?: string;
  targetAudience?: string;
}

interface WorkflowProgress {
  id: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  currentStep: string;
  progress: number;
  message: string;
  startedAt: string;
  finishedAt?: string;
  errorMessage?: string;
}

const ContentWorkflow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const {
    loading,
    error: workflowError,
    loadWorkflows,
    loadWorkflow,
    addComment
  } = useWorkflow();

  // Error handling through toast
  const { handleError, showUserError } = useErrorHandler();

  // Content input state
  const [contentData, setContentData] = useState<ContentData>({
    title: '',
    content: '',
    industry: '',
    contentType: '',
    language: 'vi',
    tone: '',
    targetAudience: ''
  });

  // Workflow execution state
  const [isTriggering, setIsTriggering] = useState(false);
  const [workflowProgress, setWorkflowProgress] = useState<WorkflowProgress | null>(null);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [currentUserId] = useState<number>(1); // TODO: Get from auth context

  // Dialog state
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');

  // Socket connection for real-time updates
  const {
    isConnected: socketConnected,
    connect: socketConnect,
    disconnect: socketDisconnect,
    joinExecutionRoom,
    error: socketError
  } = useSocket({
    userId: currentUserId,
    autoConnect: false, // We'll connect manually when workflow starts
    onConnection: () => {
      console.log('Connected to workflow socket');
    },
    onExecutionUpdate: (data) => {
      console.log('Received execution update via Socket.IO:', data);
      updateWorkflowProgressFromSocket(data);
    },
    onWorkflowUpdate: (data) => {
      console.log('Received workflow update via Socket.IO:', data);
      updateWorkflowProgressFromSocket(data);
    },
    onError: (error) => {
      console.error('Socket error in workflow:', error);
    }
  });



  // Load data on mount
  useEffect(() => {
    if (id) {
      loadWorkflow(parseInt(id));
    } else {
      loadWorkflows();
    }
  }, [id]);

  // Handle Socket errors
  useEffect(() => {
    if (socketError) {
      console.error('Socket connection error:', socketError);
      const processedError = handleError(new Error('Real-time connection lost. Updates may be delayed.'), 'socket_connection');
      showUserError(processedError);
    }
  }, [socketError, handleError, showUserError]);

  // Cleanup Socket connection on unmount
  useEffect(() => {
    return () => {
      socketDisconnect();
    };
  }, [socketDisconnect]);

  // Update workflow progress from socket data
  const updateWorkflowProgressFromSocket = useCallback((socketData: any) => {
    setWorkflowProgress(prev => ({
      id: socketData.executionId || prev?.id || 'unknown',
      status: mapBackendStatusToFrontend(socketData.status),
      currentStep: socketData.nodeName || extractCurrentStepFromSocket(socketData),
      progress: calculateProgressFromSocket(socketData),
      message: extractMessageFromSocket(socketData),
      startedAt: prev?.startedAt || new Date().toISOString(),
      finishedAt: socketData.finishedAt || prev?.finishedAt,
      errorMessage: prev?.errorMessage
    }));
  }, []);



  // Handle content input changes
  const handleContentChange = (field: keyof ContentData, value: string) => {
    setContentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper functions for SSE data processing
  const mapBackendStatusToFrontend = (backendStatus: string): WorkflowProgress['status'] => {
    switch (backendStatus?.toUpperCase()) {
      case 'RUNNING': return 'RUNNING';
      case 'COMPLETED': return 'COMPLETED';
      case 'FAILED': return 'FAILED';
      case 'CANCELLED': return 'CANCELLED';
      default: return 'QUEUED';
    }
  };

  const extractCurrentStepFromSocket = (socketData: any): string => {
    return socketData.nodeName || 'Processing';
  };

  const calculateProgressFromSocket = (socketData: any): number => {
    if (socketData.status === 'success') return 100;
    if (socketData.status === 'failed') return 0;
    if (socketData.status === 'running') return 50; // Default progress for running
    return 0;
  };

  const extractMessageFromSocket = (socketData: any): string => {
    if (socketData.status === 'success') return t('workflow.workflowCompleted');
    if (socketData.status === 'failed') return t('workflow.workflowFailed');
    if (socketData.status === 'running') return `Processing: ${socketData.nodeName}`;
    return t('workflow.initializingWorkflow');
  };

  // Handle sending content to n8n workflow
  const handleSendToWorkflow = async () => {
    if (!contentData.title.trim() || !contentData.content.trim()) {
      alert(t('workflow.pleaseEnterTitleAndContent'));
      return;
    }

    setIsTriggering(true);
    setWorkflowProgress({
      id: `workflow_${Date.now()}`,
      status: 'QUEUED',
      currentStep: 'Initializing',
      progress: 0,
      message: t('workflow.initializingWorkflow'),
      startedAt: new Date().toISOString()
    });

    try {
      const workflowData = {
        title: contentData.title,
        input: contentData.content,
        metadata: {
          industry: contentData.industry,
          contentType: contentData.contentType,
          language: contentData.language,
          tone: contentData.tone,
          targetAudience: contentData.targetAudience
        }
      };

      // Generate a unique content ID for this workflow run
      const contentId = generateContentId();
      console.log('Generated content ID for workflow:', contentId);
      
      const run = await triggerAiAvatarWorkflow(contentId, workflowData);
      console.log('Workflow triggered successfully:', run);

      // Set the run ID and connect to SSE
      if (run.runId) {
        setCurrentRunId(run.runId);
        console.log('Started workflow run:', run.runId);
        
        // Connect to Socket.IO for real-time updates
        if (!socketConnected) {
          socketConnect();
        }
        // Join execution room for this specific run
        joinExecutionRoom(run.runId);
      }

      setWorkflowProgress(prev => prev ? {
        ...prev,
        id: run.id?.toString() || prev.id,
        status: 'RUNNING',
        currentStep: 'Processing Content',
        progress: 25,
        message: t('workflow.processingContent')
      } : null);

    } catch (error) {
      console.error('Failed to trigger workflow:', error);

      // Show error via toast
      const processedError = handleError(error, 'workflow_trigger');
      showUserError(processedError);

      setWorkflowProgress(prev => prev ? {
        ...prev,
        status: 'FAILED',
        progress: 0,
        message: t('workflow.workflowStartError'),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        finishedAt: new Date().toISOString()
      } : null);
    } finally {
      setIsTriggering(false);
    }
  };


  const handleAddComment = async () => {
    if (selectedStepId && newComment.trim()) {
      try {
        await addComment(selectedStepId, newComment.trim());

        setCommentDialogOpen(false);
        setSelectedStepId(null);
        setNewComment('');

        if (id) {
          loadWorkflow(parseInt(id));
        }
      } catch (error) {
        console.error('Failed to add comment:', error);
        const processedError = handleError(error, 'add_comment');
        showUserError(processedError);
      }
    }
  };




  // Render content input form
  const renderContentForm = () => (
    <Card sx={{
      mb: 3,
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
          {t('workflow.enterContentInfo')}
        </Typography>
      </Box>
      <CardContent sx={{ p: 3, pt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('workflow.titleRequired')}
              value={contentData.title}
              onChange={(e) => handleContentChange('title', e.target.value)}
              placeholder={t('workflow.titlePlaceholder')}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={6}
              label={t('workflow.contentRequired')}
              value={contentData.content}
              onChange={(e) => handleContentChange('content', e.target.value)}
              placeholder={t('workflow.contentPlaceholder')}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>

          {/* Content Settings Section */}
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
              {t('workflow.contentSettings')}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <IndustrySelect
              value={contentData.industry}
              onChange={(value) => handleContentChange('industry', value as string)}
              placeholder={t('workflow.selectIndustry')}
              showIcons={true}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <ContentTypeSelect
              value={contentData.contentType}
              onChange={(value) => handleContentChange('contentType', value as string)}
              placeholder={t('workflow.selectContentType')}
              showIcons={true}
            />
          </Grid>

          {/* Style & Audience Section */}
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
              {t('workflow.styleAndAudience')}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <LanguageSelect
              value={contentData.language}
              onChange={(value) => handleContentChange('language', value as string)}
              showIcons={true}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <ToneSelect
              value={contentData.tone}
              onChange={(value) => handleContentChange('tone', value as string)}
              placeholder={t('workflow.selectTone')}
              showIcons={true}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TargetAudienceSelect
              value={contentData.targetAudience}
              onChange={(value) => handleContentChange('targetAudience', value as string)}
              placeholder={t('workflow.selectTargetAudience')}
              showIcons={true}
            />
          </Grid>
        </Grid>

        <Box sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          pt: 3,
          mt: 3
        }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={isTriggering ? <CircularProgress size={20} /> : <Send />}
              onClick={handleSendToWorkflow}
              disabled={isTriggering || !contentData.title.trim() || !contentData.content.trim()}
              sx={{
                minWidth: 200,
                py: 1.5,
                borderRadius: 2,
                fontSize: '1rem',
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
              {isTriggering ? t('workflow.sending') : t('workflow.sendToWorkflow')}
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => {
                setContentData({
                  title: '',
                  content: '',
                  industry: '',
                  contentType: '',
                  language: 'vi',
                  tone: '',
                  targetAudience: ''
                });
                setWorkflowProgress(null);
              }}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 500
              }}
            >
              {t('workflow.clearForm')}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Render workflow progress
  const renderWorkflowProgress = () => {
    if (!workflowProgress) return null;

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'COMPLETED': return 'success';
        case 'RUNNING': return 'primary';
        case 'QUEUED': return 'warning';
        case 'FAILED': return 'error';
        case 'CANCELLED': return 'default';
        default: return 'default';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'COMPLETED': return <CheckCircle color="success" />;
        case 'RUNNING': return <CircularProgress size={20} />;
        case 'QUEUED': return <Pending color="warning" />;
        case 'FAILED': return <Cancel color="error" />;
        case 'CANCELLED': return <Stop color="disabled" />;
        default: return <Pending />;
      }
    };

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {getStatusIcon(workflowProgress.status)}
            <Typography variant="h6">
              {t('workflow.workflowProgress')}
            </Typography>
            <Chip
              label={workflowProgress.status}
              color={getStatusColor(workflowProgress.status) as any}
              size="small"
            />
            {/* SSE Connection Status */}
            {currentRunId && (
              <Chip
                label={socketConnected ? 'Live' : 'Running'}
                color={socketConnected ? 'success' : 'primary'}
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('workflow.currentStep')}: {workflowProgress.currentStep}
          </Typography>

          <LinearProgress
            variant="determinate"
            value={workflowProgress.progress}
            sx={{ mb: 2, height: 8, borderRadius: 4 }}
          />

          <Typography variant="body2" sx={{ mb: 1 }}>
            {workflowProgress.message}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {t('workflow.startedAt')}: {new Date(workflowProgress.startedAt).toLocaleString()}
          </Typography>

          {workflowProgress.finishedAt && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
              {t('workflow.finishedAt')}: {new Date(workflowProgress.finishedAt).toLocaleString()}
            </Typography>
          )}

          {workflowProgress.errorMessage && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {workflowProgress.errorMessage}
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  // Rest of the component code for renderWorkflowList and renderWorkflowDetails...
  // (keeping the existing implementations)

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>{t('workflow.loadingWorkflowData')}</Typography>
      </Box>
    );
  }

  if (workflowError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {workflowError}
        </Alert>
        <Button onClick={() => navigate('/content')}>
          {t('workflow.backToContent')}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('workflow.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('workflow.description')}
        </Typography>
      </Box>



      {/* Content Input Form */}
      {renderContentForm()}

      {/* Workflow Progress */}
      {renderWorkflowProgress()}

      {/* Add Comment Dialog */}
      <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)}>
        <DialogTitle>{t('workflow.addComment')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder={t('workflow.enterComment')}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>{t('workflow.cancel')}</Button>
          <Button onClick={handleAddComment} variant="contained">
            {t('workflow.addComment')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContentWorkflow;
