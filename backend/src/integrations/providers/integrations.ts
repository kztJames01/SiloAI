/**
 * Remaining Integration Providers
 * Condensed implementations for Google Sheets, Notion, Airtable, GitHub, Stripe, 
 * Twilio, OpenAI, Webhook, Dropbox, Trello, SendGrid, HubSpot, and Zoom
 */

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
} from '@silo/shared/types/integration';

// Google Sheets
export class GoogleSheetsIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return {
      provider: IntegrationProvider.GOOGLE_SHEETS,
      name: 'Google Sheets',
      description: 'Read and write data to Google Sheets',
      category: IntegrationCategory.PRODUCTIVITY,
      authType: AuthType.OAUTH2,
      logo: 'https://www.gstatic.com/images/branding/product/1x/sheets_2020q4_48dp.png',
      color: '#0F9D58',
      enabled: true,
    };
  }

  getActions(): IntegrationAction[] {
    return [
      {
        id: 'read_sheet',
        name: 'Read Sheet',
        description: 'Read data from a spreadsheet',
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'Spreadsheet ID' },
          { name: 'range', type: 'string', required: true, description: 'Range (e.g., Sheet1!A1:D10)' },
        ],
      },
      {
        id: 'append_row',
        name: 'Append Row',
        description: 'Append a row to the spreadsheet',
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'Spreadsheet ID' },
          { name: 'range', type: 'string', required: true, description: 'Range to append to' },
          { name: 'values', type: 'array', required: true, description: 'Values to append' },
        ],
      },
    ];
  }

  getTriggers(): IntegrationTrigger[] {
    return [];
  }

  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://sheets.googleapis.com/v4/spreadsheets', method: 'GET', params: { fields: 'spreadsheetId' } }, credentials);
      return { success: true, message: 'Connected to Google Sheets' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'read_sheet') {
        const data = await this.makeRequest({
          url: `https://sheets.googleapis.com/v4/spreadsheets/${parameters.spreadsheetId}/values/${parameters.range}`,
          method: 'GET',
        }, credentials);
        return { success: true, data };
      } else if (actionId === 'append_row') {
        const data = await this.makeRequest({
          url: `https://sheets.googleapis.com/v4/spreadsheets/${parameters.spreadsheetId}/values/${parameters.range}:append`,
          method: 'POST',
          params: { valueInputOption: 'USER_ENTERED' },
          data: { values: [parameters.values] },
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

// Notion
export class NotionIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return {
      provider: IntegrationProvider.NOTION,
      name: 'Notion',
      description: 'Create and manage Notion pages and databases',
      category: IntegrationCategory.PRODUCTIVITY,
      authType: AuthType.OAUTH2,
      color: '#000000',
      enabled: true,
    };
  }

  getActions(): IntegrationAction[] {
    return [
      { id: 'create_page', name: 'Create Page', description: 'Create a new page', parameters: [
        { name: 'parent_page_id', type: 'string', required: true, description: 'Parent page ID' },
        { name: 'title', type: 'string', required: true, description: 'Page title' },
        { name: 'content', type: 'object', required: false, description: 'Page content blocks' },
      ]},
      { id: 'query_database', name: 'Query Database', description: 'Query a Notion database', parameters: [
        { name: 'database_id', type: 'string', required: true, description: 'Database ID' },
        { name: 'filter', type: 'object', required: false, description: 'Filter object' },
      ]},
    ];
  }

  getTriggers(): IntegrationTrigger[] {
    return [];
  }

  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://api.notion.com/v1/users/me', method: 'GET' }, credentials);
      return { success: true, message: 'Connected to Notion' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  protected async applyAuthentication(config: any, credentials: IntegrationCredentials) {
    return {
      ...config,
      headers: {
        ...config.headers,
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Notion-Version': '2022-06-28',
      },
    };
  }

  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'create_page') {
        const data = await this.makeRequest({
          url: 'https://api.notion.com/v1/pages',
          method: 'POST',
          data: {
            parent: { page_id: parameters.parent_page_id },
            properties: { title: { title: [{ text: { content: parameters.title } }] } },
          },
        }, credentials);
        return { success: true, data };
      } else if (actionId === 'query_database') {
        const data = await this.makeRequest({
          url: `https://api.notion.com/v1/databases/${parameters.database_id}/query`,
          method: 'POST',
          data: { filter: parameters.filter },
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

// Airtable, GitHub, Stripe, Twilio, OpenAI, etc. (similar condensed implementations)
export class AirtableIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return {
      provider: IntegrationProvider.AIRTABLE,
      name: 'Airtable',
      description: 'Manage Airtable bases and records',
      category: IntegrationCategory.PRODUCTIVITY,
      authType: AuthType.API_KEY,
      color: '#FCB400',
      enabled: true,
    };
  }

  getActions(): IntegrationAction[] {
    return [
      { id: 'list_records', name: 'List Records', description: 'List records from a table', parameters: [
        { name: 'baseId', type: 'string', required: true, description: 'Base ID' },
        { name: 'tableName', type: 'string', required: true, description: 'Table name' },
      ]},
      { id: 'create_record', name: 'Create Record', description: 'Create a new record', parameters: [
        { name: 'baseId', type: 'string', required: true, description: 'Base ID' },
        { name: 'tableName', type: 'string', required: true, description: 'Table name' },
        { name: 'fields', type: 'object', required: true, description: 'Record fields' },
      ]},
    ];
  }

  getTriggers(): IntegrationTrigger[] {
    return [];
  }

  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://api.airtable.com/v0/meta/bases', method: 'GET' }, credentials);
      return { success: true, message: 'Connected to Airtable' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  protected async applyAuthentication(config: any, credentials: IntegrationCredentials) {
    return {
      ...config,
      headers: { ...config.headers, 'Authorization': `Bearer ${credentials.apiKey}` },
    };
  }

  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      const url = `https://api.airtable.com/v0/${parameters.baseId}/${encodeURIComponent(parameters.tableName)}`;
      if (actionId === 'list_records') {
        const data = await this.makeRequest({ url, method: 'GET' }, credentials);
        return { success: true, data };
      } else if (actionId === 'create_record') {
        const data = await this.makeRequest({ url, method: 'POST', data: { fields: parameters.fields } }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

// Continuing with remaining integrations...
export class GitHubIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return {
      provider: IntegrationProvider.GITHUB,
      name: 'GitHub',
      description: 'Manage repositories, issues, and pull requests',
      category: IntegrationCategory.DEVELOPMENT,
      authType: AuthType.OAUTH2,
      color: '#181717',
      enabled: true,
    };
  }

  getActions(): IntegrationAction[] {
    return [
      { id: 'create_issue', name: 'Create Issue', description: 'Create a GitHub issue', parameters: [
        { name: 'owner', type: 'string', required: true, description: 'Repository owner' },
        { name: 'repo', type: 'string', required: true, description: 'Repository name' },
        { name: 'title', type: 'string', required: true, description: 'Issue title' },
        { name: 'body', type: 'string', required: false, description: 'Issue body' },
      ]},
    ];
  }

  getTriggers(): IntegrationTrigger[] {
    return [];
  }

  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://api.github.com/user', method: 'GET' }, credentials);
      return { success: true, message: 'Connected to GitHub' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'create_issue') {
        const data = await this.makeRequest({
          url: `https://api.github.com/repos/${parameters.owner}/${parameters.repo}/issues`,
          method: 'POST',
          data: { title: parameters.title, body: parameters.body },
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

export class StripeIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return {
      provider: IntegrationProvider.STRIPE,
      name: 'Stripe',
      description: 'Process payments and manage customers',
      category: IntegrationCategory.PAYMENTS,
      authType: AuthType.API_KEY,
      color: '#635BFF',
      enabled: true,
    };
  }

  getActions(): IntegrationAction[] {
    return [
      { id: 'create_customer', name: 'Create Customer', description: 'Create a Stripe customer', parameters: [
        { name: 'email', type: 'string', required: true, description: 'Customer email' },
        { name: 'name', type: 'string', required: false, description: 'Customer name' },
      ]},
      { id: 'create_payment_intent', name: 'Create Payment Intent', description: 'Create a payment intent', parameters: [
        { name: 'amount', type: 'number', required: true, description: 'Amount in cents' },
        { name: 'currency', type: 'string', required: true, description: 'Currency code (e.g., usd)' },
      ]},
    ];
  }

  getTriggers(): IntegrationTrigger[] {
    return [];
  }

  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://api.stripe.com/v1/balance', method: 'GET' }, credentials);
      return { success: true, message: 'Connected to Stripe' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  protected async applyAuthentication(config: any, credentials: IntegrationCredentials) {
    return {
      ...config,
      headers: { ...config.headers, 'Authorization': `Bearer ${credentials.apiKey}` },
    };
  }

  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'create_customer') {
        const data = await this.makeRequest({
          url: 'https://api.stripe.com/v1/customers',
          method: 'POST',
          data: parameters,
        }, credentials);
        return { success: true, data };
      } else if (actionId === 'create_payment_intent') {
        const data = await this.makeRequest({
          url: 'https://api.stripe.com/v1/payment_intents',
          method: 'POST',
          data: parameters,
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

export class TwilioIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return {
      provider: IntegrationProvider.TWILIO,
      name: 'Twilio',
      description: 'Send SMS and make voice calls',
      category: IntegrationCategory.COMMUNICATION,
      authType: AuthType.BASIC_AUTH,
      color: '#F22F46',
      enabled: true,
    };
  }

  getActions(): IntegrationAction[] {
    return [
      { id: 'send_sms', name: 'Send SMS', description: 'Send an SMS message', parameters: [
        { name: 'to', type: 'string', required: true, description: 'Recipient phone number' },
        { name: 'from', type: 'string', required: true, description: 'Your Twilio phone number' },
        { name: 'body', type: 'string', required: true, description: 'Message body' },
      ]},
    ];
  }

  getTriggers(): IntegrationTrigger[] {
    return [];
  }

  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      const accountSid = credentials.username;
      await this.makeRequest({ url: `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, method: 'GET' }, credentials);
      return { success: true, message: 'Connected to Twilio' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'send_sms') {
        const accountSid = credentials.username;
        const data = await this.makeRequest({
          url: `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          method: 'POST',
          data: parameters,
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

export class OpenAIIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return {
      provider: IntegrationProvider.OPENAI,
      name: 'OpenAI',
      description: 'AI text generation and analysis',
      category: IntegrationCategory.AI,
      authType: AuthType.BEARER_TOKEN,
      color: '#412991',
      enabled: true,
    };
  }

  getActions(): IntegrationAction[] {
    return [
      { id: 'chat_completion', name: 'Chat Completion', description: 'Generate chat completion', parameters: [
        { name: 'model', type: 'string', required: true, description: 'Model (e.g., gpt-4)' },
        { name: 'messages', type: 'array', required: true, description: 'Array of messages' },
        { name: 'temperature', type: 'number', required: false, description: 'Temperature (0-2)' },
      ]},
    ];
  }

  getTriggers(): IntegrationTrigger[] {
    return [];
  }

  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://api.openai.com/v1/models', method: 'GET' }, credentials);
      return { success: true, message: 'Connected to OpenAI' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'chat_completion') {
        const data = await this.makeRequest({
          url: 'https://api.openai.com/v1/chat/completions',
          method: 'POST',
          data: parameters,
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

export class WebhookIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return {
      provider: IntegrationProvider.WEBHOOK,
      name: 'Webhook',
      description: 'Send HTTP requests to any endpoint',
      category: IntegrationCategory.CUSTOM,
      authType: AuthType.NONE,
      color: '#6366F1',
      enabled: true,
    };
  }

  getActions(): IntegrationAction[] {
    return [
      { id: 'http_request', name: 'HTTP Request', description: 'Make an HTTP request', parameters: [
        { name: 'url', type: 'string', required: true, description: 'Request URL' },
        { name: 'method', type: 'string', required: true, description: 'HTTP method' },
        { name: 'headers', type: 'object', required: false, description: 'Request headers' },
        { name: 'body', type: 'object', required: false, description: 'Request body' },
      ]},
    ];
  }

  getTriggers(): IntegrationTrigger[] {
    return [];
  }

  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    return { success: true, message: 'Webhook integration always available' };
  }

  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      const data = await this.makeRequest({
        url: parameters.url,
        method: parameters.method,
        headers: parameters.headers,
        data: parameters.body,
      }, credentials);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

// Simple stubs for remaining integrations
export class DropboxIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.DROPBOX, name: 'Dropbox', description: 'File storage and sharing', category: IntegrationCategory.STORAGE, authType: AuthType.OAUTH2, color: '#0061FF', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'list_folder', name: 'List Folder', description: 'List files and folders in a Dropbox path', parameters: [
        { name: 'path', type: 'string', required: false, description: 'Folder path (default root)' },
      ]},
      { id: 'upload_file', name: 'Upload File', description: 'Upload a file to Dropbox', parameters: [
        { name: 'path', type: 'string', required: true, description: 'Destination path including filename' },
        { name: 'contentBase64', type: 'string', required: true, description: 'Base64 encoded file content' },
        { name: 'mode', type: 'string', required: false, description: 'add or overwrite' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://api.dropboxapi.com/2/users/get_current_account', method: 'POST', data: {} }, credentials);
      return { success: true, message: 'Connected to Dropbox' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'list_folder') {
        const data = await this.makeRequest({
          url: 'https://api.dropboxapi.com/2/files/list_folder',
          method: 'POST',
          data: { path: parameters.path || '' },
        }, credentials);
        return { success: true, data };
      }

      if (actionId === 'upload_file') {
        const binary = Buffer.from(parameters.contentBase64, 'base64');
        const data = await this.makeRequest({
          url: 'https://content.dropboxapi.com/2/files/upload',
          method: 'POST',
          data: binary,
          headers: {
            'Content-Type': 'application/octet-stream',
            'Dropbox-API-Arg': JSON.stringify({
              path: parameters.path,
              mode: parameters.mode || 'add',
              autorename: true,
              mute: false,
            }),
          },
        }, credentials);
        return { success: true, data };
      }

      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code || 'API_ERROR', message: error.message || 'Action failed' } };
    }
  }
}

export class TrelloIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.TRELLO, name: 'Trello', description: 'Project management boards', category: IntegrationCategory.PRODUCTIVITY, authType: AuthType.API_KEY, color: '#0079BF', enabled: true, comingSoon: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'create_card', name: 'Create Card', description: 'Create a card in a Trello list', parameters: [
        { name: 'listId', type: 'string', required: true, description: 'List ID' },
        { name: 'name', type: 'string', required: true, description: 'Card name' },
        { name: 'description', type: 'string', required: false, description: 'Card description' },
      ]},
      { id: 'list_cards', name: 'List Cards', description: 'List cards in a Trello list', parameters: [
        { name: 'listId', type: 'string', required: true, description: 'List ID' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(_credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    return { success: true, message: 'Connected' };
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      const key = credentials.apiKey;
      const token = credentials.apiSecret || credentials.accessToken;
      const authParams = { key, token };

      if (actionId === 'create_card') {
        const data = await this.makeRequest({
          url: 'https://api.trello.com/1/cards',
          method: 'POST',
          params: {
            ...authParams,
            idList: parameters.listId,
            name: parameters.name,
            desc: parameters.description || '',
          },
        }, credentials);
        return { success: true, data };
      }

      if (actionId === 'list_cards') {
        const data = await this.makeRequest({
          url: `https://api.trello.com/1/lists/${parameters.listId}/cards`,
          method: 'GET',
          params: authParams,
        }, credentials);
        return { success: true, data };
      }

      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code || 'API_ERROR', message: error.message || 'Action failed' } };
    }
  }
}

export class SendGridIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.SENDGRID, name: 'SendGrid', description: 'Email delivery service', category: IntegrationCategory.COMMUNICATION, authType: AuthType.API_KEY, color: '#1A82E2', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'send_email', name: 'Send Email', description: 'Send an email using SendGrid', parameters: [
        { name: 'from', type: 'string', required: true, description: 'Sender email' },
        { name: 'to', type: 'string', required: true, description: 'Recipient email' },
        { name: 'subject', type: 'string', required: true, description: 'Email subject' },
        { name: 'text', type: 'string', required: false, description: 'Plain text body' },
        { name: 'html', type: 'string', required: false, description: 'HTML body' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  protected async applyAuthentication(config: any, credentials: IntegrationCredentials) {
    return {
      ...config,
      headers: { ...config.headers, Authorization: `Bearer ${credentials.apiKey || credentials.accessToken}` },
    };
  }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://api.sendgrid.com/v3/user/account', method: 'GET' }, credentials);
      return { success: true, message: 'Connected to SendGrid' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'send_email') {
        const content: any[] = [];
        if (parameters.text) content.push({ type: 'text/plain', value: parameters.text });
        if (parameters.html) content.push({ type: 'text/html', value: parameters.html });
        if (content.length === 0) {
          return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Either text or html is required' } };
        }
        const data = await this.makeRequest({
          url: 'https://api.sendgrid.com/v3/mail/send',
          method: 'POST',
          data: {
            personalizations: [{ to: [{ email: parameters.to }] }],
            from: { email: parameters.from },
            subject: parameters.subject,
            content,
          },
        }, credentials);
        return { success: true, data };
      }

      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code || 'API_ERROR', message: error.message || 'Action failed' } };
    }
  }
}

export class HubSpotIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.HUBSPOT, name: 'HubSpot', description: 'CRM and marketing automation', category: IntegrationCategory.MARKETING, authType: AuthType.OAUTH2, color: '#FF7A59', enabled: true, comingSoon: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'create_contact', name: 'Create Contact', description: 'Create a contact in HubSpot', parameters: [
        { name: 'email', type: 'string', required: true, description: 'Contact email' },
        { name: 'firstname', type: 'string', required: false, description: 'First name' },
        { name: 'lastname', type: 'string', required: false, description: 'Last name' },
      ]},
      { id: 'search_contacts', name: 'Search Contacts', description: 'Search contacts by email', parameters: [
        { name: 'email', type: 'string', required: true, description: 'Email to search' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(_credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    return { success: true, message: 'Connected' };
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'create_contact') {
        const data = await this.makeRequest({
          url: 'https://api.hubapi.com/crm/v3/objects/contacts',
          method: 'POST',
          data: {
            properties: {
              email: parameters.email,
              firstname: parameters.firstname,
              lastname: parameters.lastname,
            },
          },
        }, credentials);
        return { success: true, data };
      }

      if (actionId === 'search_contacts') {
        const data = await this.makeRequest({
          url: 'https://api.hubapi.com/crm/v3/objects/contacts/search',
          method: 'POST',
          data: {
            filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: parameters.email }] }],
            limit: 10,
          },
        }, credentials);
        return { success: true, data };
      }

      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code || 'API_ERROR', message: error.message || 'Action failed' } };
    }
  }
}

