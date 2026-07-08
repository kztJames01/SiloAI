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

export class GoogleFormsIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.GOOGLE_FORMS, name: 'Google Forms', description: 'Create forms and collect responses', category: IntegrationCategory.FORMS, authType: AuthType.OAUTH2, color: '#7248B9', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'list_responses', name: 'List Responses', description: 'List form responses', parameters: [
        { name: 'formId', type: 'string', required: true, description: 'Form ID' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://forms.googleapis.com/v1/forms', method: 'GET', params: { pageSize: 1 } }, credentials);
      return { success: true, message: 'Connected to Google Forms' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'list_responses') {
        const data = await this.makeRequest({
          url: `https://forms.googleapis.com/v1/forms/${parameters.formId}/responses`,
          method: 'GET',
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

export class GoogleMeetIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.GOOGLE_MEET, name: 'Google Meet', description: 'Schedule and join video meetings', category: IntegrationCategory.COMMUNICATION, authType: AuthType.OAUTH2, color: '#00897B', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'create_meeting', name: 'Create Meeting', description: 'Create a Meet link via Calendar event', parameters: [
        { name: 'summary', type: 'string', required: true, description: 'Meeting title' },
        { name: 'start', type: 'string', required: true, description: 'Start time ISO' },
        { name: 'end', type: 'string', required: true, description: 'End time ISO' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://www.googleapis.com/calendar/v3/calendars/primary', method: 'GET' }, credentials);
      return { success: true, message: 'Connected to Google Meet' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'create_meeting') {
        const data = await this.makeRequest({
          url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          method: 'POST',
          data: {
            summary: parameters.summary,
            start: { dateTime: parameters.start },
            end: { dateTime: parameters.end },
            conferenceData: { createRequest: { requestId: `meet-${Date.now()}`, conferenceSolutionKey: { type: 'hangoutsMeet' } } },
          },
          params: { conferenceDataVersion: 1 },
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

export class GoogleSlidesIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.GOOGLE_SLIDES, name: 'Google Slides', description: 'Build and share presentations', category: IntegrationCategory.PRODUCTIVITY, authType: AuthType.OAUTH2, color: '#F4B400', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'create_presentation', name: 'Create Presentation', description: 'Create a blank slide deck', parameters: [
        { name: 'title', type: 'string', required: true, description: 'Presentation title' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://slides.googleapis.com/v1/presentations', method: 'GET', params: { pageSize: 1 } }, credentials);
      return { success: true, message: 'Connected to Google Slides' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'create_presentation') {
        const data = await this.makeRequest({
          url: 'https://slides.googleapis.com/v1/presentations',
          method: 'POST',
          data: { title: parameters.title },
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

export class GoogleContactsIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.GOOGLE_CONTACTS, name: 'Google Contacts', description: 'Manage customer and team contacts', category: IntegrationCategory.PRODUCTIVITY, authType: AuthType.OAUTH2, color: '#4285F4', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'list_contacts', name: 'List Contacts', description: 'List people contacts', parameters: [
        { name: 'pageSize', type: 'number', required: false, description: 'Max results' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://people.googleapis.com/v1/people/me/connections', method: 'GET', params: { personFields: 'names', pageSize: 1 } }, credentials);
      return { success: true, message: 'Connected to Google Contacts' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'list_contacts') {
        const data = await this.makeRequest({
          url: 'https://people.googleapis.com/v1/people/me/connections',
          method: 'GET',
          params: { personFields: 'names,emailAddresses,phoneNumbers', pageSize: parameters.pageSize || 25 },
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

export class MicrosoftWordIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.MICROSOFT_WORD, name: 'Microsoft Word', description: 'Create and edit Word documents online', category: IntegrationCategory.PRODUCTIVITY, authType: AuthType.OAUTH2, color: '#2B579A', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'list_documents', name: 'List Documents', description: 'List Word files in OneDrive', parameters: [] },
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://graph.microsoft.com/v1.0/me/drive/root/children', method: 'GET' }, credentials);
      return { success: true, message: 'Connected to Microsoft Word' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  async executeAction(actionId: string, _parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'list_documents') {
        const data = await this.makeRequest({
          url: 'https://graph.microsoft.com/v1.0/me/drive/root/search(q=\'.docx\')',
          method: 'GET',
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

export class MicrosoftPowerPointIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.MICROSOFT_POWERPOINT, name: 'Microsoft PowerPoint', description: 'Presentation files in Microsoft 365', category: IntegrationCategory.PRODUCTIVITY, authType: AuthType.OAUTH2, color: '#D24726', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'list_presentations', name: 'List Presentations', description: 'Search PowerPoint files', parameters: [] },
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://graph.microsoft.com/v1.0/me/drive/root', method: 'GET' }, credentials);
      return { success: true, message: 'Connected to PowerPoint' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  async executeAction(actionId: string, _parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'list_presentations') {
        const data = await this.makeRequest({
          url: 'https://graph.microsoft.com/v1.0/me/drive/root/search(q=\'.pptx\')',
          method: 'GET',
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

export class MicrosoftSharePointIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.MICROSOFT_SHAREPOINT, name: 'Microsoft SharePoint', description: 'Team sites, lists, and document libraries', category: IntegrationCategory.STORAGE, authType: AuthType.OAUTH2, color: '#038387', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'list_sites', name: 'List Sites', description: 'List SharePoint sites', parameters: [] },
      { id: 'list_lists', name: 'List Lists', description: 'List lists on a site', parameters: [
        { name: 'siteId', type: 'string', required: true, description: 'SharePoint site ID' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://graph.microsoft.com/v1.0/sites?search=*', method: 'GET' }, credentials);
      return { success: true, message: 'Connected to SharePoint' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'list_sites') {
        const data = await this.makeRequest({ url: 'https://graph.microsoft.com/v1.0/sites?search=*', method: 'GET' }, credentials);
        return { success: true, data };
      }
      if (actionId === 'list_lists') {
        const data = await this.makeRequest({ url: `https://graph.microsoft.com/v1.0/sites/${parameters.siteId}/lists`, method: 'GET' }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

export class MicrosoftTodoIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.MICROSOFT_TODO, name: 'Microsoft To Do', description: 'Task lists for crews and dispatch', category: IntegrationCategory.PRODUCTIVITY, authType: AuthType.OAUTH2, color: '#0078D4', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'list_task_lists', name: 'List Task Lists', description: 'Get To Do lists', parameters: [] },
      { id: 'create_task', name: 'Create Task', description: 'Add a task to a list', parameters: [
        { name: 'listId', type: 'string', required: true, description: 'Task list ID' },
        { name: 'title', type: 'string', required: true, description: 'Task title' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://graph.microsoft.com/v1.0/me/todo/lists', method: 'GET' }, credentials);
      return { success: true, message: 'Connected to Microsoft To Do' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'list_task_lists') {
        const data = await this.makeRequest({ url: 'https://graph.microsoft.com/v1.0/me/todo/lists', method: 'GET' }, credentials);
        return { success: true, data };
      }
      if (actionId === 'create_task') {
        const data = await this.makeRequest({
          url: `https://graph.microsoft.com/v1.0/me/todo/lists/${parameters.listId}/tasks`,
          method: 'POST',
          data: { title: parameters.title },
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}
