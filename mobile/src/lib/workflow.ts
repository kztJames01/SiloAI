import { createWorkflowApi } from '../../../shared/src/api/workflow';
import { createApiClient } from '../../../shared/src/api/client';
import { DEFAULT_API_BASE_URL } from './auth';

export function createMobileWorkflowApi(
  getToken: () => string | null,
  apiBaseUrl = DEFAULT_API_BASE_URL
) {
  const apiClient = createApiClient(apiBaseUrl);
  return createWorkflowApi(apiClient, {
    basePath: '/api/workflows',
    getToken,
  });
}