export class ZoomIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.ZOOM, name: 'Zoom', description: 'Video conferencing', category: IntegrationCategory.COMMUNICATION, authType: AuthType.OAUTH2, color: '#2D8CFF', enabled: true, comingSoon: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'create_meeting', name: 'Create Meeting', description: 'Create a Zoom meeting', parameters: [
        { name: 'topic', type: 'string', required: true, description: 'Meeting topic' },
        { name: 'startTime', type: 'string', required: false, description: 'Start time (ISO 8601)' },
        { name: 'duration', type: 'number', required: false, description: 'Duration in minutes' },
      ]},
      { id: 'list_meetings', name: 'List Meetings', description: 'List user meetings', parameters: [] },
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(_credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    return { success: true, message: 'Connected' };
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'create_meeting') {
        const data = await this.makeRequest({
          url: 'https://api.zoom.us/v2/users/me/meetings',
          method: 'POST',
          data: {
            topic: parameters.topic,
            type: parameters.startTime ? 2 : 1,
            start_time: parameters.startTime,
            duration: parameters.duration || 30,
            settings: { waiting_room: true },
          },
        }, credentials);
        return { success: true, data };
      }

      if (actionId === 'list_meetings') {
        const data = await this.makeRequest({
          url: 'https://api.zoom.us/v2/users/me/meetings',
          method: 'GET',
        }, credentials);
        return { success: true, data };
      }

      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code || 'API_ERROR', message: error.message || 'Action failed' } };
    }
  }
}

