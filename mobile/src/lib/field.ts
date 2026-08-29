import { createApiClient } from '../../../shared/src/api/client';
import { DEFAULT_API_BASE_URL } from './auth';

export function createMobileFieldApi(
  getToken: () => string | null,
  apiBaseUrl = DEFAULT_API_BASE_URL
) {
  const client = createApiClient(apiBaseUrl);

  return {
    list() {
      return client.request<{ actions: any[] }>('/api/field', {
        method: 'GET',
        token: getToken() ?? undefined,
      });
    },
    submit(data: { actionType: string; notes?: string; jobType?: string; payload?: Record<string, unknown> }) {
      return client.request<any>('/api/field', {
        method: 'POST',
        body: data,
        token: getToken() ?? undefined,
      });
    },
  };
}
