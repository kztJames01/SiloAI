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
import { signOAuthState, verifyOAuthState } from '../../utils/security';

/**
 * OAuth2 handler for managing OAuth2 authentication flows
 */
export class OAuth2Handler {
  generateAuthorizationUrl(config: OAuth2Config, userId: string, provider: string, platform: 'web' | 'mobile' = 'web'): string {
    const state = signOAuthState({ userId, provider, platform });

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `${config.authorizationUrl}?${params.toString()}`;
  }

  verifyState(state: string): { userId: string; provider: string; platform: 'web' | 'mobile' } | null {
    try {
      const payload = verifyOAuthState<{ userId?: string; provider?: string; platform?: string }>(state);
      if (!payload.userId || !payload.provider) {
        logger.warn('Invalid OAuth2 state payload', { state });
        return null;
      }
      return {
        userId: payload.userId,
        provider: payload.provider,
        platform: (payload.platform as 'web' | 'mobile') || 'web',
      };
    } catch (error: any) {
      logger.warn('Invalid OAuth2 state parameter', { state, error: error?.message });
      return null;
    }
  }

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
        refreshToken: tokenData.refresh_token || refreshToken,
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

  isTokenExpired(credentials: IntegrationCredentials, bufferSeconds = 300): boolean {
    if (!credentials.expiresAt) return false;

    const expiryTime = new Date(credentials.expiresAt).getTime();
    const bufferMs = bufferSeconds * 1000;

    return Date.now() >= expiryTime - bufferMs;
  }

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

  private extractMetadata(tokenData: OAuth2TokenResponse): Record<string, any> {
    const metadata: Record<string, any> = {};

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

export const oauth2Handler = new OAuth2Handler();
