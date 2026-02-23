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

/**
 * Gmail Integration
 * Provides email sending/receiving capabilities via Gmail API
 */
export class GmailIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return {
      provider: IntegrationProvider.GMAIL,
      name: 'Gmail',
      description: 'Send and read emails via Gmail',
      category: IntegrationCategory.COMMUNICATION,
      authType: AuthType.OAUTH2,
      logo: 'https://www.google.com/gmail/about/static/images/logo-gmail.png',
      color: '#EA4335',
      docUrl: 'https://developers.google.com/gmail/api',
      enabled: true,
    };
  }

  protected getRateLimitConfig(): RateLimitConfig {
    return {
      maxRequests: 250,
      windowMs: 1000, // 250 requests per second
      strategy: 'sliding-window',
    };
  }

  getActions(): IntegrationAction[] {
    return [
      {
        id: 'send_email',
        name: 'Send Email',
        description: 'Send an email via Gmail',
        parameters: [
          { name: 'to', type: 'string', required: true, description: 'Recipient email address' },
          { name: 'subject', type: 'string', required: true, description: 'Email subject' },
          { name: 'body', type: 'string', required: true, description: 'Email body (plain text or HTML)' },
          { name: 'cc', type: 'string', required: false, description: 'CC recipients (comma-separated)' },
          { name: 'bcc', type: 'string', required: false, description: 'BCC recipients (comma-separated)' },
          { name: 'attachments', type: 'array', required: false, description: 'Array of attachment URLs' },
        ],
      },
      {
        id: 'get_messages',
        name: 'Get Messages',
        description: 'Retrieve emails from inbox',
        parameters: [
          { name: 'maxResults', type: 'number', required: false, description: 'Maximum number of messages (default: 10)' },
          { name: 'query', type: 'string', required: false, description: 'Gmail search query (e.g., "is:unread")' },
          { name: 'labelIds', type: 'array', required: false, description: 'Label IDs to filter by' },
        ],
      },
      {
        id: 'search_messages',
        name: 'Search Messages',
        description: 'Search emails using Gmail query syntax',
        parameters: [
          { name: 'query', type: 'string', required: true, description: 'Gmail search query' },
          { name: 'maxResults', type: 'number', required: false, description: 'Maximum results (default: 50)' },
        ],
      },
      {
        id: 'mark_as_read',
        name: 'Mark as Read',
        description: 'Mark email(s) as read',
        parameters: [
          { name: 'messageIds', type: 'array', required: true, description: 'Array of message IDs to mark as read' },
        ],
      },
    ];
  }

  getTriggers(): IntegrationTrigger[] {
    return [
      {
        id: 'new_email',
        name: 'New Email',
        description: 'Triggered when a new email is received',
        eventType: 'email.received',
        parameters: [
          { name: 'from', type: 'string', required: false, description: 'Filter by sender email' },
          { name: 'subject', type: 'string', required: false, description: 'Filter by subject keywords' },
        ],
      },
    ];
  }

  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      const response = await this.makeRequest<any>(
        {
          url: 'https://gmail.googleapis.com/gmail/v1/users/me/profile',
          method: 'GET',
        },
        credentials
      );

      return {
        success: true,
        message: `Connected to Gmail account: ${response.emailAddress}`,
        details: { emailAddress: response.emailAddress },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to connect to Gmail',
        details: error.details,
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
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.errors.join(', '),
        },
      };
    }

    try {
      switch (actionId) {
        case 'send_email':
          return await this.sendEmail(parameters, credentials);
        case 'get_messages':
          return await this.getMessages(parameters, credentials);
        case 'search_messages':
          return await this.searchMessages(parameters, credentials);
        case 'mark_as_read':
          return await this.markAsRead(parameters, credentials);
        default:
          return {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: `Action '${actionId}' not found`,
            },
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code || 'EXECUTION_ERROR',
          message: error.message,
          details: error.details,
        },
      };
    }
  }

  private async sendEmail(
    params: Record<string, any>,
    credentials: IntegrationCredentials
  ): Promise<IntegrationResult> {
    // Build email message in RFC 2822 format
    const email = this.buildEmailMessage(params);
    const encodedEmail = Buffer.from(email).toString('base64url');

    const response = await this.makeRequest(
      {
        url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        method: 'POST',
        data: {
          raw: encodedEmail,
        },
      },
      credentials
    );

    return {
      success: true,
      data: {
        messageId: response.id,
        threadId: response.threadId,
      },
    };
  }

  private buildEmailMessage(params: Record<string, any>): string {
    const lines = [
      `To: ${params.to}`,
      `Subject: ${params.subject}`,
    ];

    if (params.cc) lines.push(`Cc: ${params.cc}`);
    if (params.bcc) lines.push(`Bcc: ${params.bcc}`);
    lines.push('Content-Type: text/html; charset=utf-8');
    lines.push('');
    lines.push(params.body);

    return lines.join('\r\n');
  }

  private async getMessages(
    params: Record<string, any>,
    credentials: IntegrationCredentials
  ): Promise<IntegrationResult> {
    const maxResults = params.maxResults || 10;
    const queryParams: any = { maxResults };

    if (params.query) queryParams.q = params.query;
    if (params.labelIds) queryParams.labelIds = params.labelIds.join(',');

    const response = await this.makeRequest(
      {
        url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
        method: 'GET',
        params: queryParams,
      },
      credentials
    );

    return {
      success: true,
      data: {
        messages: response.messages || [],
        resultSizeEstimate: response.resultSizeEstimate,
      },
    };
  }

  private async searchMessages(
    params: Record<string, any>,
    credentials: IntegrationCredentials
  ): Promise<IntegrationResult> {
    const maxResults = params.maxResults || 50;

    const response = await this.makeRequest(
      {
        url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
        method: 'GET',
        params: {
          q: params.query,
          maxResults,
        },
      },
      credentials
    );

    return {
      success: true,
      data: {
        messages: response.messages || [],
        count: response.resultSizeEstimate,
      },
    };
  }

  private async markAsRead(
    params: Record<string, any>,
    credentials: IntegrationCredentials
  ): Promise<IntegrationResult> {
    const messageIds = params.messageIds;

    await this.makeRequest(
      {
        url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify',
        method: 'POST',
        data: {
          ids: messageIds,
          removeLabelIds: ['UNREAD'],
        },
      },
      credentials
    );

    return {
      success: true,
      data: {
        markedCount: messageIds.length,
      },
    };
  }
}
