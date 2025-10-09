import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Collapse,
    IconButton,
    Alert,
    CircularProgress,
    Tooltip,
    Badge,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider
} from '@mui/material';
import {
    CheckCircle,
    Error,
    PlayArrow,
    Schedule,
    ExpandMore,
    ExpandLess,
    Refresh,
    WifiOff,
    Wifi,
    FiberManualRecord
} from '@mui/icons-material';
import { useWorkflowNodeTimeline, WorkflowExecution, WorkflowNodeUpdate } from '../../hooks/useWorkflowNodeTimeline';

interface WorkflowNodeTimelineProps {
    userId: number;
    executionId?: string;
    contentId?: string;
    height?: number;
    showHeader?: boolean;
    autoConnect?: boolean;
}

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'success':
            return <CheckCircle color="success" />;
        case 'failed':
            return <Error color="error" />;
        case 'running':
            return <CircularProgress size={20} />;
        case 'waiting':
            return <Schedule color="action" />;
        default:
            return <Schedule color="action" />;
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

const NodeTimelineItem: React.FC<{ node: WorkflowNodeUpdate; isLast: boolean }> = ({ node, isLast }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <Box sx={{ display: 'flex', mb: 2 }}>
            {/* Timeline dot and connector */}
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                mr: 2,
                minWidth: 24
            }}>
                <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `${getStatusColor(node.status)}.main`,
                    color: 'white'
                }}>
                    {getStatusIcon(node.status)}
                </Box>
                {!isLast && (
                    <Box sx={{ 
                        width: 2, 
                        height: 40, 
                        bgcolor: 'divider',
                        mt: 1
                    }} />
                )}
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" component="span">
                        {node.nodeName}
                    </Typography>
                    <Chip
                        label={node.nodeType}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                    <Chip
                        label={node.status}
                        size="small"
                        color={getStatusColor(node.status)}
                        sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                </Box>
                
                <Typography variant="caption" color="text.secondary">
                    {formatTime(node.timestamp)}
                    {node.finishedAt && node.finishedAt !== node.timestamp && (
                        <> - {formatTime(node.finishedAt)}</>
                    )}
                </Typography>

                {node.result && Object.keys(node.result).length > 0 && (
                    <Box sx={{ mt: 0.5 }}>
                        <IconButton
                            size="small"
                            onClick={() => setExpanded(!expanded)}
                            sx={{ p: 0.5 }}
                        >
                            {expanded ? <ExpandLess /> : <ExpandMore />}
                            <Typography variant="caption" sx={{ ml: 0.5 }}>
                                Kết quả
                            </Typography>
                        </IconButton>
                        
                        <Collapse in={expanded}>
                            <Box sx={{ 
                                mt: 1, 
                                p: 1, 
                                bgcolor: 'grey.50', 
                                borderRadius: 1,
                                fontSize: '0.75rem'
                            }}>
                                <pre style={{ 
                                    margin: 0, 
                                    fontSize: 'inherit',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word'
                                }}>
                                    {JSON.stringify(node.result, null, 2)}
                                </pre>
                            </Box>
                        </Collapse>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

const ExecutionCard: React.FC<{ 
    execution: WorkflowExecution; 
    isActive: boolean;
    onSelect: () => void;
}> = ({ execution, isActive, onSelect }) => {
    const getExecutionStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'failed':
                return 'error';
            case 'running':
                return 'warning';
            default:
                return 'default';
        }
    };

    const successCount = execution.nodes.filter(n => n.status === 'success').length;
    const failedCount = execution.nodes.filter(n => n.status === 'failed').length;
    const runningCount = execution.nodes.filter(n => n.status === 'running').length;

    return (
        <Card 
            sx={{ 
                mb: 1, 
                cursor: 'pointer',
                border: isActive ? 2 : 1,
                borderColor: isActive ? 'primary.main' : 'divider'
            }}
            onClick={onSelect}
        >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                        <Typography variant="subtitle2" noWrap>
                            {execution.workflowName || `Workflow ${execution.workflowId.slice(0, 8)}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {formatTime(execution.startedAt)}
                        </Typography>
                    </Box>
                    <Chip
                        label={execution.status}
                        size="small"
                        color={getExecutionStatusColor(execution.status) as any}
                        sx={{ fontSize: '0.7rem' }}
                    />
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {successCount > 0 && (
                        <Chip
                            icon={<CheckCircle />}
                            label={successCount}
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                    )}
                    {failedCount > 0 && (
                        <Chip
                            icon={<Error />}
                            label={failedCount}
                            size="small"
                            color="error"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                    )}
                    {runningCount > 0 && (
                        <Chip
                            icon={<PlayArrow />}
                            label={runningCount}
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export const WorkflowNodeTimeline: React.FC<WorkflowNodeTimelineProps> = ({
    userId,
    executionId,
    contentId,
    height = 400,
    showHeader = true,
    autoConnect = true
}) => {
    const {
        executions,
        currentExecution,
        loading,
        error,
        socketConnected,
        connectToExecution,
        connectToContent,
        disconnect,
        clearHistory
    } = useWorkflowNodeTimeline({
        userId,
        executionId,
        contentId,
        autoConnect
    });

    const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);

    const handleExecutionSelect = (execution: WorkflowExecution) => {
        setSelectedExecution(execution);
        connectToExecution(execution.executionId);
    };

    const displayExecution = selectedExecution || currentExecution;

    return (
        <Box sx={{ height, display: 'flex', flexDirection: 'column' }}>
            {showHeader && (
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 2,
                    p: 2,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'divider'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6">
                            Timeline Workflow
                        </Typography>
                        <Badge
                            color={socketConnected ? 'success' : 'error'}
                            variant="dot"
                        >
                            {socketConnected ? <Wifi /> : <WifiOff />}
                        </Badge>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Làm mới">
                            <IconButton size="small" onClick={() => window.location.reload()}>
                                <Refresh />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: 'flex', flex: 1, gap: 2, overflow: 'hidden' }}>
                {/* Execution List */}
                <Box sx={{ width: 300, overflow: 'auto' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, px: 1 }}>
                        Executions ({executions.length})
                    </Typography>
                    
                    {executions.length === 0 ? (
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center', 
                            justifyContent: 'center',
                            height: 200,
                            color: 'text.secondary'
                        }}>
                            <Schedule sx={{ fontSize: 48, mb: 1 }} />
                            <Typography variant="body2">
                                Chưa có workflow nào chạy
                            </Typography>
                        </Box>
                    ) : (
                        executions.map(execution => (
                            <ExecutionCard
                                key={execution.executionId}
                                execution={execution}
                                isActive={displayExecution?.executionId === execution.executionId}
                                onSelect={() => handleExecutionSelect(execution)}
                            />
                        ))
                    )}
                </Box>

                {/* Node Timeline */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {displayExecution ? (
                        <Box>
                            <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    {displayExecution.workflowName || 'Workflow'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Execution ID: {displayExecution.executionId}
                                </Typography>
                                {displayExecution.contentId && (
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        Content ID: {displayExecution.contentId}
                                    </Typography>
                                )}
                            </Box>

                            {displayExecution.nodes.length === 0 ? (
                                <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    height: 200,
                                    color: 'text.secondary'
                                }}>
                                    <CircularProgress sx={{ mb: 2 }} />
                                    <Typography variant="body2">
                                        Đang chờ node đầu tiên...
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ pl: 2 }}>
                                    {displayExecution.nodes.map((node, index) => (
                                        <NodeTimelineItem
                                            key={`${node.nodeName}-${node.timestamp}`}
                                            node={node}
                                            isLast={index === displayExecution.nodes.length - 1}
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    ) : (
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center', 
                            justifyContent: 'center',
                            height: '100%',
                            color: 'text.secondary'
                        }}>
                            <PlayArrow sx={{ fontSize: 48, mb: 1 }} />
                            <Typography variant="body2">
                                Chọn một execution để xem timeline
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default WorkflowNodeTimeline;