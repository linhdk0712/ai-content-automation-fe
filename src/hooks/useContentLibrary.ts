import { useCallback, useState } from 'react';
import { contentService } from '../services/content.service';
import {
    BulkOperationResponse,
    ContentExportRequest,
    ContentExportResponse,
    ContentLibraryRequest,
    ContentLibraryStatsResponse,
    ContentResponse,
    ContentSearchRequest,
    ContentTagResponse,
    PaginatedResponse
} from '../types/api.types';

export interface UseContentLibraryReturn {
  // Data
  content: PaginatedResponse<ContentResponse> | null;
  favorites: PaginatedResponse<ContentResponse> | null;
  stats: ContentLibraryStatsResponse | null;
  popularTags: ContentTagResponse[];
  
  // Loading states
  loading: boolean;
  favoritesLoading: boolean;
  statsLoading: boolean;
  tagsLoading: boolean;
  
  // Error states
  error: string | null;
  favoritesError: string | null;
  statsError: string | null;
  tagsError: string | null;
  
  // Actions
  loadContentLibrary: (request: ContentLibraryRequest) => Promise<void>;
  searchContent: (request: ContentSearchRequest) => Promise<void>;
  loadFavorites: (page?: number, size?: number) => Promise<void>;
  loadStats: (workspaceId?: number) => Promise<void>;
  loadPopularTags: (limit?: number) => Promise<void>;
  toggleFavorite: (contentId: number) => Promise<void>;
  bulkStar: (contentIds: number[]) => Promise<BulkOperationResponse>;
  bulkArchive: (contentIds: number[]) => Promise<BulkOperationResponse>;
  bulkDelete: (contentIds: number[]) => Promise<BulkOperationResponse>;
  exportLibrary: (request: ContentExportRequest) => Promise<ContentExportResponse>;
  getRecentContent: (page?: number, size?: number) => Promise<void>;
  getContentByType: (contentType: string, page?: number, size?: number) => Promise<void>;
}

export const useContentLibrary = (): UseContentLibraryReturn => {
  // Data states
  const [content, setContent] = useState<PaginatedResponse<ContentResponse> | null>(null);
  const [favorites, setFavorites] = useState<PaginatedResponse<ContentResponse> | null>(null);
  const [stats, setStats] = useState<ContentLibraryStatsResponse | null>(null);
  const [popularTags, setPopularTags] = useState<ContentTagResponse[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [tagsError, setTagsError] = useState<string | null>(null);

  // Load content library
  const loadContentLibrary = useCallback(async (request: ContentLibraryRequest) => {
    try {
      setLoading(true);
      setError(null);
      const data = await contentService.getContentLibrary(request);
      setContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content library');
    } finally {
      setLoading(false);
    }
  }, []);

  // Search content
  const searchContent = useCallback(async (request: ContentSearchRequest) => {
    try {
      setLoading(true);
      setError(null);
      const data = await contentService.searchContentLibrary(request);
      setContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search content');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load favorites
  const loadFavorites = useCallback(async (page = 0, size = 20) => {
    try {
      setFavoritesLoading(true);
      setFavoritesError(null);
      const data = await contentService.getUserFavorites(page, size);
      setFavorites(data);
    } catch (err) {
      setFavoritesError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setFavoritesLoading(false);
    }
  }, []);

  // Load library stats
  const loadStats = useCallback(async (workspaceId?: number) => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      const data = await contentService.getLibraryStats(workspaceId);
      setStats(data);
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : 'Failed to load library stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load popular tags
  const loadPopularTags = useCallback(async (limit = 20) => {
    try {
      setTagsLoading(true);
      setTagsError(null);
      const data = await contentService.getPopularTags(limit);
      setPopularTags(data);
    } catch (err) {
      setTagsError(err instanceof Error ? err.message : 'Failed to load popular tags');
    } finally {
      setTagsLoading(false);
    }
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback(async (contentId: number) => {
    try {
      await contentService.toggleFavorite(contentId);
      // Refresh favorites if currently loaded
      if (favorites) {
        await loadFavorites();
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      throw err;
    }
  }, [favorites, loadFavorites]);

  // Bulk star
  const bulkStar = useCallback(async (contentIds: number[]): Promise<BulkOperationResponse> => {
    try {
      const result = await contentService.bulkStar(contentIds);
      // Refresh favorites if currently loaded
      if (favorites) {
        await loadFavorites();
      }
      return result;
    } catch (err) {
      console.error('Failed to bulk star:', err);
      throw err;
    }
  }, [favorites, loadFavorites]);

  // Bulk archive
  const bulkArchive = useCallback(async (contentIds: number[]): Promise<BulkOperationResponse> => {
    try {
      const result = await contentService.bulkArchive(contentIds);
      // Refresh content library if currently loaded
      if (content) {
        // Reload with current filters
        const currentRequest: ContentLibraryRequest = {
          page: content.number,
          size: content.size,
          // Add other current filters as needed
        };
        await loadContentLibrary(currentRequest);
      }
      return result;
    } catch (err) {
      console.error('Failed to bulk archive:', err);
      throw err;
    }
  }, [content, loadContentLibrary]);

  // Bulk delete
  const bulkDelete = useCallback(async (contentIds: number[]): Promise<BulkOperationResponse> => {
    try {
      const result = await contentService.bulkDeleteLibrary(contentIds);
      // Refresh content library if currently loaded
      if (content) {
        // Reload with current filters
        const currentRequest: ContentLibraryRequest = {
          page: content.number,
          size: content.size,
          // Add other current filters as needed
        };
        await loadContentLibrary(currentRequest);
      }
      return result;
    } catch (err) {
      console.error('Failed to bulk delete:', err);
      throw err;
    }
  }, [content, loadContentLibrary]);

  // Export library
  const exportLibrary = useCallback(async (request: ContentExportRequest): Promise<ContentExportResponse> => {
    try {
      return await contentService.exportContentLibrary(request);
    } catch (err) {
      console.error('Failed to export library:', err);
      throw err;
    }
  }, []);

  // Get recent content
  const getRecentContent = useCallback(async (page = 0, size = 20) => {
    try {
      setLoading(true);
      setError(null);
      const data = await contentService.getRecentContent(page, size);
      setContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recent content');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get content by type
  const getContentByType = useCallback(async (contentType: string, page = 0, size = 20) => {
    try {
      setLoading(true);
      setError(null);
      const data = await contentService.getContentByType(contentType as any, page, size);
      setContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content by type');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Data
    content,
    favorites,
    stats,
    popularTags,
    
    // Loading states
    loading,
    favoritesLoading,
    statsLoading,
    tagsLoading,
    
    // Error states
    error,
    favoritesError,
    statsError,
    tagsError,
    
    // Actions
    loadContentLibrary,
    searchContent,
    loadFavorites,
    loadStats,
    loadPopularTags,
    toggleFavorite,
    bulkStar,
    bulkArchive,
    bulkDelete,
    exportLibrary,
    getRecentContent,
    getContentByType
  };
};
