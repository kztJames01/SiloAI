import { ApiClient } from './client';
import {
  WorkflowDeleteResponse,
  WorkflowExecuteResponse,
  WorkflowResponse,
  WorkflowsListResponse,
} from '../types';

interface CreateWorkflowApiOptions {
  basePath?: string;
  getToken?: () => string | null | undefined;
}

export function createWorkflowApi(
  apiClient: ApiClient,
  options: CreateWorkflowApiOptions = {}
) {
  const basePath = options.basePath ?? '/api/workflows';

  return {
    list() {
      return apiClient.request<WorkflowsListResponse>(`${basePath}`, {
        token: options.getToken?.() ?? undefined,
      });
    },
    get(id: string) {
      return apiClient.request<WorkflowResponse>(`${basePath}/${id}`, {
        token: options.getToken?.() ?? undefined,
      });
    },
    create(data: unknown) {
      return apiClient.request<WorkflowResponse>(`${basePath}`, {
        method: 'POST',
        body: data,
        token: options.getToken?.() ?? undefined,
      });
    },
    update(id: string, data: unknown) {
      return apiClient.request<WorkflowResponse>(`${basePath}/${id}`, {
        method: 'PUT',
        body: data,
        token: options.getToken?.() ?? undefined,
      });
    },
    delete(id: string) {
      return apiClient.request<WorkflowDeleteResponse>(`${basePath}/${id}`, {
        method: 'DELETE',
        token: options.getToken?.() ?? undefined,
      });
    },
    toggle(id: string) {
      return apiClient.request<WorkflowResponse>(`${basePath}/${id}/toggle`, {
        method: 'PATCH',
        token: options.getToken?.() ?? undefined,
      });
    },
    execute(id: string, input?: unknown) {
      return apiClient.request<WorkflowExecuteResponse>(`${basePath}/${id}/execute`, {
        method: 'POST',
        body: input,
        token: options.getToken?.() ?? undefined,
      });
    },
  };
}
