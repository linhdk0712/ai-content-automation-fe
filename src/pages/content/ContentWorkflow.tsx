import {
  Add,
  ArrowBack,
  ArrowForward,
  Cancel,
  CheckCircle,
  ExpandMore,
  MoreVert,
  Pause,
  Pending,
  Person,
  PlayArrow,
  Refresh,
  Schedule,
  Stop
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTeam } from '../../hooks/useTeam';
import { useWorkflow } from '../../hooks/useWorkflow';

interface WorkflowStep {
  id: number;
  name: string;
  description: string;
  type: 'review' | 'approval' | 'assignment' | 'notification' | 'condition';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'skipped';
  assignee?: {
    id: number;
    name: string;
    avatar?: string;
    role: string;
  };
  dueDate?: string;
  completedAt?: string;
  completedBy?: {
    id: number;
    name: string;
    avatar?: string;
  };
  comments: Array<{
    id: number;
    content: string;
    author: {
      id: number;
      name: string;
      avatar?: string;
    };
    createdAt: string;
  }>;
  requirements?: string[];
  estimatedTime?: number;
  actualTime?: number;
}

interface WorkflowInstance {
  id: number;
  contentId: number;
  workflowTemplate: {
    id: number;
    name: string;
    description: string;
  };
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'on_hold';
  currentStep: number;
  steps: WorkflowStep[];
  createdBy: {
    id: number;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  metadata?: {
    estimatedDuration?: number;
    actualDuration?: number;
    budget?: number;
    department?: string;
  };
}

const ContentWorkflow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    workflows,
    currentWorkflow,
    loading,
    error,
    loadWorkflows,
    loadWorkflow,
    updateWorkflowStep,
    assignStep,
    addComment,
    approveStep,
    rejectStep,
    completeWorkflow,
    cancelWorkflow
  } = useWorkflow();
  const { members, refreshMembers } = useTeam();

  // State management
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInstance | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [createWorkflowDialogOpen, setCreateWorkflowDialogOpen] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Load data on mount
  useEffect(() => {
    if (id) {
      loadWorkflow(parseInt(id));
    } else {
      loadWorkflows();
    }
    refreshMembers();
  }, [id]);

  const handleStepAction = async (stepId: number, action: 'approve' | 'reject' | 'complete', comment?: string) => {
    try {
      switch (action) {
        case 'approve':
          await approveStep(stepId, comment);
          break;
        case 'reject':
          await rejectStep(stepId, comment);
          break;
        case 'complete':
          await updateWorkflowStep(stepId, { status: 'completed', comments: [{ id: 0, content: comment || '', author: { id: 0, name: '' }, createdAt: '' }] });
          break;
      }
      
      // Reload workflow data
      if (id) {
        loadWorkflow(parseInt(id));
      }
    } catch (error) {
      console.error('Failed to update step:', error);
    }
  };

  const handleAssignStep = async () => {
    if (selectedStepId && assigneeId) {
      try {
        await assignStep(selectedStepId, {
          assigneeId: parseInt(assigneeId),
          dueDate: dueDate || undefined
        });
        
        setAssignDialogOpen(false);
        setSelectedStepId(null);
        setAssigneeId('');
        setDueDate('');
        
        if (id) {
          loadWorkflow(parseInt(id));
        }
      } catch (error) {
        console.error('Failed to assign step:', error);
      }
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
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      case 'skipped': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle color="success" />;
      case 'in_progress': return <PlayArrow color="primary" />;
      case 'pending': return <Pending color="warning" />;
      case 'rejected': return <Cancel color="error" />;
      case 'skipped': return <ArrowForward color="disabled" />;
      default: return <Pending />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const renderWorkflowList = () => (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Content Workflows</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateWorkflowDialogOpen(true)}
        >
          Create Workflow
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="ALL">All Status</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Assignee</InputLabel>
              <Select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                label="Assignee"
              >
                <MenuItem value="ALL">All Assignees</MenuItem>
                <MenuItem value={user?.id?.toString() || ''}>My Tasks</MenuItem>
                {members?.map((member) => (
                  <MenuItem key={member.id} value={member.id.toString()}>
                    {member.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="createdAt">Created Date</MenuItem>
                <MenuItem value="priority">Priority</MenuItem>
                <MenuItem value="dueDate">Due Date</MenuItem>
                <MenuItem value="status">Status</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => loadWorkflows()}
              fullWidth
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Workflows Grid */}
      <Grid container spacing={3}>
        {workflows.map((workflow) => (
          <Grid item xs={12} md={6} lg={4} key={workflow.id}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { boxShadow: 4 }
              }}
              onClick={() => navigate(`/content/workflow/${workflow.id}`)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" noWrap>
                    {workflow.workflowTemplate.name}
                  </Typography>
                  <IconButton size="small">
                    <MoreVert />
                  </IconButton>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip 
                    label={workflow.status} 
                    color={getStatusColor(workflow.status) as any}
                    size="small"
                  />
                  <Chip 
                    label={workflow.priority} 
                    color={getPriorityColor(workflow.priority) as any}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {workflow.workflowTemplate.description}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Avatar 
                    src={workflow.createdBy.avatar} 
                    sx={{ width: 24, height: 24 }}
                  >
                    {workflow.createdBy.name.charAt(0)}
                  </Avatar>
                  <Typography variant="caption" color="text.secondary">
                    Created by {workflow.createdBy.name}
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={(workflow.currentStep / workflow.steps.length) * 100}
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Step {workflow.currentStep} of {workflow.steps.length}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(workflow.createdAt).toLocaleDateString()}
                  </Typography>
                  <Button size="small">
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderWorkflowDetails = () => {
    if (!currentWorkflow) return null;

    return (
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <IconButton onClick={() => navigate('/content/workflows')}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h4">
                {currentWorkflow.workflowTemplate.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                label={currentWorkflow.status} 
                color={getStatusColor(currentWorkflow.status) as any}
              />
              <Chip 
                label={currentWorkflow.priority} 
                color={getPriorityColor(currentWorkflow.priority) as any}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {currentWorkflow.status === 'active' && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Pause />}
                  onClick={() => {/* Handle pause */}}
                >
                  Pause
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Stop />}
                  onClick={() => cancelWorkflow(currentWorkflow.id)}
                >
                  Cancel
                </Button>
              </>
            )}
            <Button
              variant="contained"
              startIcon={<CheckCircle />}
              onClick={() => completeWorkflow(currentWorkflow.id)}
              disabled={currentWorkflow.status !== 'active'}
            >
              Complete
            </Button>
          </Box>
        </Box>

        {/* Workflow Info */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Workflow Progress
                </Typography>
                
                <Stepper activeStep={currentWorkflow.currentStep - 1} orientation="vertical">
                  {currentWorkflow.steps.map((step) => (
                    <Step key={step.id}>
                      <StepLabel
                        StepIconComponent={() => getStatusIcon(step.status)}
                        optional={
                          step.assignee && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                              <Avatar 
                                src={step.assignee.avatar} 
                                sx={{ width: 16, height: 16 }}
                              >
                                {step.assignee.name.charAt(0)}
                              </Avatar>
                              <Typography variant="caption">
                                {step.assignee.name}
                              </Typography>
                            </Box>
                          )
                        }
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {step.name}
                          </Typography>
                          <Chip 
                            label={step.status} 
                            color={getStatusColor(step.status) as any}
                            size="small"
                          />
                        </Box>
                      </StepLabel>
                      
                      <StepContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {step.description}
                        </Typography>

                        {step.requirements && step.requirements.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Requirements:
                            </Typography>
                            <List dense>
                              {step.requirements.map((req, reqIndex) => (
                                <ListItem key={reqIndex}>
                                  <ListItemText primary={req} />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}

                        {step.dueDate && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Schedule fontSize="small" color="warning" />
                            <Typography variant="body2" color="text.secondary">
                              Due: {new Date(step.dueDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}

                        {step.status === 'pending' && step.assignee?.id === user?.id && (
                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleStepAction(step.id, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleStepAction(step.id, 'reject')}
                            >
                              Reject
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setSelectedStepId(step.id);
                                setCommentDialogOpen(true);
                              }}
                            >
                              Add Comment
                            </Button>
                          </Box>
                        )}

                        {!step.assignee && currentWorkflow.status === 'active' && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Person />}
                            onClick={() => {
                              setSelectedStepId(step.id);
                              setAssignDialogOpen(true);
                            }}
                          >
                            Assign
                          </Button>
                        )}

                        {step.comments.length > 0 && (
                          <Accordion sx={{ mt: 2 }}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Typography variant="subtitle2">
                                Comments ({step.comments.length})
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <List>
                                {step.comments.map((comment) => (
                                  <ListItem key={comment.id} divider>
                                    <ListItemAvatar>
                                      <Avatar src={comment.author.avatar}>
                                        {comment.author.name.charAt(0)}
                                      </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                      primary={comment.content}
                                      secondary={
                                        <Box>
                                          <Typography variant="caption">
                                            {comment.author.name}
                                          </Typography>
                                          <Typography variant="caption" sx={{ ml: 1 }}>
                                            {new Date(comment.createdAt).toLocaleString()}
                                          </Typography>
                                        </Box>
                                      }
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </AccordionDetails>
                          </Accordion>
                        )}
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            {/* Workflow Metadata */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Workflow Details
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Created By"
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Avatar 
                            src={currentWorkflow.createdBy.avatar} 
                            sx={{ width: 20, height: 20 }}
                          >
                            {currentWorkflow.createdBy.name.charAt(0)}
                          </Avatar>
                          {currentWorkflow.createdBy.name}
                        </Box>
                      }
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText
                      primary="Created"
                      secondary={new Date(currentWorkflow.createdAt).toLocaleString()}
                    />
                  </ListItem>
                  
                  {currentWorkflow.startedAt && (
                    <ListItem>
                      <ListItemText
                        primary="Started"
                        secondary={new Date(currentWorkflow.startedAt).toLocaleString()}
                      />
                    </ListItem>
                  )}
                  
                  {currentWorkflow.completedAt && (
                    <ListItem>
                      <ListItemText
                        primary="Completed"
                        secondary={new Date(currentWorkflow.completedAt).toLocaleString()}
                      />
                    </ListItem>
                  )}
                  
                  {currentWorkflow.metadata?.estimatedDuration && (
                    <ListItem>
                      <ListItemText
                        primary="Estimated Duration"
                        secondary={`${currentWorkflow.metadata.estimatedDuration} hours`}
                      />
                    </ListItem>
                  )}
                  
                  {currentWorkflow.metadata?.department && (
                    <ListItem>
                      <ListItemText
                        primary="Department"
                        secondary={currentWorkflow.metadata.department}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>

            {/* Tags */}
            {currentWorkflow.tags.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {currentWorkflow.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading workflow data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => navigate('/content')}>
          Back to Content
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {id ? renderWorkflowDetails() : renderWorkflowList()}

      {/* Assign Step Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)}>
        <DialogTitle>Assign Step</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Assignee</InputLabel>
            <Select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              label="Assignee"
            >
              {members?.map((member) => (
                <MenuItem key={member.id} value={member.id.toString()}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={member.avatar} sx={{ width: 24, height: 24 }}>
                      {member.name.charAt(0)}
                    </Avatar>
                    {member.name} ({member.role})
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            type="datetime-local"
            label="Due Date (Optional)"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAssignStep} variant="contained">
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Comment Dialog */}
      <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)}>
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Enter your comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddComment} variant="contained">
            Add Comment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContentWorkflow;