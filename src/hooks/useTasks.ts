import { useState, useEffect } from 'react';
import { taskService } from '../services/task.service';

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

interface UseTasksReturn {
  tasks: Task[] | null;
  loading: boolean;
  error: string | null;
  createTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  assignTask: (taskId: string, assigneeId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  updateTaskProgress: (taskId: string, progress: number) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

export const useTasks = (): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: Partial<Task>) => {
    try {
      setLoading(true);
      const newTask = await taskService.createTask(taskData);
      setTasks(prev => [newTask, ...(prev || [])]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      setLoading(true);
      const updatedTask = await taskService.updateTask(taskId, updates);
      
      // Update task in local state
      setTasks(prev => 
        prev?.map(task => 
          task.id === taskId ? updatedTask : task
        ) || null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      setLoading(true);
      await taskService.deleteTask(taskId);
      
      // Remove task from local state
      setTasks(prev => 
        prev?.filter(task => task.id !== taskId) || null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const assignTask = async (taskId: string, assigneeId: string) => {
    try {
      setLoading(true);
      const updatedTask = await taskService.assignTask(taskId, assigneeId);
      
      // Update task in local state
      setTasks(prev => 
        prev?.map(task => 
          task.id === taskId ? updatedTask : task
        ) || null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      setLoading(true);
      const updatedTask = await taskService.updateTaskStatus(taskId, status);
      
      // Update task in local state
      setTasks(prev => 
        prev?.map(task => 
          task.id === taskId ? updatedTask : task
        ) || null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task status');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTaskProgress = async (taskId: string, progress: number) => {
    try {
      const updatedTask = await taskService.updateTaskProgress(taskId, progress);
      
      // Update task in local state optimistically
      setTasks(prev => 
        prev?.map(task => 
          task.id === taskId ? { ...task, progress } : task
        ) || null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task progress');
      // Refresh tasks on error to get correct state
      await fetchTasks();
      throw err;
    }
  };

  const refreshTasks = async () => {
    await fetchTasks();
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    assignTask,
    updateTaskStatus,
    updateTaskProgress,
    refreshTasks
  };
};