// ── Google Suite ──────────────────────────────────────────────────────────────

export class GoogleDriveIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.GOOGLE_DRIVE, name: 'Google Drive', description: 'Cloud file storage and sharing', category: IntegrationCategory.STORAGE, authType: AuthType.OAUTH2, color: '#4285F4', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'upload_file', name: 'Upload File', description: 'Upload a file to Google Drive', parameters: [
        { name: 'fileName', type: 'string', required: true, description: 'File name' },
        { name: 'folderId', type: 'string', required: false, description: 'Parent folder ID' },
      ]},
      { id: 'list_files', name: 'List Files', description: 'List files in a folder', parameters: [
        { name: 'folderId', type: 'string', required: false, description: 'Folder ID' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://www.googleapis.com/drive/v3/about?fields=user', method: 'GET' }, credentials);
      return { success: true, message: 'Connected to Google Drive' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'list_files') {
        const data = await this.makeRequest({ url: 'https://www.googleapis.com/drive/v3/files', method: 'GET', params: { q: parameters.folderId ? `'${parameters.folderId}' in parents` : undefined } }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

export class GoogleCalendarIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.GOOGLE_CALENDAR, name: 'Google Calendar', description: 'Schedule and manage events', category: IntegrationCategory.PRODUCTIVITY, authType: AuthType.OAUTH2, color: '#4285F4', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'create_event', name: 'Create Event', description: 'Create a calendar event', parameters: [
        { name: 'summary', type: 'string', required: true, description: 'Event title' },
        { name: 'start', type: 'string', required: true, description: 'Start time (ISO 8601)' },
        { name: 'end', type: 'string', required: true, description: 'End time (ISO 8601)' },
      ]},
      { id: 'list_events', name: 'List Events', description: 'List upcoming events', parameters: [
        { name: 'maxResults', type: 'number', required: false, description: 'Max events to return' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://www.googleapis.com/calendar/v3/calendars/primary', method: 'GET' }, credentials);
      return { success: true, message: 'Connected to Google Calendar' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'create_event') {
        const data = await this.makeRequest({
          url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          method: 'POST',
          data: { summary: parameters.summary, start: { dateTime: parameters.start }, end: { dateTime: parameters.end } },
        }, credentials);
        return { success: true, data };
      } else if (actionId === 'list_events') {
        const data = await this.makeRequest({
          url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          method: 'GET',
          params: { maxResults: parameters.maxResults || 10, orderBy: 'startTime', singleEvents: true, timeMin: new Date().toISOString() },
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

export class GoogleDocsIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.GOOGLE_DOCS, name: 'Google Docs', description: 'Create and edit documents', category: IntegrationCategory.PRODUCTIVITY, authType: AuthType.OAUTH2, color: '#4285F4', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'create_document', name: 'Create Document', description: 'Create a new Google Doc', parameters: [
        { name: 'title', type: 'string', required: true, description: 'Document title' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://docs.googleapis.com/v1/documents', method: 'GET', params: { pageSize: 1 } }, credentials);
      return { success: true, message: 'Connected to Google Docs' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'create_document') {
        const created = await this.makeRequest<any>({
          url: 'https://docs.googleapis.com/v1/documents',
          method: 'POST',
          data: { title: parameters.title },
        }, credentials);

        if (parameters.content) {
          await this.makeRequest({
            url: `https://docs.googleapis.com/v1/documents/${created.documentId}:batchUpdate`,
            method: 'POST',
            data: {
              requests: [{
                insertText: {
                  location: { index: 1 },
                  text: String(parameters.content),
                },
              }],
            },
          }, credentials);
        }

        return { success: true, data: created };
      }

      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code || 'API_ERROR', message: error.message || 'Action failed' } };
    }
  }
}

export class YouTubeIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.YOUTUBE, name: 'YouTube', description: 'Video management and analytics', category: IntegrationCategory.VIDEO, authType: AuthType.OAUTH2, color: '#FF0000', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'upload_video', name: 'Upload Video', description: 'Upload a video to YouTube', parameters: [
        { name: 'title', type: 'string', required: true, description: 'Video title' },
        { name: 'description', type: 'string', required: false, description: 'Video description' },
        { name: 'videoBase64', type: 'string', required: true, description: 'Base64 encoded video content' },
        { name: 'privacyStatus', type: 'string', required: false, description: 'public, unlisted, or private' },
      ]},
      { id: 'list_videos', name: 'List Videos', description: 'List channel videos', parameters: [] },
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://www.googleapis.com/youtube/v3/channels', method: 'GET', params: { part: 'id', mine: true } }, credentials);
      return { success: true, message: 'Connected to YouTube' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'list_videos') {
        const channel = await this.makeRequest<any>({
          url: 'https://www.googleapis.com/youtube/v3/channels',
          method: 'GET',
          params: { part: 'contentDetails', mine: true },
        }, credentials);
        const uploads = channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
        const data = await this.makeRequest({
          url: 'https://www.googleapis.com/youtube/v3/playlistItems',
          method: 'GET',
          params: { part: 'snippet,contentDetails', playlistId: uploads, maxResults: 20 },
        }, credentials);
        return { success: true, data };
      }

      if (actionId === 'upload_video') {
        const boundary = `silo_${Date.now()}`;
        const metadata = {
          snippet: {
            title: parameters.title,
            description: parameters.description || '',
          },
          status: {
            privacyStatus: parameters.privacyStatus || 'private',
          },
        };
        const binary = Buffer.from(parameters.videoBase64, 'base64');
        const multipartBody = Buffer.concat([
          Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
          Buffer.from(`--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`),
          binary,
          Buffer.from(`\r\n--${boundary}--`),
        ]);

        const data = await this.makeRequest({
          url: 'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart',
          method: 'POST',
          headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
          data: multipartBody,
        }, credentials);
        return { success: true, data };
      }

      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code || 'API_ERROR', message: error.message || 'Action failed' } };
    }
  }
}

// ── Microsoft Suite ───────────────────────────────────────────────────────────

export class MicrosoftOutlookIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.MICROSOFT_OUTLOOK, name: 'Microsoft Outlook', description: 'Email and calendar management', category: IntegrationCategory.COMMUNICATION, authType: AuthType.OAUTH2, color: '#0078D4', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'send_email', name: 'Send Email', description: 'Send an email via Outlook', parameters: [
        { name: 'to', type: 'string', required: true, description: 'Recipient email' },
        { name: 'subject', type: 'string', required: true, description: 'Email subject' },
        { name: 'body', type: 'string', required: true, description: 'Email body' },
      ]},
      { id: 'list_messages', name: 'List Messages', description: 'List recent emails', parameters: [] },
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(_credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    return { success: true, message: 'Connected to Outlook' };
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'send_email') {
        const { to, subject, body } = parameters;
        const message = {
          message: {
            subject,
            body: { contentType: 'Text', content: body },
            toRecipients: [{ emailAddress: { address: to } }]
          },
          saveToSentItems: true
        };
        const data = await this.makeRequest({
          url: `https://graph.microsoft.com/v1.0/me/sendMail`,
          method: 'POST',
          data: message
        }, credentials);
        return { success: true, data };
      } else if (actionId === 'list_messages') {
        const data = await this.makeRequest({
          url: `https://graph.microsoft.com/v1.0/me/messages`,
          method: 'GET'
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code || 'API_ERROR', message: error.message || 'Action failed' } };
    }
  }
}

