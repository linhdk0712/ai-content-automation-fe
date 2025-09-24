import { api } from './api';

export interface ContentVersion {
  id: string;
  contentId: string;
  versionNumber: number;
  textContent: string;
  changeDescription: string;
  changeType: ChangeType;
  createdBy: string;
  createdAt: string;
  isCurrent: boolean;
  metadata?: VersionMetadata;
}

export enum ChangeType {
  CREATED = 'created',
  UPDATED = 'updated',
  ROLLBACK = 'rollback',
  MERGE = 'merge',
  BRANCH = 'branch',
  AUTO_SAVE = 'auto_save'
}

export interface VersionMetadata {
  wordCount?: number;
  characterCount?: number;
  changesSummary?: string[];
  conflictsResolved?: number;
  mergeSource?: string;
}

export interface VersionComparison {
  fromVersion: ContentVersion;
  toVersion: ContentVersion;
  differences: VersionDifference[];
  statistics: ComparisonStatistics;
}

export interface VersionDifference {
  type: 'addition' | 'deletion' | 'modification';
  position: {
    start: number;
    end: number;
  };
  oldText?: string;
  newText?: string;
  context: string;
}

export interface ComparisonStatistics {
  totalChanges: number;
  additions: number;
  deletions: number;
  modifications: number;
  wordsAdded: number;
  wordsRemoved: number;
  charactersAdded: number;
  charactersRemoved: number;
}

export interface MergeConflict {
  id: string;
  contentId: string;
  baseVersion: number;
  sourceVersion: number;
  targetVersion: number;
  conflicts: ConflictSection[];
  status: ConflictStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export enum ConflictStatus {
  PENDING = 'pending',
  RESOLVING = 'resolving',
  RESOLVED = 'resolved',
  ABANDONED = 'abandoned'
}

export interface ConflictSection {
  id: string;
  position: {
    start: number;
    end: number;
  };
  baseText: string;
  sourceText: string;
  targetText: string;
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  type: 'accept_source' | 'accept_target' | 'accept_both' | 'custom';
  resolvedText: string;
  resolvedBy: string;
  resolvedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  contentId: string;
  baseVersion: number;
  currentVersion: number;
  createdBy: string;
  createdAt: string;
  description?: string;
  isActive: boolean;
  mergedAt?: string;
}

export interface MergeRequest {
  id: string;
  sourceBranch: string;
  targetBranch: string;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  status: MergeRequestStatus;
  reviewers: string[];
  conflicts?: MergeConflict[];
  approvals: MergeApproval[];
}

export enum MergeRequestStatus {
  OPEN = 'open',
  APPROVED = 'approved',
  MERGED = 'merged',
  CLOSED = 'closed',
  DRAFT = 'draft'
}

export interface MergeApproval {
  userId: string;
  status: 'approved' | 'rejected' | 'pending';
  comments?: string;
  timestamp: string;
}

export interface RollbackRequest {
  contentId: string;
  targetVersion: number;
  reason: string;
  preserveChanges?: boolean;
}

export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // in seconds
  maxVersions: number;
  triggerOnWordCount?: number;
}

export class VersionControlService {
  // Version Management
  async getVersionHistory(contentId: string): Promise<ContentVersion[]> {
    const response = await api.get(`/content/${contentId}/versions`);
    return response.data;
  }

  async getVersion(contentId: string, versionNumber: number): Promise<ContentVersion> {
    const response = await api.get(`/content/${contentId}/versions/${versionNumber}`);
    return response.data;
  }

  async createVersion(
    contentId: string, 
    content: string, 
    changeDescription: string, 
    changeType: ChangeType = ChangeType.UPDATED
  ): Promise<ContentVersion> {
    const response = await api.post(`/content/${contentId}/versions`, {
      content,
      changeDescription,
      changeType
    });
    return response.data;
  }

  async deleteVersion(contentId: string, versionNumber: number): Promise<void> {
    await api.delete(`/content/${contentId}/versions/${versionNumber}`);
  }

  // Version Comparison
  async compareVersions(
    contentId: string, 
    fromVersion: number, 
    toVersion: number
  ): Promise<VersionComparison> {
    const response = await api.get(
      `/content/${contentId}/versions/compare?from=${fromVersion}&to=${toVersion}`
    );
    return response.data;
  }

