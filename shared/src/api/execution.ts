import { ApiClient } from './client';
import { ExecutionResponse, ExecutionsListResponse } from '../types';

interface CreateExecutionApiOptions {
  basePath?: string;
  getToken?: () => string | null | undefined;
}

export function createExecutionApi(
  apiClient: ApiClient,
  options: CreateExecutionApiOptions = {}
) {
  const basePath = options.basePath ?? '/api/executions';

  return {
    list() {
      return apiClient.request<ExecutionsListResponse>(`${basePath}`, {
        token: options.getToken?.() ?? undefined,
      });
    },
    get(id: string) {
      return apiClient.request<ExecutionResponse>(`${basePath}/${id}`, {
        token: options.getToken?.() ?? undefined,
      });
    },
    listByWorkflow(workflowId: string) {
      return apiClient.request<ExecutionsListResponse>(`${basePath}/workflow/${workflowId}`, {
        token: options.getToken?.() ?? undefined,
      });
    },
  };
}
