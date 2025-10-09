import { api } from './api';

interface AIProviderConfig {
  id?: number;
  name: string;
  displayName: string;
  description?: string;
  apiEndpoint: string;
  apiKey?: string;
  apiVersion?: string;
  maxTokens?: number;
  supportedModels?: string[];
  supportedContentTypes?: string[];
  isEnabled: boolean;
  isAvailable?: boolean;
  providerType: string;
  priorityOrder?: number;
  requestsPerMinute?: number;
  tokensPerMinute?: number;
  maxConcurrentRequests?: number;
  configuration?: Record<string, any>;
  capabilities?: Record<string, any>;
}

interface ListOfValuesConfig {
  id?: number;
  category: string;
  value: string;
  label: string;
  displayLabel: string;
  description?: string;
  sortOrder: number;
  active: boolean;
  language: string;
  userId?: number; // For user-specific values
}

class AdminService {
  // AI Provider Management
  async getAIProviders(): Promise<AIProviderConfig[]> {
    const response = await api.get('/admin/ai-providers');
    return response.data.data || response.data;
  }

  async createAIProvider(provider: AIProviderConfig): Promise<AIProviderConfig> {
    const response = await api.post('/admin/ai-providers', provider);
    return response.data.data || response.data;
  }

  async updateAIProvider(id: number, provider: AIProviderConfig): Promise<AIProviderConfig> {
    const response = await api.put(`/admin/ai-providers/${id}`, provider);
    return response.data.data || response.data;
  }

  async deleteAIProvider(id: number): Promise<void> {
    await api.delete(`/admin/ai-providers/${id}`);
  }

  async testAIProvider(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/admin/ai-providers/${id}/test`);
    return response.data.data || response.data;
  }

  // List of Values Management
  async getListOfValues(category?: string): Promise<ListOfValuesConfig[]> {
    const url = category ? `/admin/list-of-values?category=${category}` : '/admin/list-of-values';
    const response = await api.get(url);
    return response.data.data || response.data;
  }

  async createListOfValue(config: ListOfValuesConfig): Promise<ListOfValuesConfig> {
    const response = await api.post('/admin/list-of-values', config);
    return response.data.data || response.data;
  }

  async updateListOfValue(id: number, config: ListOfValuesConfig): Promise<ListOfValuesConfig> {
    const response = await api.put(`/admin/list-of-values/${id}`, config);
    return response.data.data || response.data;
  }

  async deleteListOfValue(id: number): Promise<void> {
    await api.delete(`/admin/list-of-values/${id}`);
  }

  async getListOfValueCategories(): Promise<string[]> {
    const response = await api.get('/admin/list-of-values/categories');
    return response.data.data || response.data;
  }

  // User Management
  async getUsers(page: number = 0, size: number = 20): Promise<{
    content: any[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await api.get(`/admin/users?page=${page}&size=${size}`);
    return response.data.data || response.data;
  }

  async getUserById(id: number): Promise<any> {
    const response = await api.get(`/admin/users/${id}`);
    return response.data.data || response.data;
  }

  async updateUserRole(id: number, role: string): Promise<any> {
    const response = await api.put(`/admin/users/${id}/role`, { role });
    return response.data.data || response.data;
  }

  async deactivateUser(id: number): Promise<void> {
    await api.put(`/admin/users/${id}/deactivate`);
  }

  async activateUser(id: number): Promise<void> {
    await api.put(`/admin/users/${id}/activate`);
  }

  // System Settings
  async getSystemSettings(): Promise<any> {
    const response = await api.get('/admin/system/settings');
    return response.data.data || response.data;
  }

  async updateSystemSettings(settings: any): Promise<any> {
    const response = await api.put('/admin/system/settings', settings);
    return response.data.data || response.data;
  }

  // Analytics and Reports
  async getSystemStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalContent: number;
    aiRequestsToday: number;
  }> {
    const response = await api.get('/admin/stats');
    return response.data.data || response.data;
  }

  async getUsageReport(startDate: string, endDate: string): Promise<any> {
    const response = await api.get(`/admin/reports/usage?startDate=${startDate}&endDate=${endDate}`);
    return response.data.data || response.data;
  }

  // Content Management
  async getAllContent(page: number = 0, size: number = 20): Promise<{
    content: any[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await api.get(`/admin/content?page=${page}&size=${size}`);
    return response.data.data || response.data;
  }

  async deleteContent(id: number): Promise<void> {
    await api.delete(`/admin/content/${id}`);
  }

  async moderateContent(id: number, action: 'approve' | 'reject', reason?: string): Promise<void> {
    await api.post(`/admin/content/${id}/moderate`, { action, reason });
  }
}

export const adminService = new AdminService();