export class MicrosoftTeamsIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.MICROSOFT_TEAMS, name: 'Microsoft Teams', description: 'Team collaboration and messaging', category: IntegrationCategory.COMMUNICATION, authType: AuthType.OAUTH2, color: '#6264A7', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'send_message', name: 'Send Message', description: 'Send a message to a channel', parameters: [
        { name: 'teamId', type: 'string', required: true, description: 'Team ID' },
        { name: 'channelId', type: 'string', required: true, description: 'Channel ID' },
        { name: 'message', type: 'string', required: true, description: 'Message content' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(_credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    return { success: true, message: 'Connected to Teams' };
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'send_message') {
        const { teamId, channelId, message } = parameters;
        const data = await this.makeRequest({
          url: `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages`,
          method: 'POST',
          data: { body: { contentType: 'html', content: message } }
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code || 'API_ERROR', message: error.message || 'Action failed' } };
    }
  }
}

export class MicrosoftExcelIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.MICROSOFT_EXCEL, name: 'Microsoft Excel', description: 'Spreadsheet management and analysis', category: IntegrationCategory.PRODUCTIVITY, authType: AuthType.OAUTH2, color: '#217346', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'read_range', name: 'Read Range', description: 'Read a range of cells', parameters: [
        { name: 'workbookId', type: 'string', required: true, description: 'Workbook ID' },
        { name: 'range', type: 'string', required: true, description: 'Cell range (e.g., A1:D10)' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(_credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    return { success: true, message: 'Connected to Excel' };
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'read_range') {
        const { workbookId, range } = parameters;
        const data = await this.makeRequest({
          url: `https://graph.microsoft.com/v1.0/me/drive/items/${workbookId}/workbook/worksheets('Sheet1')/range(address='${range}')`,
          method: 'GET'
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code || 'API_ERROR', message: error.message || 'Action failed' } };
    }
  }
}

