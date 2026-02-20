export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiRequestError extends Error {
  status: number;
  data: unknown;
  response: {
    status: number;
    data: unknown;
  };

  constructor(status: number, data: unknown, message?: string) {
    const fallback = typeof data === 'string' ? data : `API request failed with status ${status}`;
    super(message || fallback);
    this.name = 'ApiRequestError';
    this.status = status;
    this.data = data;
    this.response = {
      status,
      data,
    };
  }
}

export interface ApiClient {
  baseUrl: string;
  request<T = unknown>(
    path: string,
    options?: RequestOptions
  ): Promise<T>;
}

export interface RequestOptions {
  method?: RequestMethod;
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
}

export function createApiClient(baseUrl: string): ApiClient {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  return {
    baseUrl: normalizedBaseUrl,
    async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
      const method = options.method ?? 'GET';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      };

      if (options.token) {
        headers.Authorization = `Bearer ${options.token}`;
      }

      const response = await fetch(`${normalizedBaseUrl}${path}`, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const payload = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        throw new ApiRequestError(response.status, payload);
      }

      return payload as T;
    },
  };
}
