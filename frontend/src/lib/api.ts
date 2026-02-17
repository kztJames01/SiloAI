import { createApiClient } from '@silo/shared/api/client';
import { createAuthApi } from '@silo/shared/api/auth';
import { createWorkflowApi } from '@silo/shared/api/workflow';
import { createExecutionApi } from '@silo/shared/api/execution';
import { createIntegrationApi } from '@silo/shared/api/integration';
import { createNodeApi } from '@silo/shared/api/node';
import { LoginPayload, RegisterPayload } from '@silo/shared/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const sharedApiClient = createApiClient(API_URL);
const getToken = () => localStorage.getItem('token');

const wrapResponse = async (promise: Promise<unknown>) => ({
  data: (await promise) as any,
});

const with401Redirect = async <T>(promise: Promise<T>) => {
  try {
    return await promise;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
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
