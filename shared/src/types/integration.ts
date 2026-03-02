/**
 * Integration System Types
 * Shared types for the integration framework
 */

/**
 * Supported integration providers
 */
export enum IntegrationProvider {
  // Google Suite
  GMAIL = 'gmail',
  GOOGLE_SHEETS = 'google_sheets',
  GOOGLE_DRIVE = 'google_drive',
  GOOGLE_CALENDAR = 'google_calendar',
  GOOGLE_DOCS = 'google_docs',
  YOUTUBE = 'youtube',

  // Microsoft Suite
  MICROSOFT_OUTLOOK = 'microsoft_outlook',
  MICROSOFT_TEAMS = 'microsoft_teams',
  MICROSOFT_EXCEL = 'microsoft_excel',
  MICROSOFT_ONEDRIVE = 'microsoft_onedrive',

  // Communication
  SLACK = 'slack',
  DISCORD = 'discord',
  TWILIO = 'twilio',
  ZOOM = 'zoom',
  SENDGRID = 'sendgrid',

  // Productivity & Project Management
  NOTION = 'notion',
  TRELLO = 'trello',
  CLICKUP = 'clickup',
  AIRTABLE = 'airtable',

  // Marketing
  MAILCHIMP = 'mailchimp',
  HUBSPOT = 'hubspot',
  FACEBOOK_ADS = 'facebook_ads',
  TYPEFORM = 'typeform',

  // Payments
  STRIPE = 'stripe',

  // AI
  OPENAI = 'openai',
  CHATGPT = 'chatgpt',

  // Development
  GITHUB = 'github',

  // Storage
  DROPBOX = 'dropbox',

  // Custom
  WEBHOOK = 'webhook',
}

/**
 * Authentication types supported by integrations
 */
export enum AuthType {
  OAUTH2 = 'oauth2',
  API_KEY = 'api_key',
  BASIC_AUTH = 'basic_auth',
  BEARER_TOKEN = 'bearer_token',
  NONE = 'none',
}

/**
 * Integration categories for organization
 */
export enum IntegrationCategory {
  COMMUNICATION = 'communication',
  PRODUCTIVITY = 'productivity',
  STORAGE = 'storage',
  DEVELOPMENT = 'development',
  PAYMENTS = 'payments',
  MARKETING = 'marketing',
  AI = 'ai',
  CUSTOM = 'custom',
  VIDEO = 'video',
  FORMS = 'forms',
}

/**
 * OAuth2 grant types
 */
export enum OAuth2GrantType {
  AUTHORIZATION_CODE = 'authorization_code',
  REFRESH_TOKEN = 'refresh_token',
  CLIENT_CREDENTIALS = 'client_credentials',
}

/**
 * Integration metadata
 */
export interface IntegrationMetadata {
  provider: IntegrationProvider;
  name: string;
  description: string;
  category: IntegrationCategory;
  authType: AuthType;
  logo?: string;
  color?: string;
  docUrl?: string;
  enabled: boolean;
  comingSoon?: boolean;
}

/**
 * OAuth2 configuration
 */
export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
  grantType?: OAuth2GrantType;
}

/**
 * API Key configuration
 */
export interface ApiKeyConfig {
  keyName: string;
  keyLocation: 'header' | 'query' | 'body';
  prefix?: string; // e.g., "Bearer ", "token "
}

/**
 * Basic Auth configuration
 */
export interface BasicAuthConfig {
  usernameField: string;
  passwordField: string;
}

/**
 * Integration credentials (encrypted in DB)
 */
export interface IntegrationCredentials {
  // OAuth2
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresAt?: Date;
  scope?: string;

  // API Key / Token
  apiKey?: string;
  apiSecret?: string;

  // Basic Auth
  username?: string;
  password?: string;

  // Additional provider-specific data
  metadata?: Record<string, any>;
}

/**
 * Integration connection (user's connected account)
 */
export interface IntegrationConnection {
  id: string;
  userId: string;
  provider: IntegrationProvider;
  name: string; // User-friendly name
  credentials: IntegrationCredentials;
  status: 'active' | 'expired' | 'error' | 'disconnected';
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Integration action definition
 */
export interface IntegrationAction {
  id: string;
  name: string;
  description: string;
  parameters: IntegrationParameter[];
  examples?: Record<string, any>[];
}

/**
 * Integration parameter
 */
export interface IntegrationParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  default?: any;
  enum?: any[];
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
}

/**
 * Integration trigger definition
 */
export interface IntegrationTrigger {
  id: string;
  name: string;
  description: string;
  eventType: string;
  parameters: IntegrationParameter[];
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  strategy: 'fixed-window' | 'sliding-window' | 'token-bucket';
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number; // Base delay in ms
  backoffMultiplier: number; // For exponential backoff
  retryableStatusCodes: number[];
}

/**
 * Integration execution result
 */
export interface IntegrationResult {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    duration: number;
    requestId?: string;
    rateLimit?: {
      remaining: number;
      reset: number;
    };
  };
}

/**
 * OAuth2 token response
 */
export interface OAuth2TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  [key: string]: any; // Provider-specific fields
}

/**
 * Integration test result
 */
export interface IntegrationTestResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'api_key' | 'custom';
    config: Record<string, string>;
  };
  retryOnFailure: boolean;
  timeout?: number;
}

/**
 * Integration statistics
 */
export interface IntegrationStats {
  provider: IntegrationProvider;
  totalConnections: number;
  activeConnections: number;
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  lastUsed?: Date;
}

/**
 * Integration error codes
 */
export enum IntegrationErrorCode {
  // Authentication errors
  AUTH_FAILED = 'AUTH_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  REFRESH_FAILED = 'REFRESH_FAILED',

  // API errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // Configuration errors
  INVALID_CONFIG = 'INVALID_CONFIG',
  MISSING_CREDENTIALS = 'MISSING_CREDENTIALS',
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',

  // Execution errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
