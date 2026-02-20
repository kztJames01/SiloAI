import { createAuthApi } from '../../../shared/src/api/auth';
import { createApiClient } from '../../../shared/src/api/client';

export const DEFAULT_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export function createMobileAuthApi(apiBaseUrl = DEFAULT_API_BASE_URL) {
  const apiClient = createApiClient(apiBaseUrl);
  return createAuthApi(apiClient, {
    authBasePath: '/api/auth',
  });
}
