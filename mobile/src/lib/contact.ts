import { createApiClient } from '../../../shared/src/api/client';

export function createMobileContactApi(apiBaseUrl: string) {
  const apiClient = createApiClient(apiBaseUrl);

  return {
    submit(data: { name: string; email: string; message: string }) {
      return apiClient.request<{ id: string; message: string }>('/api/contact', {
        method: 'POST',
        body: { ...data, source: 'mobile' },
      });
    },
  };
}
