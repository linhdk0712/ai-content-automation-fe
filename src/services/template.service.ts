import {
  BulkTemplateOperationRequest,
  BulkTemplateOperationResponse,
  CreateTemplateRequest,
  Template,
  TemplateAnalytics,
  TemplateCategory,
  TemplateExportRequest,
  TemplateImportRequest,
  TemplateImportResponse,
  TemplateLibrary,
  TemplatePerformance,
  TemplateProcessRequest,
  TemplateProcessResponse,
  TemplateSearchRequest,
  TemplateSearchResponse,
  TemplateValidationRequest,
  TemplateValidationResponse,
  UpdateTemplateRequest
} from '../types/template.types';
import api from './api';

class TemplateService {
  // Core CRUD Operations - Updated to match backend endpoints
  async searchTemplates(searchRequest: TemplateSearchRequest): Promise<TemplateSearchResponse> {
    const response = await api.get('/api/v1/templates', { params: searchRequest });
    return response.data;
  }

  async getTemplateById(templateId: number): Promise<Template> {
    const response = await api.get(`/api/v1/templates/${templateId}`);
    return response.data;
  }

  async createTemplate(templateData: CreateTemplateRequest): Promise<Template> {
    const response = await api.post('/api/v1/templates', templateData);
    return response.data;
  }

  async updateTemplate(templateId: number, templateData: UpdateTemplateRequest): Promise<Template> {
    const response = await api.put(`/api/v1/templates/${templateId}`, templateData);
    return response.data;
  }

  async deleteTemplate(templateId: number): Promise<void> {
    await api.delete(`/api/v1/templates/${templateId}`);
  }

  // Template Processing and Validation
  async processTemplate(request: TemplateProcessRequest): Promise<TemplateProcessResponse> {
    const response = await api.post(`/templates/${request.templateId}/process`, request);
    return response.data;
  }

  async validateTemplate(request: TemplateValidationRequest): Promise<TemplateValidationResponse> {
    const response = await api.post('/templates/validate', request);
    return response.data;
  }

  // Template Discovery and Browsing - Updated to match backend endpoints
  async getCategories(): Promise<TemplateCategory[]> {
    const response = await api.get('/api/v1/templates/categories');
    return response.data;
  }

  async getPopularTemplates(limit: number = 10): Promise<Template[]> {
    const response = await api.get('/templates/popular', {
      params: { limit }
    });
    return response.data;
  }

  async getFeaturedTemplates(limit: number = 10): Promise<Template[]> {
    const response = await api.get('/templates/featured', {
      params: { limit }
    });
    return response.data;
  }

  async getRecentTemplates(limit: number = 10): Promise<Template[]> {
    const response = await api.get('/templates/recent', {
      params: { limit }
    });
    return response.data;
  }

  async getRecommendedTemplates(limit: number = 10): Promise<Template[]> {
    const response = await api.get('/templates/recommendations', {
      params: { limit }
    });
    return response.data;
  }

  // User Template Management - Updated to match backend endpoints
  async getUserTemplates(page: number = 0, size: number = 20): Promise<TemplateSearchResponse> {
    const response = await api.get('/api/v1/templates/my-templates', {
      params: { page, size, sortBy: 'updatedAt', sortDir: 'desc' }
    });
    return response.data;
  }

  async getFavoriteTemplates(): Promise<Template[]> {
    const response = await api.get('/api/v1/templates/favorites');
    return response.data;
  }

  async addToFavorites(templateId: number): Promise<void> {
    await api.post(`/api/v1/templates/${templateId}/favorite`);
  }

  async removeFromFavorites(templateId: number): Promise<void> {
    await api.delete(`/api/v1/templates/${templateId}/favorite`);
  }

  async rateTemplate(templateId: number, rating: number): Promise<void> {
    await api.post(`/api/v1/templates/${templateId}/rate`, { rating });
  }

