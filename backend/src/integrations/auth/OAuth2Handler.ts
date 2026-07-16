import crypto from 'crypto';
import {
  OAuth2Config,
  OAuth2TokenResponse,
  OAuth2GrantType,
  IntegrationCredentials,
  IntegrationErrorCode,
} from '@silo/shared/types/integration';
import axios from 'axios';
import { IntegrationError } from '../base/BaseIntegration';
import { logger } from '../../utils/logger';

/**
 * OAuth2 handler for managing OAuth2 authentication flows
 */
export class OAuth2Handler {
  private stateStore: Map<string, { userId: string; provider: string; platform: string; timestamp: number }> = new Map();
  private readonly STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

  /**
   * Generate authorization URL for OAuth2 flow
   */
  generateAuthorizationUrl(config: OAuth2Config, userId: string, provider: string, platform: 'web' | 'mobile' = 'web'): string {
    const state = this.generateState(userId, provider, platform);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state,
      access_type: 'offline', // Request refresh token
      prompt: 'consent', // Force consent screen to get refresh token
    });

    return `${config.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Generate and store state parameter for CSRF protection
   */
  private generateState(userId: string, provider: string, platform: 'web' | 'mobile' = 'web'): string {
    const state = crypto.randomBytes(32).toString('hex');
    this.stateStore.set(state, { userId, provider, platform, timestamp: Date.now() });

    // Clean up expired states
    this.cleanExpiredStates();

    return state;
  }

  /**
   * Verify state parameter
   */
  verifyState(state: string): { userId: string; provider: string; platform: 'web' | 'mobile' } | null {
    const stored = this.stateStore.get(state);

    if (!stored) {
      logger.warn('Invalid OAuth2 state parameter', { state });
      return null;
    }

    if (Date.now() - stored.timestamp > this.STATE_EXPIRY_MS) {
      logger.warn('Expired OAuth2 state parameter', { state });
      this.stateStore.delete(state);
      return null;
    }

    this.stateStore.delete(state);
    return { userId: stored.userId, provider: stored.provider, platform: (stored.platform as 'web' | 'mobile') || 'web' };
  }

  /**
   * Clean up expired state entries
   */
  private cleanExpiredStates(): void {
    const now = Date.now();
    for (const [state, data] of this.stateStore.entries()) {
      if (now - data.timestamp > this.STATE_EXPIRY_MS) {
        this.stateStore.delete(state);
      }
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    config: OAuth2Config,
    code: string
  ): Promise<IntegrationCredentials> {
    try {
      const params = new URLSearchParams({
        grant_type: OAuth2GrantType.AUTHORIZATION_CODE,
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      });

      logger.info('Exchanging OAuth2 code for token', {
        tokenUrl: config.tokenUrl,
      });

      const response = await axios.post<OAuth2TokenResponse>(config.tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      });

      const tokenData = response.data;
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenType: tokenData.token_type,
        expiresAt,
        scope: tokenData.scope,
        metadata: this.extractMetadata(tokenData),
      };
    } catch (error: any) {
      logger.error('Failed to exchange OAuth2 code', {
        error: error.message,
        response: error.response?.data,
      });

      throw new IntegrationError(
        IntegrationErrorCode.AUTH_FAILED,
        'Failed to exchange authorization code',
        { error: error.response?.data }
      );
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    config: OAuth2Config,
    refreshToken: string
  ): Promise<IntegrationCredentials> {
    try {
      const params = new URLSearchParams({
        grant_type: OAuth2GrantType.REFRESH_TOKEN,
        refresh_token: refreshToken,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      });

      logger.info('Refreshing OAuth2 access token');

      const response = await axios.post<OAuth2TokenResponse>(config.tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      });

      const tokenData = response.data;
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || refreshToken, // Some providers don't return new refresh token
        tokenType: tokenData.token_type,
        expiresAt,
        scope: tokenData.scope,
        metadata: this.extractMetadata(tokenData),
      };
    } catch (error: any) {
      logger.error('Failed to refresh OAuth2 token', {
        error: error.message,
        response: error.response?.data,
      });

      throw new IntegrationError(
        IntegrationErrorCode.REFRESH_FAILED,
        'Failed to refresh access token',
        { error: error.response?.data }
      );
    }
  }

  /**
   * Check if token is expired or about to expire
   */
  isTokenExpired(credentials: IntegrationCredentials, bufferSeconds = 300): boolean {
    if (!credentials.expiresAt) return false;

    const expiryTime = new Date(credentials.expiresAt).getTime();
    const bufferMs = bufferSeconds * 1000;

    return Date.now() >= expiryTime - bufferMs;
  }

  /**
   * Get client credentials token (for server-to-server)
   */
  async getClientCredentialsToken(config: OAuth2Config): Promise<IntegrationCredentials> {
    try {
      const params = new URLSearchParams({
        grant_type: OAuth2GrantType.CLIENT_CREDENTIALS,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: config.scopes.join(' '),
      });

      const response = await axios.post<OAuth2TokenResponse>(config.tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      });

      const tokenData = response.data;
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      return {
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type,
        expiresAt,
        scope: tokenData.scope,
      };
    } catch (error: any) {
      logger.error('Failed to get client credentials token', {
        error: error.message,
        response: error.response?.data,
      });

      throw new IntegrationError(
        IntegrationErrorCode.AUTH_FAILED,
        'Failed to get client credentials token',
        { error: error.response?.data }
      );
    }
  }

  /**
   * Extract provider-specific metadata from token response
   */
  private extractMetadata(tokenData: OAuth2TokenResponse): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Extract non-standard fields
    for (const [key, value] of Object.entries(tokenData)) {
      if (
        !['access_token', 'refresh_token', 'token_type', 'expires_in', 'scope'].includes(key)
      ) {
        metadata[key] = value;
      }
    }

    return metadata;
  }
}

// Singleton instance
export const oauth2Handler = new OAuth2Handler();
