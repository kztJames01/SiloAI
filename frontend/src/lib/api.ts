import { createApiClient } from '@silo/shared/api/client';
import { createAuthApi } from '@silo/shared/api/auth';
import { createWorkflowApi } from '@silo/shared/api/workflow';
import { createExecutionApi } from '@silo/shared/api/execution';
import { createIntegrationApi } from '@silo/shared/api/integration';
import { createNodeApi } from '@silo/shared/api/node';
import { LoginPayload, RegisterPayload } from '@silo/shared/types';
import { clearToken, getToken } from './tokenStorage';

const runtimeApiUrl = window.__APP_CONFIG__?.API_URL?.trim();
const envApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL =
  import.meta.env.DEV
    ? envApiUrl || runtimeApiUrl || 'http://localhost:5000'
    : runtimeApiUrl || envApiUrl || 'http://localhost:5000';

const sharedApiClient = createApiClient(API_URL);

const normalizeApiPath = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/api/')) return path;
  return `/api${path.startsWith('/') ? path : `/${path}`}`;
};

const wrapResponse = async (promise: Promise<unknown>) => ({
  data: (await promise) as any,
});

const with401Redirect = async <T>(promise: Promise<T>) => {
  try {
    return await promise;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      clearToken();
      window.location.href = '/login';
    }
    throw error;
  }
};

const sharedAuthApi = createAuthApi(sharedApiClient, {
  authBasePath: '/api/auth',
  getToken,
});
const sharedWorkflowApi = createWorkflowApi(sharedApiClient, { getToken });
const sharedExecutionApi = createExecutionApi(sharedApiClient, { getToken });
const sharedIntegrationApi = createIntegrationApi(sharedApiClient, { getToken });
const sharedNodeApi = createNodeApi(sharedApiClient, { getToken });

// Auth API
export const authApi = {
  register: async (data: RegisterPayload) =>
    wrapResponse(with401Redirect(sharedAuthApi.register(data))),
  login: async (data: LoginPayload) =>
    wrapResponse(with401Redirect(sharedAuthApi.login(data))),
  me: async () => wrapResponse(with401Redirect(sharedAuthApi.me())),
  exchangeOAuthCode: async (code: string) =>
    wrapResponse(with401Redirect(sharedAuthApi.exchangeOAuthCode(code))),
  changePassword: async (data: { currentPassword: string; newPassword: string }) =>
    wrapResponse(
      with401Redirect(
        sharedApiClient.request<any>('/api/auth/change-password', {
          method: 'POST',
          body: data,
          token: getToken() ?? undefined,
        })
      )
    ),
  oauthStartUrl: (provider: 'google' | 'apple', mode: 'login' | 'register' = 'login') =>
    `${API_URL}/api/auth/oauth/${provider}/start?mode=${mode}`,
};

export const fieldApi = {
  list: async () =>
    wrapResponse(
      with401Redirect(
        sharedApiClient.request<any>('/api/field', { method: 'GET', token: getToken() ?? undefined })
      )
    ),
  submit: async (data: { actionType: string; notes?: string; jobType?: string; payload?: Record<string, unknown> }) =>
    wrapResponse(
      with401Redirect(
        sharedApiClient.request<any>('/api/field', { method: 'POST', body: data, token: getToken() ?? undefined })
      )
    ),
};

export const contactApi = {
  submit: async (data: { name: string; email: string; message: string; source?: 'web' | 'mobile' }) =>
    wrapResponse(
      sharedApiClient.request<any>('/api/contact', {
        method: 'POST',
        body: data,
      })
    ),
};

export const apiKeyApi = {
  list: async () =>
    wrapResponse(
      with401Redirect(
        sharedApiClient.request<any>('/api/api-keys', { method: 'GET', token: getToken() ?? undefined })
      )
    ),
  create: async (name: string) =>
    wrapResponse(
      with401Redirect(
        sharedApiClient.request<any>('/api/api-keys', { method: 'POST', body: { name }, token: getToken() ?? undefined })
      )
    ),
  delete: async (id: string) =>
    wrapResponse(
      with401Redirect(
        sharedApiClient.request<any>(`/api/api-keys/${id}`, { method: 'DELETE', token: getToken() ?? undefined })
      )
    ),
};

// Workflow API
export const workflowApi = {
  list: async () => wrapResponse(with401Redirect(sharedWorkflowApi.list())),
  get: async (id: string) => wrapResponse(with401Redirect(sharedWorkflowApi.get(id))),
  create: async (data: any) =>
    wrapResponse(with401Redirect(sharedWorkflowApi.create(data))),
  update: async (id: string, data: any) =>
    wrapResponse(with401Redirect(sharedWorkflowApi.update(id, data))),
  delete: async (id: string) =>
    wrapResponse(with401Redirect(sharedWorkflowApi.delete(id))),
  toggle: async (id: string) =>
    wrapResponse(with401Redirect(sharedWorkflowApi.toggle(id))),
  execute: async (id: string, input?: any) =>
    wrapResponse(with401Redirect(sharedWorkflowApi.execute(id, input))),
};

