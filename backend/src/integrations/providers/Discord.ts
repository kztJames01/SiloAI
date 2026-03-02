import {
  BaseIntegration,
  IntegrationError,
} from '../base/BaseIntegration';
import {
  IntegrationAction,
  IntegrationCredentials,
  IntegrationMetadata,
  IntegrationProvider,
  AuthType,
  IntegrationCategory,
  IntegrationResult,
  IntegrationTestResult,
  IntegrationTrigger,
  IntegrationErrorCode,
  IntegrationParameter,
} from '@silo/shared/types/integration';
import { AxiosRequestConfig } from 'axios';

export class DiscordIntegration extends BaseIntegration {
  private readonly apiUrl = 'https://discord.com/api/v10';

  getMetadata(): IntegrationMetadata {
    return {
      provider: IntegrationProvider.DISCORD,
      name: 'Discord',
      description: 'Connect with Discord to send messages and manage your community.',
      category: IntegrationCategory.COMMUNICATION,
      authType: AuthType.BEARER_TOKEN, // Using Bearer token for bot token
      logo: '/integrations/discord.png',
      color: '#5865F2',
      docUrl: 'https://discord.com/developers/docs/intro',
      enabled: true,
    };
  }

  getActions(): IntegrationAction[] {
    return [
      {
        id: 'channel.sendMessage',
        name: 'Send Channel Message',
        description: 'Send a message to a channel',
        parameters: [
          { name: 'channelId', type: 'string', required: true, description: 'Discord channel ID' },
          { name: 'content', type: 'string', required: true, description: 'Message content' },
          { name: 'embeds', type: 'array', required: false, description: 'Rich embeds' },
        ],
      },
      {
        id: 'guild.listMembers',
        name: 'List Guild Members',
        description: 'List members of a guild',
        parameters: [
            { name: 'guildId', type: 'string', required: true, description: 'Server/guild ID' },
            { name: 'limit', type: 'number', required: false, description: 'Max members to fetch (1-1000)' },
            { name: 'after', type: 'string', required: false, description: 'User ID to fetch after' },
        ],
      },
    ];
  }

  getTriggers(): IntegrationTrigger[] {
    return [];
  }

  protected override async applyAuthentication(
    config: AxiosRequestConfig,
    credentials: IntegrationCredentials
  ): Promise<AxiosRequestConfig> {
    const authConfig = { ...config };
    if (!authConfig.headers) {
      authConfig.headers = {};
    }
    // Discord bot tokens are sent as "Bot <token>"
    // We store the bot token in the accessToken field.
    if (credentials.accessToken) {
      authConfig.headers['Authorization'] = `Bot ${credentials.accessToken}`;
    }
    return authConfig;
  }

  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({
          method: 'GET',
          url: `${this.apiUrl}/users/@me`,
        },
        credentials
      );
      return { success: true, message: 'Connection successful' };
    } catch (e: any) {
      return { success: false, message: e.message, details: e };
    }
  }

  async executeAction(
    actionId: string,
    parameters: Record<string, any>,
    credentials: IntegrationCredentials
  ): Promise<IntegrationResult> {
    switch (actionId) {
      case 'channel.sendMessage':
        return this.sendMessage(parameters, credentials);
      case 'guild.listMembers':
        return this.listMembers(parameters, credentials);
      default:
        return {
          success: false,
          error: {
            code: IntegrationErrorCode.EXECUTION_FAILED,
            message: `Unknown action: ${actionId}`,
          },
        };
    }
  }

  private async sendMessage(
    parameters: Record<string, any>,
    credentials: IntegrationCredentials
  ): Promise<IntegrationResult> {
    const { channelId, content, embeds } = parameters;
    
    const body: any = { content };
    if (embeds) body.embeds = embeds;

    try {
      const response = await this.makeRequest<any>(
        {
          method: 'POST',
          url: `${this.apiUrl}/channels/${channelId}/messages`,
          data: body,
        },
        credentials
      );
      return { success: true, data: { messageId: response.id, timestamp: response.timestamp } };
    } catch (e) {
      if (e instanceof IntegrationError) {
        return { success: false, error: { code: e.code, message: e.message, details: e.details } };
      }
      const error = e as Error;
      return { success: false, error: { code: IntegrationErrorCode.UNKNOWN_ERROR, message: error.message } };
    }
  }

  private async listMembers(
    parameters: Record<string, any>,
    credentials: IntegrationCredentials
  ): Promise<IntegrationResult> {
    const { guildId, limit = 100, after } = parameters;
    
    const params: Record<string, string> = { limit: String(Math.min(limit, 1000)) };
    if (after) params.after = after;

    try {
      const response = await this.makeRequest<any>(
        {
          method: 'GET',
          url: `${this.apiUrl}/guilds/${guildId}/members`,
          params: params,
        },
        credentials
      );
      return { success: true, data: { members: response } };
    } catch (e) {
      if (e instanceof IntegrationError) {
        return { success: false, error: { code: e.code, message: e.message, details: e.details } };
      }
      const error = e as Error;
      return { success: false, error: { code: IntegrationErrorCode.UNKNOWN_ERROR, message: error.message } };
    }
  }
}