  // Template Analytics and Performance
  async getTemplateAnalytics(templateId: number, period: string = '30d'): Promise<TemplateAnalytics> {
    const response = await api.get(`/templates/${templateId}/analytics`, {
      params: { period }
    });
    return response.data;
  }

  async getTemplatePerformance(templateId: number, days: number = 30): Promise<TemplatePerformance> {
    const response = await api.get(`/templates/${templateId}/performance`, {
      params: { days }
    });
    return response.data;
  }

  async getTemplateUsageTrends(templateId: number, days: number = 30): Promise<any> {
    const response = await api.get(`/templates/${templateId}/usage-trends`, {
      params: { days }
    });
    return response.data;
  }

  // Version Control
  async getTemplateVersionHistory(templateId: number): Promise<Template[]> {
    const response = await api.get(`/templates/${templateId}/versions`);
    return response.data;
  }

  async getTemplateVersion(templateId: number, version: number): Promise<Template> {
    const response = await api.get(`/templates/${templateId}/versions/${version}`);
    return response.data;
  }

  async restoreTemplateVersion(templateId: number, version: number): Promise<Template> {
    const response = await api.post(`/templates/${templateId}/versions/${version}/restore`);
    return response.data;
  }

  // Template Duplication and Cloning
  async duplicateTemplate(templateId: number, newName?: string): Promise<Template> {
    const response = await api.post(`/templates/${templateId}/duplicate`, { newName });
    return response.data;
  }

  async cloneTemplate(templateId: number, workspaceId?: number): Promise<Template> {
    const response = await api.post(`/templates/${templateId}/clone`, { workspaceId });
    return response.data;
  }

  // Template Sharing and Collaboration
  async shareTemplate(templateId: number, shareSettings: {
    isPublic?: boolean;
    allowedUsers?: number[];
    expiresAt?: string;
    password?: string;
  }): Promise<{ shareToken: string; shareUrl: string }> {
    const response = await api.post(`/templates/${templateId}/share`, shareSettings);
    return response.data;
  }

  async getSharedTemplate(shareToken: string): Promise<Template> {
    const response = await api.get(`/templates/shared/${shareToken}`);
    return response.data;
  }

  async updateShareSettings(templateId: number, shareSettings: {
    isPublic?: boolean;
    allowedUsers?: number[];
    expiresAt?: string;
    password?: string;
  }): Promise<void> {
    await api.put(`/templates/${templateId}/share`, shareSettings);
  }

  async revokeShare(templateId: number): Promise<void> {
    await api.delete(`/templates/${templateId}/share`);
  }

  // Bulk Operations
  async bulkOperation(request: BulkTemplateOperationRequest): Promise<BulkTemplateOperationResponse> {
    const response = await api.post('/templates/bulk', request);
    return response.data;
  }

  async getBulkOperationStatus(operationId: string): Promise<BulkTemplateOperationResponse> {
    const response = await api.get(`/templates/bulk/${operationId}`);
    return response.data;
  }

