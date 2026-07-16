import { createAuthApi } from '../../../shared/src/api/auth';
import { createApiClient } from '../../../shared/src/api/client';
import { resolveApiBaseUrl } from './env';

export const DEFAULT_API_BASE_URL = resolveApiBaseUrl();

export function createMobileAuthApi(apiBaseUrl = DEFAULT_API_BASE_URL) {
  const apiClient = createApiClient(apiBaseUrl);
  const baseApi = createAuthApi(apiClient, {
    authBasePath: '/api/auth',
  });

  return {
    ...baseApi,
    changePassword(token: string, data: { currentPassword: string; newPassword: string }) {
      return apiClient.request<{ success: boolean; message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: data,
        token,
      });
    },
  };
}
