import { apiRequest } from './api';

export interface N8nWorkflowRunDto {
  id: number;
  workflowKey: string;
  runId?: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | string;
  startedAt: string;
  finishedAt?: string;
  input: string;
  output?: string;
  errorMessage?: string;
  userId?: number;
  contentId?: number;
}

export async function fetchWorkflowRuns(workflowKey: string): Promise<N8nWorkflowRunDto[]> {
  return apiRequest.get<N8nWorkflowRunDto[]>(`/n8n/workflows/${encodeURIComponent(workflowKey)}/runs`);
}

export async function triggerAiAvatarWorkflow(contentId: number, contentData?: Record<string, any>): Promise<N8nWorkflowRunDto> {
  return apiRequest.post<N8nWorkflowRunDto>(`/n8n/workflows/ai-avatar/trigger/${contentId}`, contentData || {});
}