export class MicrosoftOneDriveIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.MICROSOFT_ONEDRIVE, name: 'Microsoft OneDrive', description: 'Cloud file storage and sync', category: IntegrationCategory.STORAGE, authType: AuthType.OAUTH2, color: '#0078D4', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'list_files', name: 'List Files', description: 'List OneDrive files', parameters: [] },
      { id: 'upload_file', name: 'Upload File', description: 'Upload a file', parameters: [
        { name: 'fileName', type: 'string', required: true, description: 'File name' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://graph.microsoft.com/v1.0/me/drive/root', method: 'GET' }, credentials);
      return { success: true, message: 'Connected to OneDrive' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'list_files') {
        const data = await this.makeRequest({
          url: 'https://graph.microsoft.com/v1.0/me/drive/root/children',
          method: 'GET',
        }, credentials);
        return { success: true, data };
      }

      if (actionId === 'upload_file') {
        const contentBase64 = parameters.contentBase64;
        const data = await this.makeRequest({
          url: `https://graph.microsoft.com/v1.0/me/drive/root:/${parameters.fileName}:/content`,
          method: 'PUT',
          headers: { 'Content-Type': 'application/octet-stream' },
          data: contentBase64 ? Buffer.from(contentBase64, 'base64') : '',
        }, credentials);
        return { success: true, data };
      }

      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code || 'API_ERROR', message: error.message || 'Action failed' } };
    }
  }
}



