import React, { useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    TextField,
    Button,
    Divider,
    Alert,
    Paper
} from '@mui/material';
import { PlayArrow, Timeline as TimelineIcon } from '@mui/icons-material';
import { WorkflowNodeTimeline } from '../../components/workflow/WorkflowNodeTimeline';
import { WorkflowNodeTimelineCompact } from '../../components/workflow/WorkflowNodeTimelineCompact';
import { useAuth } from '../../hooks/useAuth';

export const WorkflowTimelinePage: React.FC = () => {
    const { user } = useAuth();
    const [executionId, setExecutionId] = useState('');
    const [contentId, setContentId] = useState('');
    const [activeExecutionId, setActiveExecutionId] = useState<string | undefined>();
    const [activeContentId, setActiveContentId] = useState<string | undefined>();

    const handleConnectToExecution = () => {
        if (executionId.trim()) {
            setActiveExecutionId(executionId.trim());
            setActiveContentId(undefined);
        }
    };

    const handleConnectToContent = () => {
        if (contentId.trim()) {
            setActiveContentId(contentId.trim());
            setActiveExecutionId(undefined);
        }
    };

    const handleDisconnect = () => {
        setActiveExecutionId(undefined);
        setActiveContentId(undefined);
    };

    if (!user) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="warning">
                    Bạn cần đăng nhập để sử dụng tính năng này.
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimelineIcon />
                    Workflow Node Timeline
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Theo dõi realtime trạng thái của các node trong N8N workflow
                </Typography>
            </Box>

            {/* Connection Controls */}
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Kết nối Timeline
                    </Typography>
                    
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                                <TextField
                                    label="Execution ID"
                                    value={executionId}
                                    onChange={(e) => setExecutionId(e.target.value)}
                                    placeholder="Nhập execution ID để theo dõi"
                                    fullWidth
                                    size="small"
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleConnectToExecution}
                                    disabled={!executionId.trim()}
                                    startIcon={<PlayArrow />}
                                >
                                    Kết nối
                                </Button>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                                <TextField
                                    label="Content ID"
                                    value={contentId}
                                    onChange={(e) => setContentId(e.target.value)}
                                    placeholder="Nhập content ID để theo dõi"
                                    fullWidth
                                    size="small"
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleConnectToContent}
                                    disabled={!contentId.trim()}
                                    startIcon={<PlayArrow />}
                                >
                                    Kết nối
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>

                    {(activeExecutionId || activeContentId) && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Alert severity="info" sx={{ flex: 1 }}>
                                Đang theo dõi: {activeExecutionId ? `Execution ${activeExecutionId}` : `Content ${activeContentId}`}
                            </Alert>
                            <Button
                                variant="outlined"
                                onClick={handleDisconnect}
                                sx={{ ml: 2 }}
                            >
                                Ngắt kết nối
                            </Button>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Timeline Components */}
            <Grid container spacing={4}>
                {/* Full Timeline */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Timeline Đầy Đủ
                        </Typography>
                        <WorkflowNodeTimeline
                            userId={user.id}
                            executionId={activeExecutionId}
                            contentId={activeContentId}
                            height={500}
                            showHeader={false}
                        />
                    </Paper>
                </Grid>

                {/* Compact Timeline */}
                <Grid item xs={12} md={6}>
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Timeline Compact
                        </Typography>
                        <WorkflowNodeTimelineCompact
                            userId={user.id}
                            executionId={activeExecutionId}
                            contentId={activeContentId}
                            maxHeight={400}
                        />
                    </Box>
                </Grid>

                {/* Usage Instructions */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Hướng Dẫn Sử Dụng
                            </Typography>
                            
                            <Typography variant="body2" paragraph>
                                <strong>1. Kết nối theo Execution ID:</strong><br />
                                Nhập execution ID từ N8N để theo dõi một workflow cụ thể.
                            </Typography>
                            
                            <Typography variant="body2" paragraph>
                                <strong>2. Kết nối theo Content ID:</strong><br />
                                Nhập content ID để theo dõi tất cả workflow liên quan đến content đó.
                            </Typography>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Typography variant="subtitle2" gutterBottom>
                                Trạng thái Node:
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
                                    <Typography variant="caption">Success - Node hoàn thành thành công</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main' }} />
                                    <Typography variant="caption">Failed - Node thực thi lỗi</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }} />
                                    <Typography variant="caption">Running - Node đang thực thi</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'info.main' }} />
                                    <Typography variant="caption">Waiting - Node đang chờ</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Test Data Section */}
            <Card sx={{ mt: 4 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Test Data
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Để test timeline, bạn có thể gửi POST request đến realtime-server:
                    </Typography>
                    
                    <Paper sx={{ p: 2, bgcolor: 'grey.50', overflow: 'auto' }}>
                        <pre style={{ margin: 0, fontSize: '0.8rem' }}>
{`curl -X POST http://localhost:3001/api/v1/callback \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: super-secret" \\
  -d '{
    "executionId": "test-execution-123",
    "workflowId": "7gAouNkoNki0ymBa",
    "workflowName": "Test Workflow",
    "nodeName": "openai-generate",
    "nodeType": "openai",
    "status": "success",
    "mode": "test",
    "finishedAt": "2025-10-09 13:43:14",
    "contentId": "1759724116506793",
    "result": {
      "video_id": "",
      "content_id": "1759724116506793"
    }
  }'`}
                        </pre>
                    </Paper>
                </CardContent>
            </Card>
        </Container>
    );
};

export default WorkflowTimelinePage;