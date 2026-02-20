import { ApiClient } from './client';
import { NodeCategoriesResponse, NodesListResponse } from '../types';

interface CreateNodeApiOptions {
  basePath?: string;
  getToken?: () => string | null | undefined;
}

export function createNodeApi(
  apiClient: ApiClient,
  options: CreateNodeApiOptions = {}
) {
  const basePath = options.basePath ?? '/api/nodes';

  return {
    list() {
      return apiClient.request<NodesListResponse>(`${basePath}`, {
        token: options.getToken?.() ?? undefined,
      });
    },
    categories() {
      return apiClient.request<NodeCategoriesResponse>(`${basePath}/categories`, {
        token: options.getToken?.() ?? undefined,
      });
    },
  };
}