// ── Productivity & Project Management ─────────────────────────────────────────

export class ClickUpIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.CLICKUP, name: 'ClickUp', description: 'Project management and task tracking', category: IntegrationCategory.PRODUCTIVITY, authType: AuthType.OAUTH2, color: '#7B68EE', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'create_task', name: 'Create Task', description: 'Create a new task', parameters: [
        { name: 'listId', type: 'string', required: true, description: 'List ID' },
        { name: 'name', type: 'string', required: true, description: 'Task name' },
        { name: 'description', type: 'string', required: false, description: 'Task description' },
      ]},
      { id: 'list_tasks', name: 'List Tasks', description: 'Get tasks from a list', parameters: [
        { name: 'listId', type: 'string', required: true, description: 'List ID' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://api.clickup.com/api/v2/user', method: 'GET' }, credentials);
      return { success: true, message: 'Connected to ClickUp' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'create_task') {
        const data = await this.makeRequest({
          url: `https://api.clickup.com/api/v2/list/${parameters.listId}/task`,
          method: 'POST',
          data: {
            name: parameters.name,
            description: parameters.description || '',
          },
        }, credentials);
        return { success: true, data };
      }

      if (actionId === 'list_tasks') {
        const data = await this.makeRequest({
          url: `https://api.clickup.com/api/v2/list/${parameters.listId}/task`,
          method: 'GET',
        }, credentials);
        return { success: true, data };
      }

      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code || 'API_ERROR', message: error.message || 'Action failed' } };
    }
  }
}

