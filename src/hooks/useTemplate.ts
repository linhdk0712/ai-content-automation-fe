import { useCallback, useState } from 'react';
import { templateService } from '../services/template.service';
import {
    BulkTemplateOperationRequest,
    BulkTemplateOperationResponse,
    CreateTemplateRequest,
    Template,
    TemplateAnalytics,
    TemplatePerformance,
    TemplateProcessRequest,
    TemplateProcessResponse,
    TemplateSearchRequest,
    TemplateSearchResponse,
    TemplateValidationRequest,
    TemplateValidationResponse,
    UpdateTemplateRequest
} from '../types/template.types';

interface UseTemplateState {
  templates: Template[];
  currentTemplate: Template | null;
  searchResults: TemplateSearchResponse | null;
  analytics: TemplateAnalytics | null;
  performance: TemplatePerformance | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  validationErrors: any[];
  favorites: Template[];
  recentTemplates: Template[];
  popularTemplates: Template[];
}

interface UseTemplateActions {
  // Template CRUD
  searchTemplates: (request: TemplateSearchRequest) => Promise<TemplateSearchResponse>;
  getTemplate: (id: number) => Promise<Template>;
  createTemplate: (data: CreateTemplateRequest) => Promise<Template>;
  updateTemplate: (id: number, data: UpdateTemplateRequest) => Promise<Template>;
  deleteTemplate: (id: number) => Promise<void>;
  
  // Template processing
  processTemplate: (request: TemplateProcessRequest) => Promise<TemplateProcessResponse>;
  validateTemplate: (request: TemplateValidationRequest) => Promise<TemplateValidationResponse>;
  generatePreview: (id: number, variables?: Record<string, any>) => Promise<string>;
  
  // Template discovery
  getPopularTemplates: (limit?: number) => Promise<Template[]>;
  getRecentTemplates: (limit?: number) => Promise<Template[]>;
  getFeaturedTemplates: (limit?: number) => Promise<Template[]>;
  getRecommendedTemplates: (limit?: number) => Promise<Template[]>;
  
  // User templates
  getUserTemplates: (page?: number, size?: number) => Promise<TemplateSearchResponse>;
  getFavoriteTemplates: () => Promise<Template[]>;
  addToFavorites: (id: number) => Promise<void>;
  removeFromFavorites: (id: number) => Promise<void>;
  rateTemplate: (id: number, rating: number) => Promise<void>;
  
  // Template analytics
  getTemplateAnalytics: (id: number, period?: string) => Promise<TemplateAnalytics>;
  getTemplatePerformance: (id: number, days?: number) => Promise<TemplatePerformance>;
  
  // Template operations
  duplicateTemplate: (id: number, newName?: string) => Promise<Template>;
  cloneTemplate: (id: number, workspaceId?: number) => Promise<Template>;
  shareTemplate: (id: number, settings: any) => Promise<{ shareToken: string; shareUrl: string }>;
  exportTemplate: (id: number, format?: string) => Promise<Blob>;
  
  // Bulk operations
  bulkOperation: (request: BulkTemplateOperationRequest) => Promise<BulkTemplateOperationResponse>;
  
  // Publishing
  publishTemplate: (id: number) => Promise<Template>;
  unpublishTemplate: (id: number) => Promise<Template>;
  archiveTemplate: (id: number) => Promise<Template>;
  restoreTemplate: (id: number) => Promise<Template>;
  
  // State management
  setCurrentTemplate: (template: Template | null) => void;
  clearError: () => void;
  refreshTemplates: () => Promise<void>;
  resetState: () => void;
}

const initialState: UseTemplateState = {
  templates: [],
  currentTemplate: null,
  searchResults: null,
  analytics: null,
  performance: null,
  loading: false,
  saving: false,
  error: null,
  validationErrors: [],
  favorites: [],
  recentTemplates: [],
  popularTemplates: []
};

