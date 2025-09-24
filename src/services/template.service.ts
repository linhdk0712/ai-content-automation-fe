import api from './api';

interface CreateTemplateRequest {
  name: string;
  description: string;
  content: string;
  category: string;
  industry?: string;
  contentType?: string;
  language?: string;
  tags?: string[];
  isPublic?: boolean;
}

interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  content?: string;
  category?: string;
  industry?: string;
  contentType?: string;
  language?: string;
  tags?: string[];
  isPublic?: boolean;
}

interface TemplateSearchRequest {
  query?: string;
  category?: string;
  industry?: string;
  contentType?: string;
  language?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  size?: number;
}

class TemplateService {
  async searchTemplates(searchRequest: TemplateSearchRequest) {
    const response = await api.get('/templates/search', { params: searchRequest });
    return response.data;
  }

  async getTemplateById(templateId: string) {
    const response = await api.get(`/templates/${templateId}`);
    return response.data;
  }

  async createTemplate(templateData: CreateTemplateRequest) {
    const response = await api.post('/templates', templateData);
    return response.data;
  }

  async updateTemplate(templateId: string, templateData: UpdateTemplateRequest) {
    const response = await api.put(`/templates/${templateId}`, templateData);
    return response.data;
  }

  async deleteTemplate(templateId: string) {
    const response = await api.delete(`/templates/${templateId}`);
    return response.data;
  }

  async getCategories() {
    const response = await api.get('/templates/categories');
    return response.data;
  }

  async getPopularTemplates(limit: number = 10) {
    const response = await api.get('/templates/popular', {
      params: { limit }
    });
    return response.data;
  }

  async getUserTemplates(page: number = 0, size: number = 20) {
    const response = await api.get('/templates/user', {
      params: { page, size }
    });
    return response.data;
  }

  async getFavoriteTemplates() {
    const response = await api.get('/templates/favorites');
    return response.data;
  }

  async addToFavorites(templateId: string) {
    const response = await api.post(`/templates/${templateId}/favorite`);
    return response.data;
  }

  async removeFromFavorites(templateId: string) {
    const response = await api.delete(`/templates/${templateId}/favorite`);
    return response.data;
  }

  async rateTemplate(templateId: string, rating: number) {
    const response = await api.post(`/templates/${templateId}/rate`, { rating });
    return response.data;
  }

  async getTemplateVersionHistory(templateId: string) {
    const response = await api.get(`/templates/${templateId}/versions`);
    return response.data;
  }

  async getTemplatePerformance(templateId: string, days: number = 30) {
    const response = await api.get(`/templates/${templateId}/performance`, {
      params: { days }
    });
    return response.data;
  }

  async getTemplateUsageTrends(templateId: string, days: number = 30) {
    const response = await api.get(`/templates/${templateId}/usage-trends`, {
      params: { days }
    });
    return response.data;
  }

  async getTemplateRecommendations(limit: number = 10) {
    const response = await api.get('/templates/recommendations', {
      params: { limit }
    });
    return response.data;
  }

  async validateTemplate(content: string) {
    const response = await api.post('/templates/validate', { content });
    return response.data;
  }

  async processTemplate(templateId: string, variables: Record<string, string>) {
    const response = await api.post(`/templates/${templateId}/process`, { variables });
    return response.data;
  }

  async duplicateTemplate(templateId: string, newName?: string) {
    const response = await api.post(`/templates/${templateId}/duplicate`, { newName });
    return response.data;
  }

  async exportTemplate(templateId: string, format: string = 'json') {
    const response = await api.get(`/templates/${templateId}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }

  async importTemplate(templateData: any) {
    const response = await api.post('/templates/import', templateData);
    return response.data;
  }

  async shareTemplate(templateId: string, shareSettings: {
    isPublic?: boolean;
    allowedUsers?: string[];
    expiresAt?: string;
  }) {
    const response = await api.post(`/templates/${templateId}/share`, shareSettings);
    return response.data;
  }

  async getSharedTemplate(shareToken: string) {
    const response = await api.get(`/templates/shared/${shareToken}`);
    return response.data;
  }
}

export const templateService = new TemplateService();