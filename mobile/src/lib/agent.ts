import { createApiClient } from '../../../shared/src/api/client';
import { DEFAULT_API_BASE_URL } from './auth';

export function createMobileAgentApi(
  getToken: () => string | null,
  apiBaseUrl = DEFAULT_API_BASE_URL
) {
  const client = createApiClient(apiBaseUrl);
  const token = () => getToken() ?? undefined;

  return {
    list() {
      return client.request<{ agents: any[] }>('/api/agents', { method: 'GET', token: token() });
    },
    get(id: string) {
      return client.request<{ agent: any }>(`/api/agents/${id}`, { method: 'GET', token: token() });
    },
    run(id: string, body: { task: string; context?: any }) {
      return client.request<{ executionId: string; message: string }>(`/api/agents/${id}/run`, {
        method: 'POST',
        body,
        token: token(),
      });
    },
    executions(id: string) {
      return client.request<{ executions: any[] }>(`/api/agents/${id}/executions`, {
        method: 'GET',
        token: token(),
      });
    },
  };
}
