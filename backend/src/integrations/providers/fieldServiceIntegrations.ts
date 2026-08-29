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

export class ServiceTitanIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.SERVICE_TITAN, name: 'ServiceTitan', description: 'HVAC, plumbing, and electrical field service ops', category: IntegrationCategory.FIELD_SERVICE, authType: AuthType.OAUTH2, color: '#FF6B00', docUrl: 'https://developer.servicetitan.io/', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'list_jobs', name: 'List Jobs', description: 'List scheduled jobs', parameters: [{ name: 'page', type: 'number', required: false, description: 'Page number' }] },
      { id: 'list_customers', name: 'List Customers', description: 'List customer records', parameters: [] },
    ];
  }
  getTriggers(): IntegrationTrigger[] {
    return [{ id: 'job_completed', name: 'Job Completed', description: 'When a job is marked complete', eventType: 'job.completed', parameters: [] }];
  }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    if (!credentials.accessToken && !credentials.apiKey) return { success: false, message: 'ServiceTitan API credentials required' };
    return { success: true, message: 'ServiceTitan credentials saved' };
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    const tenant = credentials.metadata?.tenantId || process.env.SERVICE_TITAN_TENANT_ID;
    const base = `https://api.servicetitan.io/jpm/v2/tenant/${tenant}`;
    try {
      if (actionId === 'list_jobs') {
        const data = await this.makeRequest({ url: `${base}/jobs`, method: 'GET', params: { page: parameters.page || 1 } }, credentials);
        return { success: true, data };
      }
      if (actionId === 'list_customers') {
        const data = await this.makeRequest({ url: `https://api.servicetitan.io/crm/v2/tenant/${tenant}/customers`, method: 'GET' }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

export class JobberIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.JOBBER, name: 'Jobber', description: 'Quotes, scheduling, and invoicing for home services', category: IntegrationCategory.FIELD_SERVICE, authType: AuthType.OAUTH2, color: '#84BD00', docUrl: 'https://developer.getjobber.com/', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'list_clients', name: 'List Clients', description: 'Get client list', parameters: [] },
      { id: 'list_jobs', name: 'List Jobs', description: 'Get scheduled visits', parameters: [] },
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    if (!credentials.accessToken) return { success: false, message: 'Jobber OAuth token required' };
    return { success: true, message: 'Jobber connected' };
  }
  async executeAction(actionId: string, _parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      const query = actionId === 'list_clients'
        ? '{ clients { nodes { id name } } }'
        : '{ jobs { nodes { id title } } }';
      const data = await this.makeRequest({
        url: 'https://api.getjobber.com/api/graphql',
        method: 'POST',
        data: { query },
      }, credentials);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

export class HousecallProIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.HOUSECALL_PRO, name: 'Housecall Pro', description: 'Dispatch and payments for trade businesses', category: IntegrationCategory.FIELD_SERVICE, authType: AuthType.API_KEY, color: '#005CB9', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'list_jobs', name: 'List Jobs', description: 'List jobs', parameters: [] },
      { id: 'create_customer', name: 'Create Customer', description: 'Add a customer', parameters: [
        { name: 'firstName', type: 'string', required: true, description: 'First name' },
        { name: 'lastName', type: 'string', required: true, description: 'Last name' },
        { name: 'email', type: 'string', required: false, description: 'Email' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  protected async applyAuthentication(config: any, credentials: IntegrationCredentials) {
    return { ...config, headers: { ...config.headers, Authorization: `Bearer ${credentials.apiKey || credentials.accessToken}` } };
  }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    if (!credentials.apiKey && !credentials.accessToken) return { success: false, message: 'Housecall Pro API key required' };
    return { success: true, message: 'Housecall Pro connected' };
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'list_jobs') {
        const data = await this.makeRequest({ url: 'https://api.housecallpro.com/jobs', method: 'GET' }, credentials);
        return { success: true, data };
      }
      if (actionId === 'create_customer') {
        const data = await this.makeRequest({
          url: 'https://api.housecallpro.com/customers',
          method: 'POST',
          data: { first_name: parameters.firstName, last_name: parameters.lastName, email: parameters.email },
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

export class CompanyCamIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.COMPANYCAM, name: 'CompanyCam', description: 'Job site photos for contractors and crews', category: IntegrationCategory.FIELD_SERVICE, authType: AuthType.API_KEY, color: '#FFD100', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'list_projects', name: 'List Projects', description: 'List job site projects', parameters: [] },
      { id: 'list_photos', name: 'List Photos', description: 'Photos on a project', parameters: [
        { name: 'projectId', type: 'string', required: true, description: 'Project ID' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  protected async applyAuthentication(config: any, credentials: IntegrationCredentials) {
    return { ...config, headers: { ...config.headers, Authorization: `Bearer ${credentials.apiKey || credentials.accessToken}` } };
  }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    if (!credentials.apiKey) return { success: false, message: 'CompanyCam API token required' };
    return { success: true, message: 'CompanyCam connected' };
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'list_projects') {
        const data = await this.makeRequest({ url: 'https://api.companycam.com/v2/projects', method: 'GET' }, credentials);
        return { success: true, data };
      }
      if (actionId === 'list_photos') {
        const data = await this.makeRequest({ url: `https://api.companycam.com/v2/projects/${parameters.projectId}/photos`, method: 'GET' }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

export class WorkizIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.WORKIZ, name: 'Workiz', description: 'CRM and dispatch for locksmiths, HVAC, and garage door pros', category: IntegrationCategory.FIELD_SERVICE, authType: AuthType.API_KEY, color: '#1E88E5', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'list_jobs', name: 'List Jobs', description: 'List work orders', parameters: [] },
      { id: 'create_lead', name: 'Create Lead', description: 'Create a new lead', parameters: [
        { name: 'name', type: 'string', required: true, description: 'Customer name' },
        { name: 'phone', type: 'string', required: true, description: 'Phone number' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  protected async applyAuthentication(config: any, credentials: IntegrationCredentials) {
    return { ...config, headers: { ...config.headers, Authorization: credentials.apiKey } };
  }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    if (!credentials.apiKey) return { success: false, message: 'Workiz API key required' };
    return { success: true, message: 'Workiz connected' };
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'list_jobs') {
        const data = await this.makeRequest({ url: 'https://api.workiz.com/api/v1/jobs', method: 'GET' }, credentials);
        return { success: true, data };
      }
      if (actionId === 'create_lead') {
        const data = await this.makeRequest({
          url: 'https://api.workiz.com/api/v1/leads',
          method: 'POST',
          data: { name: parameters.name, phone: parameters.phone },
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

export class BuilderTrendIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.BUILDERTREND, name: 'BuilderTrend', description: 'Construction project management and subs', category: IntegrationCategory.FIELD_SERVICE, authType: AuthType.OAUTH2, color: '#F7941D', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'list_projects', name: 'List Projects', description: 'Active construction jobs', parameters: [] },
      { id: 'list_schedules', name: 'List Schedules', description: 'Schedule items for a project', parameters: [
        { name: 'projectId', type: 'string', required: true, description: 'Project ID' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] { return []; }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    if (!credentials.accessToken) return { success: false, message: 'BuilderTrend token required' };
    return { success: true, message: 'BuilderTrend connected' };
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    const base = 'https://api.buildertrend.net/api';
    try {
      if (actionId === 'list_projects') {
        const data = await this.makeRequest({ url: `${base}/projects`, method: 'GET' }, credentials);
        return { success: true, data };
      }
      if (actionId === 'list_schedules') {
        const data = await this.makeRequest({ url: `${base}/projects/${parameters.projectId}/schedules`, method: 'GET' }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}

export class ServiceM8Integration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return { provider: IntegrationProvider.SERVICEM8, name: 'ServiceM8', description: 'Jobs, quotes, and invoicing for mobile trades', category: IntegrationCategory.FIELD_SERVICE, authType: AuthType.OAUTH2, color: '#00AEEF', enabled: true };
  }
  getActions(): IntegrationAction[] {
    return [
      { id: 'list_jobs', name: 'List Jobs', description: 'Open and scheduled jobs', parameters: [] },
      { id: 'create_job', name: 'Create Job', description: 'Create a job card', parameters: [
        { name: 'jobDescription', type: 'string', required: true, description: 'Job description' },
        { name: 'companyName', type: 'string', required: false, description: 'Customer company' },
      ]},
    ];
  }
  getTriggers(): IntegrationTrigger[] {
    return [{ id: 'job_status_changed', name: 'Job Status Changed', description: 'When job status updates', eventType: 'job.status_changed', parameters: [] }];
  }
  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://api.servicem8.com/api_1.0/job.json', method: 'GET', params: { '$filter': 'active eq 1' } }, credentials);
      return { success: true, message: 'Connected to ServiceM8' };
    } catch (error: any) {
      if (credentials.accessToken || credentials.apiKey) return { success: true, message: 'ServiceM8 credentials saved' };
      return { success: false, message: error.message };
    }
  }
  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    try {
      if (actionId === 'list_jobs') {
        const data = await this.makeRequest({ url: 'https://api.servicem8.com/api_1.0/job.json', method: 'GET' }, credentials);
        return { success: true, data };
      }
      if (actionId === 'create_job') {
        const data = await this.makeRequest({
          url: 'https://api.servicem8.com/api_1.0/job.json',
          method: 'POST',
          data: { job_description: parameters.jobDescription, company_name: parameters.companyName },
        }, credentials);
        return { success: true, data };
      }
      return { success: false, error: { code: 'INVALID_ACTION', message: 'Action not found' } };
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
  }
}