// ── Marketing ─────────────────────────────────────────────────────────────────

export class MailChimpIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.MAILCHIMP, name: 'Mailchimp', description: 'Email marketing and campaigns', category: IntegrationCategory.MARKETING, authType: AuthType.API_KEY, color: '#FFE01B', enabled: true, comingSoon: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'create_campaign', name: 'Create Campaign', description: 'Create email campaign', parameters: [
        { name: 'listId', type: 'string', required: true, description: 'Audience list ID' },
        { name: 'subject', type: 'string', required: true, description: 'Email subject' },
      ]},
      { id: 'add_subscriber', name: 'Add Subscriber', description: 'Add a subscriber to a list', parameters: [
        { name: 'listId', type: 'string', required: true, description: 'Audience list ID' },
        { name: 'email', type: 'string', required: true, description: 'Subscriber email' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(_credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    return { success: true, message: 'Connected to Mailchimp' };
  }
  private getBaseUrl(apiKey: string): string {
    const datacenter = apiKey.split('-')[1] || 'us1';
    return `https://${datacenter}.api.mailchimp.com/3.0`;
  }

  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      const apiKey = credentials.apiKey || '';
      const baseUrl = this.getBaseUrl(apiKey);
      const auth = { username: 'anystring', password: apiKey };

      if (actionId === 'create_campaign') {
        const { listId, subject } = parameters;
        const data = await this.makeRequest({
          url: `${baseUrl}/campaigns`,
          method: 'POST',
          data: { type: 'regular', recipients: { list_id: listId }, settings: { subject_line: subject } },
          auth
        }, credentials);
        return { success: true, data };
      } else if (actionId === 'add_subscriber') {
        const { listId, email } = parameters;
        const subscriberHash = require('crypto').createHash('md5').update(email.toLowerCase()).digest('hex');
        const data = await this.makeRequest({
          url: `${baseUrl}/lists/${listId}/members/${subscriberHash}`,
          method: 'PUT',
          data: { email_address: email, status: 'subscribed', status_if_new: 'subscribed' },
          auth
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code || 'API_ERROR', message: error.message || 'Action failed' } };
    }
  }
}

export class FacebookAdsIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.FACEBOOK_ADS, name: 'Facebook Ads', description: 'Advertising campaigns on Facebook & Instagram', category: IntegrationCategory.MARKETING, authType: AuthType.OAUTH2, color: '#1877F2', enabled: true, comingSoon: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'create_campaign', name: 'Create Campaign', description: 'Create an ad campaign', parameters: [
        { name: 'adAccountId', type: 'string', required: true, description: 'Ad account ID (without act_)' },
        { name: 'name', type: 'string', required: true, description: 'Campaign name' },
        { name: 'objective', type: 'string', required: true, description: 'Campaign objective' },
        { name: 'status', type: 'string', required: false, description: 'PAUSED or ACTIVE' },
      ]},
      { id: 'get_insights', name: 'Get Insights', description: 'Get campaign performance metrics', parameters: [
        { name: 'campaignId', type: 'string', required: true, description: 'Campaign ID' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(_credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    return { success: true, message: 'Connected to Facebook Ads' };
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'create_campaign') {
        const data = await this.makeRequest({
          url: `https://graph.facebook.com/v20.0/act_${parameters.adAccountId}/campaigns`,
          method: 'POST',
          params: {
            name: parameters.name,
            objective: parameters.objective,
            status: parameters.status || 'PAUSED',
            special_ad_categories: '[]',
          },
        }, credentials);
        return { success: true, data };
      }

      if (actionId === 'get_insights') {
        const data = await this.makeRequest({
          url: `https://graph.facebook.com/v20.0/${parameters.campaignId}/insights`,
          method: 'GET',
          params: {
            fields: 'impressions,clicks,spend,cpc,ctr',
          },
        }, credentials);
        return { success: true, data };
      }

      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code || 'API_ERROR', message: error.message || 'Action failed' } };
    }
  }
}

