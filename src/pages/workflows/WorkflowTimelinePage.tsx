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
import { useI18n } from '../../hooks/useI18n';

export const WorkflowTimelinePage: React.FC = () => {
    const { user } = useAuth();
    const { t } = useI18n();
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
                    {t('workflowTimeline.loginRequired')}
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimelineIcon />
                    {t('workflowTimeline.title')}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {t('workflowTimeline.description')}
                </Typography>
            </Box>

            {/* Connection Controls */}
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        {t('workflowTimeline.connectTimeline')}
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                                <TextField
                                    label={t('workflowTimeline.executionId')}
                                    value={executionId}
                                    onChange={(e) => setExecutionId(e.target.value)}
                                    placeholder={t('workflowTimeline.executionIdPlaceholder')}
                                    fullWidth
                                    size="small"
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleConnectToExecution}
                                    disabled={!executionId.trim()}
                                    startIcon={<PlayArrow />}
                                >
                                    {t('workflowTimeline.connect')}
                                </Button>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                                <TextField
                                    label={t('workflowTimeline.contentId')}
                                    value={contentId}
                                    onChange={(e) => setContentId(e.target.value)}
                                    placeholder={t('workflowTimeline.contentIdPlaceholder')}
                                    fullWidth
                                    size="small"
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleConnectToContent}
                                    disabled={!contentId.trim()}
                                    startIcon={<PlayArrow />}
                                >
                                    {t('workflowTimeline.connect')}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>

                    {(activeExecutionId || activeContentId) && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Alert severity="info" sx={{ flex: 1 }}>
                                {t('workflowTimeline.tracking')}: {activeExecutionId ? `Execution ${activeExecutionId}` : `Content ${activeContentId}`}
                            </Alert>
                            <Button
                                variant="outlined"
                                onClick={handleDisconnect}
                                sx={{ ml: 2 }}
                            >
                                {t('workflowTimeline.disconnect')}
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
                            {t('workflowTimeline.fullTimeline')}
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
                            {t('workflowTimeline.compactTimeline')}
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
                                {t('workflowTimeline.usageGuide')}
                            </Typography>

                            <Typography variant="body2" paragraph>
                                <strong>{t('workflowTimeline.connectByExecutionId')}</strong><br />
                                {t('workflowTimeline.connectByExecutionIdDesc')}
                            </Typography>

                            <Typography variant="body2" paragraph>
                                <strong>{t('workflowTimeline.connectByContentId')}</strong><br />
                                {t('workflowTimeline.connectByContentIdDesc')}
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="subtitle2" gutterBottom>
                                {t('workflowTimeline.nodeStatuses')}:
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
                                    <Typography variant="caption">{t('workflowTimeline.nodeStatusSuccess')}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main' }} />
                                    <Typography variant="caption">{t('workflowTimeline.nodeStatusFailed')}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }} />
                                    <Typography variant="caption">{t('workflowTimeline.nodeStatusRunning')}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'info.main' }} />
                                    <Typography variant="caption">{t('workflowTimeline.nodeStatusWaiting')}</Typography>
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
                        {t('workflowTimeline.testData')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        {t('workflowTimeline.testDataDescription')}
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