  async compareWithCurrent(contentId: string, versionNumber: number): Promise<VersionComparison> {
    const response = await api.get(
      `/content/${contentId}/versions/${versionNumber}/compare-current`
    );
    return response.data;
  }

  async getVersionDiff(
    contentId: string, 
    fromVersion: number, 
    toVersion: number,
    format: 'unified' | 'side-by-side' | 'inline' = 'unified'
  ): Promise<string> {
    const response = await api.get(
      `/content/${contentId}/versions/diff?from=${fromVersion}&to=${toVersion}&format=${format}`
    );
    return response.data;
  }

  // Rollback Operations
  async rollbackToVersion(contentId: string, request: RollbackRequest): Promise<ContentVersion> {
    const response = await api.post(`/content/${contentId}/rollback`, request);
    return response.data;
  }

  async previewRollback(contentId: string, targetVersion: number): Promise<VersionComparison> {
    const response = await api.get(
      `/content/${contentId}/rollback/preview?version=${targetVersion}`
    );
    return response.data;
  }

  // Merge Conflict Resolution
  async detectConflicts(
    contentId: string, 
    sourceVersion: number, 
    targetVersion: number
  ): Promise<MergeConflict | null> {
    const response = await api.post(`/content/${contentId}/detect-conflicts`, {
      sourceVersion,
      targetVersion
    });
    return response.data;
  }

  async getMergeConflicts(contentId: string): Promise<MergeConflict[]> {
    const response = await api.get(`/content/${contentId}/conflicts`);
    return response.data;
  }

  async resolveConflict(
    conflictId: string, 
    sectionId: string, 
    resolution: ConflictResolution
  ): Promise<MergeConflict> {
    const response = await api.post(`/conflicts/${conflictId}/sections/${sectionId}/resolve`, {
      resolution
    });
    return response.data;
  }

  async resolveAllConflicts(
    conflictId: string, 
    resolutions: Record<string, ConflictResolution>
  ): Promise<MergeConflict> {
    const response = await api.post(`/conflicts/${conflictId}/resolve-all`, {
      resolutions
    });
    return response.data;
  }

  async autoResolveConflicts(
    conflictId: string, 
    strategy: 'accept_source' | 'accept_target' | 'smart_merge'
  ): Promise<MergeConflict> {
    const response = await api.post(`/conflicts/${conflictId}/auto-resolve`, {
      strategy
    });
    return response.data;
  }

  async abandonConflictResolution(conflictId: string): Promise<void> {
    await api.post(`/conflicts/${conflictId}/abandon`);
  }

  // Branching
  async createBranch(
    contentId: string, 
    name: string, 
    baseVersion?: number, 
    description?: string
  ): Promise<Branch> {
    const response = await api.post(`/content/${contentId}/branches`, {
      name,
      baseVersion,
      description
    });
    return response.data;
  }

  async getBranches(contentId: string): Promise<Branch[]> {
    const response = await api.get(`/content/${contentId}/branches`);
    return response.data;
  }

  async getBranch(branchId: string): Promise<Branch> {
    const response = await api.get(`/branches/${branchId}`);
    return response.data;
  }

  async switchToBranch(branchId: string): Promise<Branch> {
    const response = await api.post(`/branches/${branchId}/switch`);
    return response.data;
  }

  async deleteBranch(branchId: string): Promise<void> {
    await api.delete(`/branches/${branchId}`);
  }

  // Merge Requests
  async createMergeRequest(
    sourceBranch: string,
    targetBranch: string,
    title: string,
    description?: string,
    reviewers?: string[]
  ): Promise<MergeRequest> {
    const response = await api.post('/merge-requests', {
      sourceBranch,
      targetBranch,
      title,
      description,
      reviewers
    });
    return response.data;
  }

  async getMergeRequests(contentId?: string): Promise<MergeRequest[]> {
    const params = contentId ? `?contentId=${contentId}` : '';
    const response = await api.get(`/merge-requests${params}`);
    return response.data;
  }

  async getMergeRequest(mergeRequestId: string): Promise<MergeRequest> {
    const response = await api.get(`/merge-requests/${mergeRequestId}`);
    return response.data;
  }

