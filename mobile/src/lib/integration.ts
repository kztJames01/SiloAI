import { createApiClient } from '../../../shared/src/api/client';
import { DEFAULT_API_BASE_URL } from './auth';

export function createMobileIntegrationApi(
  getToken: () => string | null,
  apiBaseUrl = DEFAULT_API_BASE_URL
) {
  const client = createApiClient(apiBaseUrl);
  const token = () => getToken() ?? undefined;

  return {
    list() {
      return client.request<{ integrations: any[] }>('/api/integrations', {
        method: 'GET',
        token: token(),
      });
    },
    listUser() {
      return client.request<{ connections: any[] }>('/api/integrations/user', {
        method: 'GET',
        token: token(),
      });
    },
    get(provider: string) {
      return client.request<any>(`/api/integrations/${provider}`, {
        method: 'GET',
        token: token(),
      });
    },
    connect(provider: string, body: { credentials?: Record<string, unknown>; name?: string; platform?: 'mobile' }) {
      return client.request<{ authUrl?: string; requiresOAuth?: boolean; success?: boolean; connection?: any }>(
        `/api/integrations/${provider}/connect`,
        { method: 'POST', body: { ...body, platform: 'mobile' }, token: token() }
      );
    },
    disconnect(provider: string, connectionId: string) {
      return client.request<{ success: boolean }>(`/api/integrations/${provider}/disconnect`, {
        method: 'DELETE',
        body: { connectionId },
        token: token(),
      });
    },
  };
}
