import React from 'react';
import {
    Box,
    Typography,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    CircularProgress,
    Alert,
    Badge
} from '@mui/material';
import {
    CheckCircle,
    Error,
    PlayArrow,
    Schedule,
    Wifi,
    WifiOff
} from '@mui/icons-material';
import { useWorkflowNodeTimeline } from '../../hooks/useWorkflowNodeTimeline';

interface WorkflowNodeTimelineCompactProps {
    userId: number;
    executionId?: string;
    contentId?: string;
    maxHeight?: number;
    showConnectionStatus?: boolean;
}

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'success':
            return <CheckCircle color="success" fontSize="small" />;
        case 'failed':
            return <Error color="error" fontSize="small" />;
        case 'running':
            return <CircularProgress size={16} />;
        case 'waiting':
            return <Schedule color="action" fontSize="small" />;
        default:
            return <Schedule color="action" fontSize="small" />;
    }
};

const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
    switch (status) {
        case 'success':
            return 'success';
        case 'failed':
            return 'error';
        case 'running':
            return 'warning';
        case 'waiting':
            return 'info';
        default:
            return 'default';
    }
};

const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

export const WorkflowNodeTimelineCompact: React.FC<WorkflowNodeTimelineCompactProps> = ({
    userId,
    executionId,
    contentId,
    maxHeight = 300,
    showConnectionStatus = true
}) => {
    const {
        executions,
        currentExecution,
        error,
        socketConnected
    } = useWorkflowNodeTimeline({
        userId,
        executionId,
        contentId,
        autoConnect: true
    });

    // Get the most recent execution or current execution
    const displayExecution = currentExecution || executions[0];

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    if (!displayExecution) {
        return (
            <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Schedule sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                    Chưa có workflow nào đang chạy
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ overflow: 'hidden' }}>
            {/* Header */}
            <Box sx={{ 
                p: 2, 
                borderBottom: 1, 
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Box>
                    <Typography variant="subtitle2" noWrap>
                        {displayExecution.workflowName || 'Workflow Timeline'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {displayExecution.nodes.length} nodes
                    </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={displayExecution.status}
                        size="small"
                        color={getStatusColor(displayExecution.status) as any}
                        sx={{ fontSize: '0.7rem' }}
                    />
                    
                    {showConnectionStatus && (
                        <Badge
                            color={socketConnected ? 'success' : 'error'}
                            variant="dot"
                        >
                            {socketConnected ? 
                                <Wifi fontSize="small" color="success" /> : 
                                <WifiOff fontSize="small" color="error" />
                            }
                        </Badge>
                    )}
                </Box>
            </Box>

            {/* Node List */}
            <Box sx={{ maxHeight, overflow: 'auto' }}>
                {displayExecution.nodes.length === 0 ? (
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        height: 150,
                        color: 'text.secondary'
                    }}>
                        <CircularProgress sx={{ mb: 2 }} />
                        <Typography variant="body2">
                            Đang chờ node đầu tiên...
                        </Typography>
                    </Box>
                ) : (
                    <List dense sx={{ py: 0 }}>
                        {displayExecution.nodes.map((node, index) => (
                            <ListItem
                                key={`${node.nodeName}-${node.timestamp}`}
                                sx={{
                                    borderBottom: index < displayExecution.nodes.length - 1 ? 1 : 0,
                                    borderColor: 'divider'
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    {getStatusIcon(node.status)}
                                </ListItemIcon>
                                
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" component="span">
                                                {node.nodeName}
                                            </Typography>
                                            <Chip
                                                label={node.nodeType}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontSize: '0.6rem', height: 16 }}
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <Typography variant="caption" color="text.secondary">
                                            {formatTime(node.timestamp)}
                                            {node.result?.content_id && (
                                                <> • Content: {node.result.content_id}</>
                                            )}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
        </Paper>
    );
};

export default WorkflowNodeTimelineCompact;