  async approveMergeRequest(
    mergeRequestId: string, 
    comments?: string
  ): Promise<MergeRequest> {
    const response = await api.post(`/merge-requests/${mergeRequestId}/approve`, {
      comments
    });
    return response.data;
  }

  async rejectMergeRequest(
    mergeRequestId: string, 
    reason: string
  ): Promise<MergeRequest> {
    const response = await api.post(`/merge-requests/${mergeRequestId}/reject`, {
      reason
    });
    return response.data;
  }

  async mergeBranches(mergeRequestId: string): Promise<ContentVersion> {
    const response = await api.post(`/merge-requests/${mergeRequestId}/merge`);
    return response.data;
  }

  async closeMergeRequest(mergeRequestId: string): Promise<MergeRequest> {
    const response = await api.post(`/merge-requests/${mergeRequestId}/close`);
    return response.data;
  }

  // Auto-save Management
  async configureAutoSave(contentId: string, config: AutoSaveConfig): Promise<void> {
    await api.post(`/content/${contentId}/auto-save/config`, config);
  }

  async getAutoSaveConfig(contentId: string): Promise<AutoSaveConfig> {
    const response = await api.get(`/content/${contentId}/auto-save/config`);
    return response.data;
  }

  async enableAutoSave(contentId: string): Promise<void> {
    await api.post(`/content/${contentId}/auto-save/enable`);
  }

  async disableAutoSave(contentId: string): Promise<void> {
    await api.post(`/content/${contentId}/auto-save/disable`);
  }

  async triggerAutoSave(contentId: string, content: string): Promise<ContentVersion> {
    const response = await api.post(`/content/${contentId}/auto-save`, {
      content
    });
    return response.data;
  }

  // Version Analytics
  async getVersionStatistics(contentId: string): Promise<any> {
    const response = await api.get(`/content/${contentId}/versions/statistics`);
    return response.data;
  }

  async getCollaborationMetrics(contentId: string): Promise<any> {
    const response = await api.get(`/content/${contentId}/collaboration/metrics`);
    return response.data;
  }

  async getVersionActivity(
    contentId: string, 
    dateRange?: { start: string; end: string }
  ): Promise<any[]> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('start', dateRange.start);
      params.append('end', dateRange.end);
    }
    
    const response = await api.get(
      `/content/${contentId}/versions/activity?${params.toString()}`
    );
    return response.data;
  }

  // Version Export
  async exportVersionHistory(
    contentId: string, 
    format: 'json' | 'csv' | 'pdf'
  ): Promise<Blob> {
    const response = await api.get(
      `/content/${contentId}/versions/export/${format}`,
      { responseType: 'blob' }
    );
    return response.data;
  }

  async exportVersionComparison(
    contentId: string,
    fromVersion: number,
    toVersion: number,
    format: 'pdf' | 'html'
  ): Promise<Blob> {
    const response = await api.get(
      `/content/${contentId}/versions/compare/export?from=${fromVersion}&to=${toVersion}&format=${format}`,
      { responseType: 'blob' }
    );
    return response.data;
  }

  // Utility Methods
  async restoreDeletedVersion(
    contentId: string, 
    versionNumber: number
  ): Promise<ContentVersion> {
    const response = await api.post(`/content/${contentId}/versions/${versionNumber}/restore`);
    return response.data;
  }

  async squashVersions(
    contentId: string,
    fromVersion: number,
    toVersion: number,
    newDescription: string
  ): Promise<ContentVersion> {
    const response = await api.post(`/content/${contentId}/versions/squash`, {
      fromVersion,
      toVersion,
      newDescription
    });
    return response.data;
  }

  async tagVersion(
    contentId: string,
    versionNumber: number,
    tag: string,
    description?: string
  ): Promise<void> {
    await api.post(`/content/${contentId}/versions/${versionNumber}/tag`, {
      tag,
      description
    });
  }

  async getVersionTags(contentId: string): Promise<any[]> {
    const response = await api.get(`/content/${contentId}/versions/tags`);
    return response.data;
  }

  async cherryPickVersion(
    sourceContentId: string,
    sourceVersion: number,
    targetContentId: string
  ): Promise<ContentVersion> {
    const response = await api.post(`/content/${targetContentId}/cherry-pick`, {
      sourceContentId,
      sourceVersion
    });
    return response.data;
  }
}