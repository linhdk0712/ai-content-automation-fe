import { api } from './api';

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

interface TaskFilters {
  status?: string[];
  priority?: string[];
  assigneeIds?: string[];
  tags?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
}

class TaskService {
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.status) {
        filters.status.forEach(status => params.append('status', status));
      }
      if (filters.priority) {
        filters.priority.forEach(priority => params.append('priority', priority));
      }
      if (filters.assigneeIds) {
        filters.assigneeIds.forEach(id => params.append('assigneeIds', id));
      }
      if (filters.tags) {
        filters.tags.forEach(tag => params.append('tags', tag));
      }
      if (filters.dueDateFrom) {
        params.append('dueDateFrom', filters.dueDateFrom);
      }
      if (filters.dueDateTo) {
        params.append('dueDateTo', filters.dueDateTo);
      }
    }

    const response = await api.get(`/tasks?${params.toString()}`);
    return response.data;
  }

  async getTaskById(taskId: string): Promise<Task> {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  }

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const response = await api.post('/tasks', taskData);
    return response.data;
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const response = await api.put(`/tasks/${taskId}`, updates);
    return response.data;
  }

  async deleteTask(taskId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}`);
  }

  async assignTask(taskId: string, assigneeId: string): Promise<Task> {
    const response = await api.put(`/tasks/${taskId}/assign`, { assigneeId });
    return response.data;
  }

  async unassignTask(taskId: string): Promise<Task> {
    const response = await api.put(`/tasks/${taskId}/unassign`);
    return response.data;
  }

  async updateTaskStatus(taskId: string, status: Task['status']): Promise<Task> {
    const response = await api.put(`/tasks/${taskId}/status`, { status });
    return response.data;
  }

  async updateTaskProgress(taskId: string, progress: number): Promise<Task> {
    const response = await api.put(`/tasks/${taskId}/progress`, { progress });
    return response.data;
  }

  async addSubtask(taskId: string, title: string): Promise<SubTask> {
    const response = await api.post(`/tasks/${taskId}/subtasks`, { title });
    return response.data;
  }

  async updateSubtask(taskId: string, subtaskId: string, updates: Partial<SubTask>): Promise<SubTask> {
    const response = await api.put(`/tasks/${taskId}/subtasks/${subtaskId}`, updates);
    return response.data;
  }

  async deleteSubtask(taskId: string, subtaskId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
  }

  async addTaskComment(taskId: string, content: string): Promise<any> {
    const response = await api.post(`/tasks/${taskId}/comments`, { content });
    return response.data;
  }

  async getTaskComments(taskId: string): Promise<any[]> {
    const response = await api.get(`/tasks/${taskId}/comments`);
    return response.data;
  }

  async logTimeEntry(taskId: string, hours: number, description?: string): Promise<any> {
    const response = await api.post(`/tasks/${taskId}/time-entries`, { hours, description });
    return response.data;
  }

  async getTimeEntries(taskId: string): Promise<any[]> {
    const response = await api.get(`/tasks/${taskId}/time-entries`);
    return response.data;
  }

  async getTaskStats(): Promise<{
    totalTasks: number;
    tasksByStatus: Record<string, number>;
    tasksByPriority: Record<string, number>;
    overdueTasks: number;
    averageCompletionTime: number;
  }> {
    const response = await api.get('/tasks/stats');
    return response.data;
  }

  async getUserTasks(userId: string): Promise<Task[]> {
    const response = await api.get(`/tasks/users/${userId}`);
    return response.data;
  }

  async getOverdueTasks(): Promise<Task[]> {
    const response = await api.get('/tasks/overdue');
    return response.data;
  }

  async bulkUpdateTasks(taskIds: string[], updates: Partial<Task>): Promise<void> {
    await api.put('/tasks/bulk', { taskIds, updates });
  }

  async duplicateTask(taskId: string): Promise<Task> {
    const response = await api.post(`/tasks/${taskId}/duplicate`);
    return response.data;
  }

  async exportTasks(filters?: TaskFilters, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    
    if (filters) {
      if (filters.status) {
        filters.status.forEach(status => params.append('status', status));
      }
      if (filters.priority) {
        filters.priority.forEach(priority => params.append('priority', priority));
      }
    }

    const response = await api.get(`/tasks/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async getTaskDependencies(taskId: string): Promise<{
    dependencies: Task[];
    dependents: Task[];
  }> {
    const response = await api.get(`/tasks/${taskId}/dependencies`);
    return response.data;
  }

  async addTaskDependency(taskId: string, dependencyTaskId: string): Promise<void> {
    await api.post(`/tasks/${taskId}/dependencies`, { dependencyTaskId });
  }

  async removeTaskDependency(taskId: string, dependencyTaskId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}/dependencies/${dependencyTaskId}`);
  }
}

export const taskService = new TaskService();