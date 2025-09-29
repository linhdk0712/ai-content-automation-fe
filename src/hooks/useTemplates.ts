import { useCallback, useState } from 'react';
import { templateService } from '../services/template.service';

interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  industry: string;
  contentType: string;
  language: string;
  tags: string[];
  variables: string[];
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  isPublic: boolean;
  isActive: boolean;
  usageCount: number;
  averageRating: number;
}

interface TemplateCategory {
  name: string;
  displayName: string;
  templateCount: number;
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

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [favoriteTemplates, setFavoriteTemplates] = useState<Template[]>([]);
  const [popularTemplates, setPopularTemplates] = useState<Template[]>([]);
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTemplates = useCallback(async (searchRequest: TemplateSearchRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await templateService.searchTemplates(searchRequest as any);
      setTemplates(results.templates as any);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to search templates';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTemplates = useCallback(async (filters: {
    industry?: string;
    contentType?: string;
    category?: string;
    limit?: number;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const searchRequest: TemplateSearchRequest = {
        industry: filters.industry,
        contentType: filters.contentType,
        category: filters.category,
        size: filters.limit || 20,
        page: 0,
        sortBy: 'updated_at',
        sortOrder: 'desc'
      };

      const results = await templateService.searchTemplates(searchRequest as any);
      setTemplates(results.templates as any);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load templates';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCategories = useCallback(async () => {
    try {
      const categoriesData = await templateService.getCategories();
      setCategories(categoriesData as any);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  const getFavoriteTemplates = useCallback(async () => {
    try {
      const favorites = await templateService.getFavoriteTemplates();
      setFavoriteTemplates(favorites as any);
    } catch (err: any) {
      console.error('Failed to load favorite templates:', err);
    }
  }, []);

  const getPopularTemplates = useCallback(async (limit: number = 10) => {
    try {
      const popular = await templateService.getPopularTemplates(limit);
      setPopularTemplates(popular as any);
    } catch (err: any) {
      console.error('Failed to load popular templates:', err);
    }
  }, []);

  const getUserTemplates = useCallback(async (page: number = 0, size: number = 20) => {
    try {
      const userTemplatesData = await templateService.getUserTemplates(page, size);
      setUserTemplates(userTemplatesData.templates as any);
    } catch (err: any) {
      console.error('Failed to load user templates:', err);
    }
  }, []);

  const getTemplateById = useCallback(async (templateId: string) => {
    try {
      return await templateService.getTemplateById(parseInt(templateId));
    } catch (err: any) {
      console.error('Failed to load template:', err);
      return null;
    }
  }, []);

  const createTemplate = useCallback(async (templateData: {
    name: string;
    description: string;
    content: string;
    category: string;
    industry?: string;
    contentType?: string;
    language?: string;
    tags?: string[];
    isPublic?: boolean;
  }) => {
    try {
      const newTemplate = await templateService.createTemplate({
        ...templateData,
        promptTemplate: templateData.content, // Use content as promptTemplate
        category: templateData.category as any
      });
      
      // Add to user templates
      setUserTemplates(prev => [newTemplate as any, ...prev]);
      
      return newTemplate;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create template';
      throw new Error(errorMessage);
    }
  }, []);

  const updateTemplate = useCallback(async (templateId: string, templateData: {
    name?: string;
    description?: string;
    content?: string;
    category?: string;
    industry?: string;
    contentType?: string;
    language?: string;
    tags?: string[];
    isPublic?: boolean;
  }) => {
    try {
      const updatedTemplate = await templateService.updateTemplate(parseInt(templateId), {
        ...templateData,
        category: templateData.category as any
      });
      
      // Update in user templates
      setUserTemplates(prev => 
        prev.map(template => 
          template.id.toString() === templateId ? updatedTemplate as any : template
        )
      );
      
      return updatedTemplate;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update template';
      throw new Error(errorMessage);
    }
  }, []);

  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      await templateService.deleteTemplate(parseInt(templateId));
      
      // Remove from user templates
      setUserTemplates(prev => prev.filter(template => template.id !== templateId));
      
      // Remove from favorites if present
      setFavoriteTemplates(prev => prev.filter(template => template.id !== templateId));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete template';
      throw new Error(errorMessage);
    }
  }, []);

  const addToFavorites = useCallback(async (templateId: string) => {
    try {
      await templateService.addToFavorites(parseInt(templateId));
      
      // Find template and add to favorites
      const template = templates.find(t => t.id === templateId) ||
                      popularTemplates.find(t => t.id === templateId) ||
                      userTemplates.find(t => t.id === templateId);
      
      if (template) {
        setFavoriteTemplates(prev => [template, ...prev]);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add to favorites';
      throw new Error(errorMessage);
    }
  }, [templates, popularTemplates, userTemplates]);

  const removeFromFavorites = useCallback(async (templateId: string) => {
    try {
      await templateService.removeFromFavorites(parseInt(templateId));
      
      // Remove from favorites
      setFavoriteTemplates(prev => prev.filter(template => template.id !== templateId));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to remove from favorites';
      throw new Error(errorMessage);
    }
  }, []);

  const rateTemplate = useCallback(async (templateId: string, rating: number) => {
    try {
      await templateService.rateTemplate(parseInt(templateId), rating);
      
      // Update template rating in all lists
      const updateRating = (template: Template) => 
        template.id === templateId ? { ...template, averageRating: rating } : template;
      
      setTemplates(prev => prev.map(updateRating));
      setFavoriteTemplates(prev => prev.map(updateRating));
      setPopularTemplates(prev => prev.map(updateRating));
      setUserTemplates(prev => prev.map(updateRating));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to rate template';
      throw new Error(errorMessage);
    }
  }, []);

  return {
    templates,
    categories,
    favoriteTemplates,
    popularTemplates,
    userTemplates,
    isLoading,
    error,
    searchTemplates,
    loadTemplates,
    getCategories,
    getFavoriteTemplates,
    getPopularTemplates,
    getUserTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    addToFavorites,
    removeFromFavorites,
    rateTemplate
  };
};