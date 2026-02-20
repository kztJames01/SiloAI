import { ApiClient } from './client';
import { IntegrationsListResponse, UserIntegrationsListResponse } from '../types';

interface CreateIntegrationApiOptions {
  basePath?: string;
  getToken?: () => string | null | undefined;
}

export function createIntegrationApi(
  apiClient: ApiClient,
  options: CreateIntegrationApiOptions = {}
) {
  const basePath = options.basePath ?? '/api/integrations';

  return {
    list() {
      return apiClient.request<IntegrationsListResponse>(`${basePath}`, {
        token: options.getToken?.() ?? undefined,
      });
    },
    listUser() {
      return apiClient.request<UserIntegrationsListResponse>(`${basePath}/user`, {
        token: options.getToken?.() ?? undefined,
      });
    },
  };
}
