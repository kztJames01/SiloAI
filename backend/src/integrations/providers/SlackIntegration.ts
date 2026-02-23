import { BaseIntegration } from '../base/BaseIntegration';
import {
  IntegrationProvider,
  IntegrationMetadata,
  AuthType,
  IntegrationCategory,
  IntegrationAction,
  IntegrationTrigger,
  IntegrationCredentials,
  IntegrationResult,
  IntegrationTestResult,
  RateLimitConfig,
} from '@silo/shared/types/integration';

export class SlackIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return {
      provider: IntegrationProvider.SLACK,
      name: 'Slack',
      description: 'Send messages and manage Slack workspaces',
      category: IntegrationCategory.COMMUNICATION,
      authType: AuthType.OAUTH2,
      logo: 'https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png',
      color: '#4A154B',
      docUrl: 'https://api.slack.com',
      enabled: true,
    };
  }

  protected getRateLimitConfig(): RateLimitConfig {
    return {
      maxRequests: 50,
      windowMs: 60000, // 50 requests per minute (Tier 1)
      strategy: 'token-bucket',
    };
  }

  getActions(): IntegrationAction[] {
    return [
      {
        id: 'send_message',
        name: 'Send Message',
        description: 'Send a message to a Slack channel',
        parameters: [
          { name: 'channel', type: 'string', required: true, description: 'Channel ID or name' },
          { name: 'text', type: 'string', required: true, description: 'Message text' },
          { name: 'thread_ts', type: 'string', required: false, description: 'Thread timestamp to reply to' },
          { name: 'blocks', type: 'array', required: false, description: 'Rich message blocks' },
        ],
      },
      {
        id: 'list_channels',
        name: 'List Channels',
        description: 'Get list of channels in workspace',
        parameters: [
          { name: 'types', type: 'string', required: false, description: 'Channel types (public_channel,private_channel,im,mpim)' },
          { name: 'limit', type: 'number', required: false, description: 'Max channels to return (default: 100)' },
        ],
      },
      {
        id: 'create_channel',
        name: 'Create Channel',
        description: 'Create a new Slack channel',
        parameters: [
          { name: 'name', type: 'string', required: true, description: 'Channel name' },
          { name: 'is_private', type: 'boolean', required: false, description: 'Make channel private (default: false)' },
        ],
      },
      {
        id: 'upload_file',
        name: 'Upload File',
        description: 'Upload a file to Slack',
        parameters: [
          { name: 'channels', type: 'string', required: true, description: 'Comma-separated channel IDs' },
          { name: 'file_url', type: 'string', required: true, description: 'URL of file to upload' },
          { name: 'title', type: 'string', required: false, description: 'File title' },
          { name: 'comment', type: 'string', required: false, description: 'Initial comment' },
        ],
      },
    ];
  }

  getTriggers(): IntegrationTrigger[] {
    return [
      {
        id: 'new_message',
        name: 'New Message',
        description: 'Triggered when a new message is posted',
        eventType: 'message.channels',
        parameters: [
          { name: 'channel', type: 'string', required: false, description: 'Filter by channel' },
        ],
      },
    ];
  }

  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      const response = await this.makeRequest<any>(
        {
          url: 'https://slack.com/api/auth.test',
          method: 'GET',
        },
        credentials
      );

      if (!response.ok) {
        return {
          success: false,
          message: response.error || 'Authentication failed',
        };
      }

      return {
        success: true,
        message: `Connected to Slack workspace: ${response.team}`,
        details: { team: response.team, user: response.user },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to connect to Slack',
      };
    }
  }

  async executeAction(
    actionId: string,
    parameters: Record<string, any>,
    credentials: IntegrationCredentials
  ): Promise<IntegrationResult> {
    const validation = this.validateParameters(actionId, parameters);
    if (!validation.valid) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validation.errors.join(', ') },
      };
    }

    try {
      const response = await this.makeRequest(
        {
          url: `https://slack.com/api/${this.getEndpoint(actionId)}`,
          method: 'POST',
          data: parameters,
        },
        credentials
      );

      if (!response.ok) {
        return {
          success: false,
          error: { code: 'API_ERROR', message: response.error || 'Action failed' },
        };
      }

      return { success: true, data: response };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  private getEndpoint(actionId: string): string {
    const endpoints: Record<string, string> = {
      send_message: 'chat.postMessage',
      list_channels: 'conversations.list',
      create_channel: 'conversations.create',
      upload_file: 'files.upload',
    };
    return endpoints[actionId] || actionId;
  }
}