export const useTemplate = (): UseTemplateState & UseTemplateActions => {
  const [state, setState] = useState<UseTemplateState>(initialState);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setSaving = useCallback((saving: boolean) => {
    setState(prev => ({ ...prev, saving }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const setCurrentTemplate = useCallback((template: Template | null) => {
    setState(prev => ({ ...prev, currentTemplate: template }));
  }, []);

  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  // Template CRUD operations
  const searchTemplates = useCallback(async (request: TemplateSearchRequest): Promise<TemplateSearchResponse> => {
    try {
      setLoading(true);
      setError(null);
      const response = await templateService.searchTemplates(request);
      setState(prev => ({ 
        ...prev, 
        searchResults: response,
        templates: request.page === 0 ? response.templates : [...prev.templates, ...response.templates]
      }));
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to search templates';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getTemplate = useCallback(async (id: number): Promise<Template> => {
    try {
      setLoading(true);
      setError(null);
      const template = await templateService.getTemplateById(id);
      setCurrentTemplate(template);
      return template;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load template';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setCurrentTemplate]);

  const createTemplate = useCallback(async (data: CreateTemplateRequest): Promise<Template> => {
    try {
      setSaving(true);
      setError(null);
      const template = await templateService.createTemplate(data);
      setState(prev => ({ 
        ...prev, 
        templates: [template, ...prev.templates],
        currentTemplate: template
      }));
      return template;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create template';
      setError(errorMessage);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [setSaving, setError]);

  const updateTemplate = useCallback(async (id: number, data: UpdateTemplateRequest): Promise<Template> => {
    try {
      setSaving(true);
      setError(null);
      const template = await templateService.updateTemplate(id, data);
      setState(prev => ({ 
        ...prev, 
        templates: prev.templates.map(t => t.id === id ? template : t),
        currentTemplate: prev.currentTemplate?.id === id ? template : prev.currentTemplate
      }));
      return template;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update template';
      setError(errorMessage);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [setSaving, setError]);

  const deleteTemplate = useCallback(async (id: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await templateService.deleteTemplate(id);
      setState(prev => ({ 
        ...prev, 
        templates: prev.templates.filter(t => t.id !== id),
        currentTemplate: prev.currentTemplate?.id === id ? null : prev.currentTemplate
      }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete template';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Template processing
  const processTemplate = useCallback(async (request: TemplateProcessRequest): Promise<TemplateProcessResponse> => {
    try {
      setLoading(true);
      setError(null);
      const response = await templateService.processTemplate(request);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to process template';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const validateTemplate = useCallback(async (request: TemplateValidationRequest): Promise<TemplateValidationResponse> => {
    try {
      setLoading(true);
      setError(null);
      const response = await templateService.validateTemplate(request);
      setState(prev => ({ ...prev, validationErrors: response.errors }));
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to validate template';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const generatePreview = useCallback(async (id: number, variables?: Record<string, any>): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      const preview = await templateService.generateTemplatePreview(id, variables);
      return preview;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to generate preview';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Template discovery
  const getPopularTemplates = useCallback(async (limit: number = 10): Promise<Template[]> => {
    try {
      setLoading(true);
      setError(null);
      const templates = await templateService.getPopularTemplates(limit);
      setState(prev => ({ ...prev, popularTemplates: templates }));
      return templates;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load popular templates';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getRecentTemplates = useCallback(async (limit: number = 10): Promise<Template[]> => {
    try {
      setLoading(true);
      setError(null);
      const templates = await templateService.getRecentTemplates(limit);
      setState(prev => ({ ...prev, recentTemplates: templates }));
      return templates;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load recent templates';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getFeaturedTemplates = useCallback(async (limit: number = 10): Promise<Template[]> => {
    try {
      setLoading(true);
      setError(null);
      const templates = await templateService.getFeaturedTemplates(limit);
      return templates;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load featured templates';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getRecommendedTemplates = useCallback(async (limit: number = 10): Promise<Template[]> => {
    try {
      setLoading(true);
      setError(null);
      const templates = await templateService.getRecommendedTemplates(limit);
      return templates;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load recommended templates';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // User templates
  const getUserTemplates = useCallback(async (page: number = 0, size: number = 20): Promise<TemplateSearchResponse> => {
    try {
      setLoading(true);
      setError(null);
      const response = await templateService.getUserTemplates(page, size);
      setState(prev => ({ 
        ...prev, 
        templates: page === 0 ? response.templates : [...prev.templates, ...response.templates]
      }));
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load user templates';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getFavoriteTemplates = useCallback(async (): Promise<Template[]> => {
    try {
      setLoading(true);
      setError(null);
      const templates = await templateService.getFavoriteTemplates();
      setState(prev => ({ ...prev, favorites: templates }));
      return templates;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load favorite templates';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const addToFavorites = useCallback(async (id: number): Promise<void> => {
    try {
      setError(null);
      await templateService.addToFavorites(id);
      // Refresh favorites list
      getFavoriteTemplates();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to add to favorites';
      setError(errorMessage);
      throw err;
    }
  }, [setError, getFavoriteTemplates]);

  const removeFromFavorites = useCallback(async (id: number): Promise<void> => {
    try {
      setError(null);
      await templateService.removeFromFavorites(id);
      setState(prev => ({ 
        ...prev, 
        favorites: prev.favorites.filter(t => t.id !== id)
      }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to remove from favorites';
      setError(errorMessage);
      throw err;
    }
  }, [setError]);

  const rateTemplate = useCallback(async (id: number, rating: number): Promise<void> => {
    try {
      setError(null);
      await templateService.rateTemplate(id, rating);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to rate template';
      setError(errorMessage);
      throw err;
    }
  }, [setError]);

  // Template analytics
  const getTemplateAnalytics = useCallback(async (id: number, period: string = '30d'): Promise<TemplateAnalytics> => {
    try {
      setLoading(true);
      setError(null);
      const analytics = await templateService.getTemplateAnalytics(id, period);
      setState(prev => ({ ...prev, analytics }));
      return analytics;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load template analytics';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getTemplatePerformance = useCallback(async (id: number, days: number = 30): Promise<TemplatePerformance> => {
    try {
      setLoading(true);
      setError(null);
      const performance = await templateService.getTemplatePerformance(id, days);
      setState(prev => ({ ...prev, performance }));
      return performance;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load template performance';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Template operations
  const duplicateTemplate = useCallback(async (id: number, newName?: string): Promise<Template> => {
    try {
      setLoading(true);
      setError(null);
      const template = await templateService.duplicateTemplate(id, newName);
      setState(prev => ({ 
        ...prev, 
        templates: [template, ...prev.templates]
      }));
      return template;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to duplicate template';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const cloneTemplate = useCallback(async (id: number, workspaceId?: number): Promise<Template> => {
    try {
      setLoading(true);
      setError(null);
      const template = await templateService.cloneTemplate(id, workspaceId);
      setState(prev => ({ 
        ...prev, 
        templates: [template, ...prev.templates]
      }));
      return template;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to clone template';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const shareTemplate = useCallback(async (id: number, settings: any): Promise<{ shareToken: string; shareUrl: string }> => {
    try {
      setLoading(true);
      setError(null);
      const result = await templateService.shareTemplate(id, settings);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to share template';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const exportTemplate = useCallback(async (id: number, format: string = 'json'): Promise<Blob> => {
    try {
      setLoading(true);
      setError(null);
      const blob = await templateService.exportTemplate(id, format);
      return blob;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to export template';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Bulk operations
  const bulkOperation = useCallback(async (request: BulkTemplateOperationRequest): Promise<BulkTemplateOperationResponse> => {
    try {
      setLoading(true);
      setError(null);
      const response = await templateService.bulkOperation(request);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to perform bulk operation';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Publishing
  const publishTemplate = useCallback(async (id: number): Promise<Template> => {
    try {
      setLoading(true);
      setError(null);
      const template = await templateService.publishTemplate(id);
      setState(prev => ({ 
        ...prev, 
        templates: prev.templates.map(t => t.id === id ? template : t),
        currentTemplate: prev.currentTemplate?.id === id ? template : prev.currentTemplate
      }));
      return template;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to publish template';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const unpublishTemplate = useCallback(async (id: number): Promise<Template> => {
    try {
      setLoading(true);
      setError(null);
      const template = await templateService.unpublishTemplate(id);
      setState(prev => ({ 
        ...prev, 
        templates: prev.templates.map(t => t.id === id ? template : t),
        currentTemplate: prev.currentTemplate?.id === id ? template : prev.currentTemplate
      }));
      return template;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to unpublish template';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const archiveTemplate = useCallback(async (id: number): Promise<Template> => {
    try {
      setLoading(true);
      setError(null);
      const template = await templateService.archiveTemplate(id);
      setState(prev => ({ 
        ...prev, 
        templates: prev.templates.map(t => t.id === id ? template : t),
        currentTemplate: prev.currentTemplate?.id === id ? template : prev.currentTemplate
      }));
      return template;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to archive template';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const restoreTemplate = useCallback(async (id: number): Promise<Template> => {
    try {
      setLoading(true);
      setError(null);
      const template = await templateService.restoreTemplate(id);
      setState(prev => ({ 
        ...prev, 
        templates: prev.templates.map(t => t.id === id ? template : t),
        currentTemplate: prev.currentTemplate?.id === id ? template : prev.currentTemplate
      }));
      return template;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to restore template';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const refreshTemplates = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const [popular, recent, favorites] = await Promise.all([
        templateService.getPopularTemplates(10),
        templateService.getRecentTemplates(10),
        templateService.getFavoriteTemplates()
      ]);
      setState(prev => ({
        ...prev,
        popularTemplates: popular,
        recentTemplates: recent,
        favorites
      }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to refresh templates';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  return {
    ...state,
    searchTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    processTemplate,
    validateTemplate,
    generatePreview,
    getPopularTemplates,
    getRecentTemplates,
    getFeaturedTemplates,
    getRecommendedTemplates,
    getUserTemplates,
    getFavoriteTemplates,
    addToFavorites,
    removeFromFavorites,
    rateTemplate,
    getTemplateAnalytics,
    getTemplatePerformance,
    duplicateTemplate,
    cloneTemplate,
    shareTemplate,
    exportTemplate,
    bulkOperation,
    publishTemplate,
    unpublishTemplate,
    archiveTemplate,
    restoreTemplate,
    setCurrentTemplate,
    clearError,
    refreshTemplates,
    resetState
  };
};
