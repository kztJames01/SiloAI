import { ApiClient } from './client';
import {
  AuthResponse,
  LoginPayload,
  MeResponse,
  RegisterPayload,
} from '../types';

export interface CreateAuthApiOptions {
  authBasePath?: string;
  getToken?: () => string | null | undefined;
}

export function createAuthApi(
  apiClient: ApiClient,
  options: CreateAuthApiOptions = {}
) {
  const authBasePath = options.authBasePath ?? '/api/auth';

  return {
    register(payload: RegisterPayload) {
      return apiClient.request<AuthResponse>(`${authBasePath}/register`, {
        method: 'POST',
        body: payload,
      });
    },

    login(payload: LoginPayload) {
      return apiClient.request<AuthResponse>(`${authBasePath}/login`, {
        method: 'POST',
        body: payload,
      });
    },

    me(token?: string) {
      return apiClient.request<MeResponse>(`${authBasePath}/me`, {
        method: 'GET',
        token: token ?? options.getToken?.() ?? undefined,
      });
    },
  };
}