  // Import/Export
  async exportTemplates(request: TemplateExportRequest): Promise<Blob> {
    const response = await api.post('/templates/export', request, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportTemplate(templateId: number, format: string = 'json'): Promise<Blob> {
    const response = await api.get(`/templates/${templateId}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }

  async importTemplates(request: TemplateImportRequest): Promise<TemplateImportResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('format', request.format);
    if (request.options) {
      formData.append('options', JSON.stringify(request.options));
    }

    const response = await api.post('/templates/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getImportStatus(importId: string): Promise<TemplateImportResponse> {
    const response = await api.get(`/templates/import/${importId}`);
    return response.data;
  }

  // Template Libraries
  async getTemplateLibraries(): Promise<TemplateLibrary[]> {
    const response = await api.get('/templates/libraries');
    return response.data;
  }

  async getTemplateLibrary(libraryId: number): Promise<TemplateLibrary> {
    const response = await api.get(`/templates/libraries/${libraryId}`);
    return response.data;
  }

  async createTemplateLibrary(libraryData: {
    name: string;
    description: string;
    templateIds: number[];
    isPublic: boolean;
  }): Promise<TemplateLibrary> {
    const response = await api.post('/templates/libraries', libraryData);
    return response.data;
  }

  async subscribeToLibrary(libraryId: number): Promise<void> {
    await api.post(`/templates/libraries/${libraryId}/subscribe`);
  }

  async unsubscribeFromLibrary(libraryId: number): Promise<void> {
    await api.delete(`/templates/libraries/${libraryId}/subscribe`);
  }

  // Template Workflow Management
  async getTemplateWorkflows(templateId: number): Promise<any[]> {
    const response = await api.get(`/templates/${templateId}/workflows`);
    return response.data;
  }

  async createTemplateWorkflow(templateId: number, workflowData: any): Promise<any> {
    const response = await api.post(`/templates/${templateId}/workflows`, workflowData);
    return response.data;
  }

  async updateTemplateWorkflow(templateId: number, workflowId: number, workflowData: any): Promise<any> {
    const response = await api.put(`/templates/${templateId}/workflows/${workflowId}`, workflowData);
    return response.data;
  }

  async deleteTemplateWorkflow(templateId: number, workflowId: number): Promise<void> {
    await api.delete(`/templates/${templateId}/workflows/${workflowId}`);
  }

  // Template Variables Management
  async getTemplateVariables(templateId: number): Promise<any[]> {
    const response = await api.get(`/templates/${templateId}/variables`);
    return response.data;
  }

  async updateTemplateVariables(templateId: number, variables: any[]): Promise<any[]> {
    const response = await api.put(`/templates/${templateId}/variables`, { variables });
    return response.data;
  }

  // Template Sections Management
  async getTemplateSections(templateId: number): Promise<any[]> {
    const response = await api.get(`/templates/${templateId}/sections`);
    return response.data;
  }

  async updateTemplateSections(templateId: number, sections: any[]): Promise<any[]> {
    const response = await api.put(`/templates/${templateId}/sections`, { sections });
    return response.data;
  }

  // Template Preview and Testing
  async generateTemplatePreview(templateId: number, variables?: Record<string, any>): Promise<string> {
    const response = await api.post(`/templates/${templateId}/preview`, { variables });
    return response.data.preview;
  }

  async testTemplate(templateId: number, testData: Record<string, any>): Promise<any> {
    const response = await api.post(`/templates/${templateId}/test`, testData);
    return response.data;
  }

  // Template Statistics
  async getTemplateStatistics(templateId: number): Promise<any> {
    const response = await api.get(`/templates/${templateId}/statistics`);
    return response.data;
  }

  async getGlobalTemplateStatistics(): Promise<any> {
    const response = await api.get('/templates/statistics');
    return response.data;
  }

  // Template Search and Filtering
  async getTemplateSuggestions(query: string, limit: number = 10): Promise<string[]> {
    const response = await api.get('/templates/suggestions', {
      params: { query, limit }
    });
    return response.data;
  }

  async getTemplateFacets(): Promise<any> {
    const response = await api.get('/templates/facets');
    return response.data;
  }

  // Template Publishing
  async publishTemplate(templateId: number): Promise<Template> {
    const response = await api.post(`/templates/${templateId}/publish`);
    return response.data;
  }

  async unpublishTemplate(templateId: number): Promise<Template> {
    const response = await api.post(`/templates/${templateId}/unpublish`);
    return response.data;
  }

  async archiveTemplate(templateId: number): Promise<Template> {
    const response = await api.post(`/templates/${templateId}/archive`);
    return response.data;
  }

  async restoreTemplate(templateId: number): Promise<Template> {
    const response = await api.post(`/templates/${templateId}/restore`);
    return response.data;
  }
}

export const templateService = new TemplateService();