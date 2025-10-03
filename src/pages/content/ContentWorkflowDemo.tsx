import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { Send, CheckCircle, Cancel, Pending, Stop } from '@mui/icons-material';

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

const ContentWorkflowDemo: React.FC = () => {
  const [contentData, setContentData] = useState<ContentData>({
    title: '',
    content: '',
    industry: '',
    contentType: '',
    language: 'vi',
    tone: '',
    targetAudience: ''
  });

  const [isTriggering, setIsTriggering] = useState(false);
  const [workflowProgress, setWorkflowProgress] = useState<WorkflowProgress | null>(null);

  // Handle content input changes
  const handleContentChange = (field: keyof ContentData, value: string) => {
    setContentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Simulate workflow progress
  const simulateWorkflowProgress = () => {
    const steps = [
      { step: 'Initializing', progress: 0, message: 'Đang khởi tạo workflow...' },
      { step: 'Processing Content', progress: 25, message: 'Đang xử lý nội dung với AI...' },
      { step: 'Generating Media', progress: 50, message: 'Đang tạo media và hình ảnh...' },
      { step: 'Optimizing Output', progress: 75, message: 'Đang tối ưu hóa kết quả...' },
      { step: 'Finalizing', progress: 100, message: 'Hoàn thành xử lý!' }
    ];

    let currentStepIndex = 0;

    const updateProgress = () => {
      if (currentStepIndex < steps.length) {
        const currentStep = steps[currentStepIndex];
        setWorkflowProgress(prev => prev ? {
          ...prev,
          status: currentStepIndex === steps.length - 1 ? 'COMPLETED' : 'RUNNING',
          currentStep: currentStep.step,
          progress: currentStep.progress,
          message: currentStep.message,
          finishedAt: currentStepIndex === steps.length - 1 ? new Date().toISOString() : undefined
        } : null);

        currentStepIndex++;
        if (currentStepIndex < steps.length) {
          setTimeout(updateProgress, 2000);
        } else {
          setIsTriggering(false);
        }
      }
    };

    setTimeout(updateProgress, 1000);
  };

  // Handle sending content to n8n workflow
  const handleSendToWorkflow = async () => {
    if (!contentData.title.trim() || !contentData.content.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    setIsTriggering(true);
    setWorkflowProgress({
      id: `workflow_${Date.now()}`,
      status: 'QUEUED',
      currentStep: 'Initializing',
      progress: 0,
      message: 'Đang khởi tạo workflow...',
      startedAt: new Date().toISOString()
    });

    // Simulate workflow execution
    simulateWorkflowProgress();
  };

  // Render content input form
  const renderContentForm = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Nhập thông tin nội dung
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Tiêu đề *"
              value={contentData.title}
              onChange={(e) => handleContentChange('title', e.target.value)}
              placeholder="Nhập tiêu đề cho nội dung..."
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Nội dung *"
              value={contentData.content}
              onChange={(e) => handleContentChange('content', e.target.value)}
              placeholder="Nhập nội dung cần xử lý..."
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Ngành nghề"
              value={contentData.industry}
              onChange={(e) => handleContentChange('industry', e.target.value)}
              placeholder="Ví dụ: Công nghệ, Y tế, Giáo dục..."
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Loại nội dung"
              value={contentData.contentType}
              onChange={(e) => handleContentChange('contentType', e.target.value)}
              placeholder="Ví dụ: Blog, Social Media, Email..."
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Ngôn ngữ</InputLabel>
              <Select
                value={contentData.language}
                onChange={(e) => handleContentChange('language', e.target.value)}
                label="Ngôn ngữ"
              >
                <MenuItem value="vi">Tiếng Việt</MenuItem>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="zh">中文</MenuItem>
                <MenuItem value="ja">日本語</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Tone/Phong cách"
              value={contentData.tone}
              onChange={(e) => handleContentChange('tone', e.target.value)}
              placeholder="Ví dụ: Chuyên nghiệp, Thân thiện, Hài hước..."
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Đối tượng mục tiêu"
              value={contentData.targetAudience}
              onChange={(e) => handleContentChange('targetAudience', e.target.value)}
              placeholder="Ví dụ: Doanh nghiệp, Sinh viên, Người tiêu dùng..."
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={isTriggering ? <CircularProgress size={20} /> : <Send />}
            onClick={handleSendToWorkflow}
            disabled={isTriggering || !contentData.title.trim() || !contentData.content.trim()}
            sx={{ minWidth: 200 }}
          >
            {isTriggering ? 'Đang gửi...' : 'Gửi đến N8N Workflow'}
          </Button>
          
          <Button
            variant="outlined"
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
          >
            Xóa form
          </Button>
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
              Tiến trình N8N Workflow
            </Typography>
            <Chip 
              label={workflowProgress.status} 
              color={getStatusColor(workflowProgress.status) as any}
              size="small"
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Bước hiện tại: {workflowProgress.currentStep}
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
            Bắt đầu: {new Date(workflowProgress.startedAt).toLocaleString('vi-VN')}
          </Typography>
          
          {workflowProgress.finishedAt && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
              Kết thúc: {new Date(workflowProgress.finishedAt).toLocaleString('vi-VN')}
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

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Content Workflow Demo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Nhập nội dung và gửi đến N8N workflow để xử lý tự động
        </Typography>
      </Box>

      {/* Content Input Form */}
      {renderContentForm()}
      
      {/* Workflow Progress */}
      {renderWorkflowProgress()}
    </Box>
  );
};

export default ContentWorkflowDemo;