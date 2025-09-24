import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  LinearProgress,
  Avatar,
  Tabs,
  Tab,
  Badge,
  Menu,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useTasks } from '../../hooks/useTasks';
import { useTeam } from '../../hooks/useTeam';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: {
    id: string;
    name: string;
    avatar: string;
  };
  reporter: {
    id: string;
    name: string;
    avatar: string;
  };
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  progress: number;
  tags: string[];
  contentId?: string;
  estimatedHours?: number;
  actualHours?: number;
  subtasks: SubTask[];
}

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskDialogProps {
  open: boolean;
  task?: Task | null;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
}

const TaskDialog: React.FC<TaskDialogProps> = ({ open, task, onClose, onSave }) => {
  const { members } = useTeam();
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignee: undefined,
    dueDate: undefined,
    estimatedHours: undefined,
    tags: []
  });

  useEffect(() => {
    if (task) {
      setFormData(task);
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assignee: undefined,
        dueDate: undefined,
        estimatedHours: undefined,
        tags: []
      });
    }
  }, [task, open]);

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Task Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            fullWidth
            required
          />
          
          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                label="Status"
              >
                <MenuItem value="todo">To Do</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="review">Review</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                label="Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Autocomplete
            options={members || []}
            getOptionLabel={(option) => option.name}
            value={members?.find(m => m.id === formData.assignee?.id) ?? null}
            onChange={(_, value) =>
              setFormData({
                ...formData,
                assignee: value
                  ? { id: value.id, name: value.name, avatar: value.avatar ?? '' }
                  : undefined
              })
            }
            renderInput={(params) => (
              <TextField {...params} label="Assignee" />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar src={option.avatar} sx={{ width: 24, height: 24 }}>
                  {option.name[0]}
                </Avatar>
                {option.name}
              </Box>
            )}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Due Date"
              type="date"
              value={formData.dueDate?.split('T')[0] || ''}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            
            <TextField
              label="Estimated Hours"
              type="number"
              value={formData.estimatedHours || ''}
              onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) })}
              sx={{ flex: 1 }}
            />
          </Box>

          <Autocomplete
            multiple
            freeSolo
            options={['content', 'design', 'development', 'review', 'urgent']}
            value={formData.tags || []}
            onChange={(_, value) => setFormData({ ...formData, tags: value })}
            renderInput={(params) => (
              <TextField {...params} label="Tags" placeholder="Add tags..." />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip variant="outlined" label={option} {...getTagProps({ index })} />
              ))
            }
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {task ? 'Update' : 'Create'} Task
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const TaskManager: React.FC = () => {
  const { tasks, createTask, updateTask, deleteTask } = useTasks();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      await createTask(taskData);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateTask = async (taskData: Partial<Task>) => {
    if (selectedTask) {
      try {
        await updateTask(selectedTask.id, taskData);
      } catch (error) {
        console.error('Failed to update task:', error);
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'default';
      case 'in_progress': return 'primary';
      case 'review': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'urgent': return 'error';
      default: return 'default';
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks?.filter(task => task.status === status) || [];
  };

  const getOverdueTasks = () => {
    const now = new Date();
    return tasks?.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < now && 
      task.status !== 'completed' && 
      task.status !== 'cancelled'
    ) || [];
  };

  const getMyTasks = () => {
    // In a real app, you'd get the current user ID
    return tasks?.filter(task => task.assignee?.id === 'current-user-id') || [];
  };

  const renderTaskTable = (taskList: Task[]) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Task</TableCell>
            <TableCell>Assignee</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Due Date</TableCell>
            <TableCell>Progress</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {taskList.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <Box>
                  <Typography variant="subtitle2">{task.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {task.description}
                  </Typography>
                  {task.tags.length > 0 && (
                    <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {task.tags.map(tag => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                {task.assignee ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={task.assignee.avatar} sx={{ width: 24, height: 24 }}>
                      {task.assignee.name[0]}
                    </Avatar>
                    {task.assignee.name}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Unassigned
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Chip 
                  label={task.status.replace('_', ' ')} 
                  color={getStatusColor(task.status)}
                  size="small" 
                />
              </TableCell>
              <TableCell>
                <Chip 
                  label={task.priority} 
                  color={getPriorityColor(task.priority)}
                  size="small" 
                />
              </TableCell>
              <TableCell>
                {task.dueDate ? (
                  <Typography 
                    variant="body2"
                    color={new Date(task.dueDate) < new Date() ? 'error' : 'inherit'}
                  >
                    {new Date(task.dueDate).toLocaleDateString()}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No due date
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={task.progress} 
                    sx={{ width: 60 }}
                  />
                  <Typography variant="caption">{task.progress}%</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  onClick={() => {
                    setSelectedTask(task);
                    setTaskDialogOpen(true);
                  }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteTask(task.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const todoTasks = getTasksByStatus('todo');
  const inProgressTasks = getTasksByStatus('in_progress');
  const reviewTasks = getTasksByStatus('review');
  const completedTasks = getTasksByStatus('completed');
  const overdueTasks = getOverdueTasks();
  const myTasks = getMyTasks();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Task Manager
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={(e) => setFilterAnchorEl(e.currentTarget)}>
            <FilterIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedTask(null);
              setTaskDialogOpen(true);
            }}
          >
            New Task
          </Button>
        </Box>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab 
              label={
                <Badge badgeContent={todoTasks.length} color="default">
                  To Do
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={inProgressTasks.length} color="primary">
                  In Progress
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={reviewTasks.length} color="warning">
                  Review
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={completedTasks.length} color="success">
                  Completed
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={overdueTasks.length} color="error">
                  Overdue
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={myTasks.length} color="info">
                  My Tasks
                </Badge>
              } 
            />
          </Tabs>
        </Box>

        <CardContent>
          {tabValue === 0 && renderTaskTable(todoTasks)}
          {tabValue === 1 && renderTaskTable(inProgressTasks)}
          {tabValue === 2 && renderTaskTable(reviewTasks)}
          {tabValue === 3 && renderTaskTable(completedTasks)}
          {tabValue === 4 && renderTaskTable(overdueTasks)}
          {tabValue === 5 && renderTaskTable(myTasks)}
        </CardContent>
      </Card>

      <TaskDialog
        open={taskDialogOpen}
        task={selectedTask}
        onClose={() => {
          setTaskDialogOpen(false);
          setSelectedTask(null);
        }}
        onSave={selectedTask ? handleUpdateTask : handleCreateTask}
      />

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2">Filter Tasks</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setFilterAnchorEl(null)}>
          By Status
        </MenuItem>
        <MenuItem onClick={() => setFilterAnchorEl(null)}>
          By Priority
        </MenuItem>
        <MenuItem onClick={() => setFilterAnchorEl(null)}>
          By Assignee
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TaskManager;