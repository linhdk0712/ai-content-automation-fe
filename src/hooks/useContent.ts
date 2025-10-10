import { useCallback, useState } from 'react';
import { contentService } from '../services/content.service';
import { ContentVersion, VersionControlService } from '../services/versionControl.service';
import { ContentResponse } from '../types/api.types';
import { ProcessedError, useErrorHandler } from '../utils/error-handler';

export interface UseContentReturn {
  content: ContentResponse | null;
  versions: ContentVersion[];
  loading: boolean;
  error: ProcessedError | null;
  loadContent: (id: number) => Promise<void>;
  deleteContent: (id: number) => Promise<void>;
  duplicateContent: (id: number,workspaceId: string) => Promise<void>;
  toggleStar: (id: number, workspaceId: string) => Promise<void>;
  bulkDelete: (ids: number[], workspaceId: string) => Promise<void>;
  bulkArchive: (ids: number[], workspaceId: string) => Promise<void>;
  exportContents: (id: number,fomat: string) => Promise<void>;
  getVersionHistory:(id: string) => Promise<void>;
    rollbackToVersion:(contentId: string, versionNumber: number) => Promise<void>;
    compareVersions:(contentId: string, fromVersion: number, toVersion: number) => Promise<void>;
    deleteVersion:(id: string, versionNumber: number) => Promise<void>;
    exportVersion:(versionId: string, versionNumber: number) => Promise<void>
}

export const useContent = (): UseContentReturn => {
  const [content, setContent] = useState<ContentResponse | null>(null);
  const [versions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ProcessedError | null>(null);
  const { handleError, showUserError } = useErrorHandler();
  const versionControlService = new VersionControlService();
  const loadContent = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await contentService.getContent(id);
      setContent(data);
    } catch (err) {
      const processedError = handleError(err, 'load_content');
      setError(processedError);
      showUserError(processedError);
    } finally {
      setLoading(false);
    }
  }, [handleError, showUserError]);

  const deleteContent = useCallback(async (id: number) => {
    await contentService.deleteContent(id);
    setContent(null);
  }, []);

  const duplicateContent = useCallback(async (id: number, workspaceId: string) => {
    await contentService.duplicateContent(id, { workspaceId: workspaceId });
  }, []);

  const toggleStar = useCallback(async (id: number, workspaceId: string) => {
    //await contentService.toggleStar(id, { starred: true, workspaceId: workspaceId });
    console.log('toggleStar', id, workspaceId);
  }, []);

  const bulkDelete = useCallback(async (ids: number[], workspaceId: string) => {
    await contentService.bulkDelete({ contentIds: ids, workspaceId: workspaceId });
  }, []);

  const bulkArchive = useCallback(async (ids: number[], workspaceId: string) => {
    //await contentService.bulkArchive({ contentIds: ids, workspaceId: workspaceId });
    console.log('bulkArchive', ids, workspaceId);
  }, []);

  const exportContents = useCallback(async (id: number,fomat: string) => {
    await contentService.exportContent(id,fomat as 'pdf' | 'docx' | 'html' | 'markdown');
  }, []);

  const getVersionHistory = useCallback(async (id: string) => {
    await versionControlService.getVersionHistory(id);
  }, []);

  const rollbackToVersion = useCallback(async (contentId: string, versionNumber: number) => {
    await versionControlService.rollbackToVersion(contentId, { contentId: contentId, targetVersion: versionNumber, reason: '' });
  }, []);

  const compareVersions = useCallback(async (contentId: string, fromVersion: number, toVersion: number) => {
    await versionControlService.compareVersions(contentId, fromVersion, toVersion);
  }, []);

  const deleteVersion = useCallback(async (id: string, versionNumber: number) => {
    await versionControlService.deleteVersion(id, versionNumber);
  }, []);

  const exportVersion = useCallback(async (versionId: string,versionNumber: number) => {
    await versionControlService.getVersion(versionId,versionNumber);
  }, []);

  return {
    content,
    loading,
    versions,
    error,
    loadContent,
    deleteContent,
    duplicateContent,
    toggleStar,
    bulkDelete,
    bulkArchive,
    exportContents,
    getVersionHistory,
    rollbackToVersion,
    compareVersions,
    deleteVersion,
    exportVersion
  };
};
