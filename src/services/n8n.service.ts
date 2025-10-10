import { apiRequest } from './api';

export interface N8nWorkflowRunDto {
  id: number;
  workflowKey: string;
  workflowId?: string;
  workflowName?: string;
  runId?: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | string;
  startedAt: string;
  finishedAt?: string;
  input: string;
  output?: string;
  errorMessage?: string;
  userId?: number;
  contentId?: number;
  updatedAt?: string;
  nodeRuns?: N8nNodeRunDto[]; // Related node runs
}

export interface N8nNodeRunDto {
  id: number;
  executionId: string;
  workflowId?: string;
  workflowName?: string;
  nodeName: string;
  nodeType?: string;
  status: 'success' | 'failed' | string;
  mode?: string;
  finishedAt?: string;
  resultJson?: string;
  createdAt: string;
  updatedAt: string;
  contentId?: number;
  workflowRun?: N8nWorkflowRunDto; // Related workflow run
}

export interface ContentWorkflowStatusDto {
  contentId: number;
  overallStatus: 'COMPLETED' | 'FAILED' | 'RUNNING' | 'PARTIAL' | 'NO_DATA' | string;
  workflowRun?: N8nWorkflowRunDto;
  nodeRuns: N8nNodeRunDto[];
  totalNodes: number;
  successfulNodes: number;
  failedNodes: number;
}

// ========== EXISTING APIs ==========

export async function triggerAiAvatarWorkflow(contentId: number, contentData?: Record<string, any>): Promise<N8nWorkflowRunDto> {
  return apiRequest.post<N8nWorkflowRunDto>(`/n8n/workflows/ai-avatar/trigger/${contentId}`, contentData || {});
}

export async function fetchWorkflowRun(runId: number): Promise<N8nWorkflowRunDto> {
  return apiRequest.get<N8nWorkflowRunDto>(`/n8n/runs/${runId}`);
}

export async function fetchAllWorkflowRuns(): Promise<N8nWorkflowRunDto[]> {
  return apiRequest.get<N8nWorkflowRunDto[]>(`/n8n/runs`);
}

// ========== NEW CONTENT-BASED APIs ==========

/**
 * Get workflow run by content ID with all related node runs
 */
export async function fetchWorkflowRunByContentId(contentId: number): Promise<N8nWorkflowRunDto> {
  return apiRequest.get<N8nWorkflowRunDto>(`/n8n/content/${contentId}/workflow-run`);
}

/**
 * Get all workflow runs for a content ID
 */
export async function fetchWorkflowRunsByContentId(contentId: number): Promise<N8nWorkflowRunDto[]> {
  return apiRequest.get<N8nWorkflowRunDto[]>(`/n8n/content/${contentId}/workflow-runs`);
}

/**
 * Get all node runs for a content ID
 */
export async function fetchNodeRunsByContentId(contentId: number, status?: string): Promise<N8nNodeRunDto[]> {
  const params = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest.get<N8nNodeRunDto[]>(`/n8n/content/${contentId}/node-runs${params}`);
}

/**
 * Get complete workflow status for a content ID
 */
export async function fetchContentWorkflowStatus(contentId: number): Promise<ContentWorkflowStatusDto> {
  return apiRequest.get<ContentWorkflowStatusDto>(`/n8n/content/${contentId}/status`);
}

/**
 * Get latest node run for a content ID
 */
export async function fetchLatestNodeRunByContentId(contentId: number): Promise<N8nNodeRunDto> {
  return apiRequest.get<N8nNodeRunDto>(`/n8n/content/${contentId}/latest-node-run`);
}