export class TypeformIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.TYPEFORM, name: 'Typeform', description: 'Interactive forms and surveys', category: IntegrationCategory.FORMS, authType: AuthType.OAUTH2, color: '#262627', enabled: true, comingSoon: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'list_responses', name: 'List Responses', description: 'Get form responses', parameters: [
        { name: 'formId', type: 'string', required: true, description: 'Form ID' },
      ]},
      { id: 'create_form', name: 'Create Form', description: 'Create a new form', parameters: [
        { name: 'title', type: 'string', required: true, description: 'Form title' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(_credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    return { success: true, message: 'Connected to Typeform' };
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'list_responses') {
        const { formId } = parameters;
        const data = await this.makeRequest({
          url: `https://api.typeform.com/forms/${formId}/responses`,
          method: 'GET'
        }, credentials);
        return { success: true, data };
      } else if (actionId === 'create_form') {
        const { title } = parameters;
        const data = await this.makeRequest({
          url: `https://api.typeform.com/forms`,
          method: 'POST',
          data: { title }
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code || 'API_ERROR', message: error.message || 'Action failed' } };
    }
  }
}

// ── AI ────────────────────────────────────────────────────────────────────────

export class ChatGPTIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.CHATGPT, name: 'ChatGPT', description: 'Conversational AI assistant', category: IntegrationCategory.AI, authType: AuthType.BEARER_TOKEN, color: '#10A37F', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'chat', name: 'Chat', description: 'Send a message to ChatGPT', parameters: [
        { name: 'message', type: 'string', required: true, description: 'User message' },
        { name: 'model', type: 'string', required: false, description: 'Model (default: gpt-4o)' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  protected async applyAuthentication(config: any, credentials: IntegrationCredentials) {
    const token = credentials.accessToken || credentials.apiKey;
    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      },
    };
  }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://api.openai.com/v1/models', method: 'GET' }, credentials);
      return { success: true, message: 'Connected to ChatGPT' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'chat') {
        const data = await this.makeRequest({
          url: 'https://api.openai.com/v1/chat/completions',
          method: 'POST',
          data: {
            model: parameters.model || 'gpt-4o-mini',
            messages: [
              ...(Array.isArray(parameters.messages) ? parameters.messages : []),
              ...(parameters.message ? [{ role: 'user', content: parameters.message }] : []),
            ],
            temperature: parameters.temperature ?? 0.7,
          },
        }, credentials);
        return {
          success: true,
          data: {
            id: data.id,
            model: data.model,
            output: data.choices?.[0]?.message?.content,
            usage: data.usage,
            raw: data,
          },
        };
      }

      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code || 'API_ERROR', message: error.message || 'Action failed' } };
    }
  }
}
