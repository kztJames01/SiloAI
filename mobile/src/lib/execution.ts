import { createExecutionApi } from '../../../shared/src/api/execution';
import { createApiClient } from '../../../shared/src/api/client';
import { DEFAULT_API_BASE_URL } from './auth';

export function createMobileExecutionApi(
  getToken: () => string | null,
  apiBaseUrl = DEFAULT_API_BASE_URL
) {
  const client = createApiClient(apiBaseUrl);
  return createExecutionApi(client, { getToken });
}
