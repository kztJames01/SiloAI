import {
  IntegrationMetadata,
  IntegrationCredentials,
  IntegrationResult,
  IntegrationAction,
  IntegrationTrigger,
  RateLimitConfig,
  RetryConfig,
  IntegrationTestResult,
  IntegrationErrorCode,
} from '@silo/shared/types/integration';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from '../../utils/logger';

/**
 * Abstract base class for all integrations
 * Provides common functionality for authentication, rate limiting, and error handling
 */
export abstract class BaseIntegration {
  protected metadata: IntegrationMetadata;
  protected rateLimitConfig?: RateLimitConfig;
  protected retryConfig: RetryConfig;
  protected axiosInstance: AxiosInstance;
  private requestCount: Map<string, number[]> = new Map();

  constructor() {
    this.metadata = this.getMetadata();
    this.rateLimitConfig = this.getRateLimitConfig();
    this.retryConfig = this.getRetryConfig();
    this.axiosInstance = this.createAxiosInstance();
  }

  /**
   * Get integration metadata
   */
  abstract getMetadata(): IntegrationMetadata;

  /**
   * Get available actions
   */
  abstract getActions(): IntegrationAction[];

  /**
   * Get available triggers
   */
  abstract getTriggers(): IntegrationTrigger[];

  /**
   * Test connection with credentials
   */
  abstract testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult>;

  /**
   * Execute an action
   */
  abstract executeAction(
    actionId: string,
    parameters: Record<string, any>,
    credentials: IntegrationCredentials
  ): Promise<IntegrationResult>;

  /**
   * Get rate limit configuration (optional)
   */
  protected getRateLimitConfig(): RateLimitConfig | undefined {
    return undefined; // Override in child classes if needed
  }

  /**
   * Get retry configuration
   */
  protected getRetryConfig(): RetryConfig {
    return {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    };
  }