// Execution API
export const executionApi = {
  list: async () => wrapResponse(with401Redirect(sharedExecutionApi.list())),
  get: async (id: string) => wrapResponse(with401Redirect(sharedExecutionApi.get(id))),
  listByWorkflow: async (workflowId: string) =>
    wrapResponse(with401Redirect(sharedExecutionApi.listByWorkflow(workflowId))),
};

// Integration API
export const integrationApi = {
  list: async () => wrapResponse(with401Redirect(sharedIntegrationApi.list())),
  listUser: async () => wrapResponse(with401Redirect(sharedIntegrationApi.listUser())),
};

// Node API
export const nodeApi = {
  list: async () => wrapResponse(with401Redirect(sharedNodeApi.list())),
  categories: async () => wrapResponse(with401Redirect(sharedNodeApi.categories())),
};

// Agent API
export const agentApi = {
  list: async () => {
    const data = await sharedApiClient.request<any>('/api/agents', { method: 'GET', token: getToken() ?? undefined });
    return { data };
  },
  get: async (id: string) => {
    const data = await sharedApiClient.request<any>(`/api/agents/${id}`, { method: 'GET', token: getToken() ?? undefined });
    return { data };
  },
  create: async (body: any) => {
    const data = await sharedApiClient.request<any>('/api/agents', { method: 'POST', body, token: getToken() ?? undefined });
    return { data };
  },
  update: async (id: string, body: any) => {
    const data = await sharedApiClient.request<any>(`/api/agents/${id}`, { method: 'PUT', body, token: getToken() ?? undefined });
    return { data };
  },
  delete: async (id: string) => {
    const data = await sharedApiClient.request<any>(`/api/agents/${id}`, { method: 'DELETE', token: getToken() ?? undefined });
    return { data };
  },
  run: async (id: string, body: { task: string; context?: any }) => {
    const data = await sharedApiClient.request<any>(`/api/agents/${id}/run`, { method: 'POST', body, token: getToken() ?? undefined });
    return { data };
  },
  executions: async (id: string) => {
    const data = await sharedApiClient.request<any>(`/api/agents/${id}/executions`, { method: 'GET', token: getToken() ?? undefined });
    return { data };
  },
  presets: async () => {
    const data = await sharedApiClient.request<any>('/api/agents/presets', { method: 'GET', token: getToken() ?? undefined });
    return { data };
  },
};

export const orgApi = {
  get: async () =>
    wrapResponse(with401Redirect(sharedApiClient.request<any>('/api/orgs', { method: 'GET', token: getToken() ?? undefined }))),
  invite: async (email: string, role: string) =>
    wrapResponse(with401Redirect(sharedApiClient.request<any>('/api/orgs/invite', { method: 'POST', body: { email, role }, token: getToken() ?? undefined }))),
  inviteInfo: async (token: string) =>
    wrapResponse(with401Redirect(sharedApiClient.request<any>(`/api/orgs/invite/${token}`, { method: 'GET', token: getToken() ?? undefined }))),
  acceptInvite: async (token: string) =>
    wrapResponse(with401Redirect(sharedApiClient.request<any>(`/api/orgs/invite/${token}/accept`, { method: 'POST', token: getToken() ?? undefined }))),
  transfer: async (userId: string) =>
    wrapResponse(with401Redirect(sharedApiClient.request<any>('/api/orgs/transfer', { method: 'POST', body: { userId }, token: getToken() ?? undefined }))),
};

// Generic API client for custom endpoints
export const api = {
  get: async (path: string) => {
    const data = await sharedApiClient.request<any>(normalizeApiPath(path), { method: 'GET', token: getToken() ?? undefined });
    return { data };
  },
  post: async (path: string, body?: unknown) => {
    const data = await sharedApiClient.request<any>(normalizeApiPath(path), { method: 'POST', body, token: getToken() ?? undefined });
    return { data };
  },
  put: async (path: string, body?: unknown) => {
    const data = await sharedApiClient.request<any>(normalizeApiPath(path), { method: 'PUT', body, token: getToken() ?? undefined });
    return { data };
  },
  delete: async (path: string, body?: unknown) => {
    const data = await sharedApiClient.request<any>(normalizeApiPath(path), { method: 'DELETE', body, token: getToken() ?? undefined });
    return { data };
  },
};