  /**
   * Create axios instance with base configuration
   */
  protected createAxiosInstance(): AxiosInstance {
    return axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Silo-Integration/1.0',
      },
    });
  }

  /**
   * Make authenticated request with rate limiting and retries
   */
  protected async makeRequest<T = any>(
    config: AxiosRequestConfig,
    credentials: IntegrationCredentials,
    retries = 0
  ): Promise<T> {
    // Apply rate limiting
    await this.checkRateLimit(credentials);

    try {
      // Add authentication
      const authConfig = await this.applyAuthentication(config, credentials);

      // Make request
      const startTime = Date.now();
      const response = await this.axiosInstance.request<T>(authConfig);
      const duration = Date.now() - startTime;

      logger.info(`Integration request completed`, {
        provider: this.metadata.provider,
        method: config.method,
        url: config.url,
        duration,
        status: response.status,
      });

      return response.data;
    } catch (error: any) {
      const shouldRetry = this.shouldRetry(error, retries);

      if (shouldRetry && retries < this.retryConfig.maxRetries) {
        const delay = this.calculateBackoff(retries);
        logger.warn(`Retrying request after ${delay}ms`, {
          provider: this.metadata.provider,
          attempt: retries + 1,
          error: error.message,
        });

        await this.sleep(delay);
        return this.makeRequest<T>(config, credentials, retries + 1);
      }

      throw this.handleError(error);
    }
  }

  /**
   * Apply authentication to request config
   */
  protected async applyAuthentication(
    config: AxiosRequestConfig,
    credentials: IntegrationCredentials
  ): Promise<AxiosRequestConfig> {
    const authConfig = { ...config };

    if (credentials.accessToken) {
      // OAuth2 / Bearer token
      authConfig.headers = {
        ...authConfig.headers,
        Authorization: `Bearer ${credentials.accessToken}`,
      };
    } else if (credentials.apiKey) {
      // API Key (override in child classes for specific placement)
      authConfig.headers = {
        ...authConfig.headers,
        'X-API-Key': credentials.apiKey,
      };
    } else if (credentials.username && credentials.password) {
      // Basic Auth
      authConfig.auth = {
        username: credentials.username,
        password: credentials.password,
      };
    }

    return authConfig;
  }

  /**
   * Check rate limit before making request
   */
  protected async checkRateLimit(credentials: IntegrationCredentials): Promise<void> {
    if (!this.rateLimitConfig) return;

    const key = this.getRateLimitKey(credentials);
    const now = Date.now();
    const requests = this.requestCount.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter(
      (timestamp) => now - timestamp < this.rateLimitConfig!.windowMs
    );

    if (validRequests.length >= this.rateLimitConfig.maxRequests) {
      const oldestRequest = Math.min(...validRequests);
      const waitTime = this.rateLimitConfig.windowMs - (now - oldestRequest);

      logger.warn(`Rate limit exceeded, waiting ${waitTime}ms`, {
        provider: this.metadata.provider,
      });

      await this.sleep(waitTime);
      return this.checkRateLimit(credentials);
    }

    validRequests.push(now);
    this.requestCount.set(key, validRequests);
  }

  /**
   * Get rate limit key for tracking
   */
  protected getRateLimitKey(credentials: IntegrationCredentials): string {
    return `${this.metadata.provider}:${credentials.accessToken || credentials.apiKey || 'default'}`;
  }

  /**
   * Determine if request should be retried
   */
  protected shouldRetry(error: any, retries: number): boolean {
    if (retries >= this.retryConfig.maxRetries) return false;

    const status = error?.response?.status;
    if (!status) return true; // Network errors should be retried

    return this.retryConfig.retryableStatusCodes.includes(status);
  }

  /**
   * Calculate backoff delay with exponential backoff
   */
  protected calculateBackoff(retries: number): number {
    return this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, retries);
  }

  /**
   * Handle and transform errors
   */
  protected handleError(error: any): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401 || status === 403) {
        return new IntegrationError(
          IntegrationErrorCode.AUTH_FAILED,
          'Authentication failed',
          { status, data }
        );
      }

      if (status === 429) {
        return new IntegrationError(
          IntegrationErrorCode.RATE_LIMIT_EXCEEDED,
          'Rate limit exceeded',
          { status, data, retryAfter: error.response.headers['retry-after'] }
        );
      }

      return new IntegrationError(
        IntegrationErrorCode.API_ERROR,
        data?.error?.message || data?.message || 'API request failed',
        { status, data }
      );
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new IntegrationError(IntegrationErrorCode.TIMEOUT, 'Request timeout', {
        code: error.code,
      });
    }

    if (error.code) {
      return new IntegrationError(IntegrationErrorCode.NETWORK_ERROR, 'Network error', {
        code: error.code,
        message: error.message,
      });
    }

    return new IntegrationError(
      IntegrationErrorCode.UNKNOWN_ERROR,
      error.message || 'Unknown error',
      { error }
    );
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate parameters against action definition
   */
  protected validateParameters(
    actionId: string,
    parameters: Record<string, any>
  ): { valid: boolean; errors: string[] } {
    const action = this.getActions().find((a) => a.id === actionId);
    if (!action) {
      return { valid: false, errors: [`Action '${actionId}' not found`] };
    }

    const errors: string[] = [];

    for (const param of action.parameters) {
      const value = parameters[param.name];

      if (param.required && (value === undefined || value === null)) {
        errors.push(`Required parameter '${param.name}' is missing`);
        continue;
      }

      if (value !== undefined && value !== null) {
        // Type validation
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== param.type) {
          errors.push(`Parameter '${param.name}' must be of type ${param.type}`);
        }

        // Enum validation
        if (param.enum && !param.enum.includes(value)) {
          errors.push(
            `Parameter '${param.name}' must be one of: ${param.enum.join(', ')}`
          );
        }

        // String validations
        if (param.type === 'string' && param.validation) {
          const strValue = value as string;
          if (param.validation.pattern && !new RegExp(param.validation.pattern).test(strValue)) {
            errors.push(`Parameter '${param.name}' does not match required pattern`);
          }
          if (param.validation.minLength && strValue.length < param.validation.minLength) {
            errors.push(
              `Parameter '${param.name}' must be at least ${param.validation.minLength} characters`
            );
          }
          if (param.validation.maxLength && strValue.length > param.validation.maxLength) {
            errors.push(
              `Parameter '${param.name}' must be at most ${param.validation.maxLength} characters`
            );
          }
        }

        // Number validations
        if (param.type === 'number' && param.validation) {
          const numValue = value as number;
          if (param.validation.min !== undefined && numValue < param.validation.min) {
            errors.push(`Parameter '${param.name}' must be at least ${param.validation.min}`);
          }
          if (param.validation.max !== undefined && numValue > param.validation.max) {
            errors.push(`Parameter '${param.name}' must be at most ${param.validation.max}`);
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get integration info
   */
  public getInfo() {
    return {
      metadata: this.metadata,
      actions: this.getActions(),
      triggers: this.getTriggers(),
    };
  }
}

/**
 * Custom integration error class
 */
export class IntegrationError extends Error {
  constructor(
    public code: IntegrationErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'IntegrationError';
  }
}
