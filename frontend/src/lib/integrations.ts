/**
 * Central App Integrations Registry
 * Single source of truth for all integration metadata used across the frontend.
 */

export interface AppIntegration {
  provider: string;
  name: string;
  description: string;
  category: string;
  authType: string;
  color: string;
  icon: string;      // Emoji icon for quick renders
  logo?: string;     // External logo URL (optional)
  docUrl?: string;
  enabled: boolean;
  comingSoon?: boolean;
  popular?: boolean;
  suite?: 'google' | 'microsoft';
  tags: string[];
}

// All App Integrations
export const APP_INTEGRATIONS: AppIntegration[] = [
  // ── Google Suite ──
  {
    provider: 'gmail',
    name: 'Gmail',
    description: 'Send, receive, and manage emails',
    category: 'communication',
    authType: 'oauth2',
    color: '#EA4335',
    icon: '📧',
    logo: 'https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_48dp.png',
    enabled: true,
    popular: true,
    suite: 'google',
    tags: ['Email', 'Google'],
  },
  {
    provider: 'google_sheets',
    name: 'Google Sheets',
    description: 'Read and write spreadsheet data',
    category: 'productivity',
    authType: 'oauth2',
    color: '#34A853',
    icon: '📊',
    logo: 'https://www.gstatic.com/images/branding/product/1x/sheets_2020q4_48dp.png',
    enabled: true,
    popular: true,
    suite: 'google',
    tags: ['Spreadsheet', 'Google'],
  },
  {
    provider: 'google_drive',
    name: 'Google Drive',
    description: 'Cloud file storage and sharing',
    category: 'storage',
    authType: 'oauth2',
    color: '#4285F4',
    icon: '📁',
    enabled: true,
    suite: 'google',
    tags: ['Storage', 'Google'],
  },
  {
    provider: 'google_calendar',
    name: 'Google Calendar',
    description: 'Schedule and manage events',
    category: 'productivity',
    authType: 'oauth2',
    color: '#4285F4',
    icon: '📅',
    enabled: true,
    suite: 'google',
    tags: ['Calendar', 'Google'],
  },
  {
    provider: 'google_docs',
    name: 'Google Docs',
    description: 'Create and edit documents',
    category: 'productivity',
    authType: 'oauth2',
    color: '#4285F4',
    icon: '📝',
    enabled: true,
    suite: 'google',
    tags: ['Documents', 'Google'],
  },
  {
    provider: 'youtube',
    name: 'YouTube',
    description: 'Video management and analytics',
    category: 'video',
    authType: 'oauth2',
    color: '#FF0000',
    icon: '🎬',
    enabled: true,
    suite: 'google',
    tags: ['Video', 'Google', 'Social'],
  },

  // ── Microsoft Suite ──
  {
    provider: 'microsoft_outlook',
    name: 'Microsoft Outlook',
    description: 'Email and calendar management',
    category: 'communication',
    authType: 'oauth2',
    color: '#0078D4',
    icon: '📬',
    enabled: true,
    suite: 'microsoft',
    tags: ['Email', 'Microsoft'],
  },
  {
    provider: 'microsoft_teams',
    name: 'Microsoft Teams',
    description: 'Team collaboration and messaging',
    category: 'communication',
    authType: 'oauth2',
    color: '#6264A7',
    icon: '👥',
    enabled: true,
    suite: 'microsoft',
    tags: ['Chat', 'Microsoft'],
  },
  {
    provider: 'microsoft_excel',
    name: 'Microsoft Excel',
    description: 'Spreadsheet management and analysis',
    category: 'productivity',
    authType: 'oauth2',
    color: '#217346',
    icon: '📈',
    enabled: true,
    suite: 'microsoft',
    tags: ['Spreadsheet', 'Microsoft'],
  },
  {
    provider: 'microsoft_onedrive',
    name: 'Microsoft OneDrive',
    description: 'Cloud file storage and sync',
    category: 'storage',
    authType: 'oauth2',
    color: '#0078D4',
    icon: '☁️',
    enabled: true,
    suite: 'microsoft',
    tags: ['Storage', 'Microsoft'],
  },

  // ── Communication ──
  {
    provider: 'slack',
    name: 'Slack',
    description: 'Team messaging and notifications',
    category: 'communication',
    authType: 'oauth2',
    color: '#4A154B',
    icon: '💬',
    enabled: true,
    popular: true,
    tags: ['Chat', 'Notifications'],
  },
  {
    provider: 'discord',
    name: 'Discord',
    description: 'Community messaging and bots',
    category: 'communication',
    authType: 'oauth2',
    color: '#5865F2',
    icon: '🎮',
    enabled: true,
    tags: ['Chat', 'Community'],
  },
  {
    provider: 'twilio',
    name: 'Twilio',
    description: 'SMS, voice, and messaging APIs',
    category: 'communication',
    authType: 'basic_auth',
    color: '#F22F46',
    icon: '📱',
    enabled: true,
    tags: ['SMS', 'Voice', 'API'],
  },
  {
    provider: 'zoom',
    name: 'Zoom',
    description: 'Video conferencing and webinars',
    category: 'communication',
    authType: 'oauth2',
    color: '#2D8CFF',
    icon: '🎥',
    enabled: true,
    tags: ['Video', 'Meetings'],
  },
  {
    provider: 'sendgrid',
    name: 'SendGrid',
    description: 'Transactional and marketing email',
    category: 'communication',
    authType: 'api_key',
    color: '#1A82E2',
    icon: '✉️',
    enabled: true,
    tags: ['Email', 'Marketing'],
  },

  // ── Productivity & Project Management ──
  {
    provider: 'notion',
    name: 'Notion',
    description: 'All-in-one workspace for notes, docs, and databases',
    category: 'productivity',
    authType: 'oauth2',
    color: '#000000',
    icon: '📓',
    enabled: true,
    popular: true,
    tags: ['Notes', 'Database', 'Wiki'],
  },
  {
    provider: 'trello',
    name: 'Trello',
    description: 'Visual boards for project management',
    category: 'productivity',
    authType: 'api_key',
    color: '#0052CC',
    icon: '📋',
    enabled: true,
    tags: ['Boards', 'Tasks'],
  },
  {
    provider: 'clickup',
    name: 'ClickUp',
    description: 'Project management and task tracking',
    category: 'productivity',
    authType: 'oauth2',
    color: '#7B68EE',
    icon: '✅',
    enabled: true,
    tags: ['Tasks', 'Projects'],
  },
  {
    provider: 'airtable',
    name: 'Airtable',
    description: 'Spreadsheet-database hybrid for structured data',
    category: 'productivity',
    authType: 'api_key',
    color: '#FCB400',
    icon: '🗃️',
    enabled: true,
    popular: true,
    tags: ['Database', 'Spreadsheet'],
  },

  // ── Marketing ──
  {
    provider: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing campaigns and automation',
    category: 'marketing',
    authType: 'api_key',
    color: '#FFE01B',
    icon: '🐒',
    enabled: true,
    tags: ['Email', 'Campaigns'],
  },
  {
    provider: 'hubspot',
    name: 'HubSpot',
    description: 'CRM, marketing, and sales automation',
    category: 'marketing',
    authType: 'oauth2',
    color: '#FF7A59',
    icon: '🧡',
    enabled: true,
    popular: true,
    tags: ['CRM', 'Marketing', 'Sales'],
  },
  {
    provider: 'facebook_ads',
    name: 'Facebook Ads',
    description: 'Advertising on Facebook and Instagram',
    category: 'marketing',
    authType: 'oauth2',
    color: '#1877F2',
    icon: '📣',
    enabled: true,
    tags: ['Ads', 'Social Media'],
  },
  {
    provider: 'typeform',
    name: 'Typeform',
    description: 'Interactive forms and surveys',
    category: 'forms',
    authType: 'oauth2',
    color: '#262627',
    icon: '📝',
    enabled: true,
    tags: ['Forms', 'Surveys'],
  },

  // ── Payments ──
  {
    provider: 'stripe',
    name: 'Stripe',
    description: 'Payment processing and subscriptions',
    category: 'payments',
    authType: 'api_key',
    color: '#635BFF',
    icon: '💳',
    enabled: true,
    popular: true,
    tags: ['Payments', 'Billing'],
  },

  // ── AI ──
  {
    provider: 'openai',
    name: 'OpenAI',
    description: 'GPT models for text generation and analysis',
    category: 'ai',
    authType: 'bearer_token',
    color: '#412991',
    icon: '🧠',
    enabled: true,
    popular: true,
    tags: ['AI', 'GPT', 'LLM'],
  },
  {
    provider: 'chatgpt',
    name: 'ChatGPT',
    description: 'Conversational AI assistant',
    category: 'ai',
    authType: 'bearer_token',
    color: '#10A37F',
    icon: '🤖',
    enabled: true,
    tags: ['AI', 'Chat', 'Assistant'],
  },

  // ── Development ──
  {
    provider: 'github',
    name: 'GitHub',
    description: 'Source code, issues, and pull requests',
    category: 'development',
    authType: 'oauth2',
    color: '#181717',
    icon: '🐙',
    enabled: true,
    popular: true,
    tags: ['Code', 'Git', 'Issues'],
  },

  // ── Storage ──
  {
    provider: 'dropbox',
    name: 'Dropbox',
    description: 'File storage, sharing, and sync',
    category: 'storage',
    authType: 'oauth2',
    color: '#0061FF',
    icon: '📦',
    enabled: true,
    tags: ['Storage', 'Files'],
  },

  // ── Custom ──
  {
    provider: 'webhook',
    name: 'Webhook',
    description: 'Send HTTP requests to any endpoint',
    category: 'custom',
    authType: 'none',
    color: '#6366F1',
    icon: '🔗',
    enabled: true,
    tags: ['HTTP', 'API', 'Custom'],
  },
];

// ─── Helper lookups ──────────────────────────────────────────────────────────

export const INTEGRATION_BY_PROVIDER = new Map(
  APP_INTEGRATIONS.map((app) => [app.provider, app])
);

export const POPULAR_INTEGRATIONS = APP_INTEGRATIONS.filter((a) => a.popular);

export const INTEGRATION_CATEGORIES = [
  { id: 'all', label: 'All Apps', icon: '🏠' },
  { id: 'communication', label: 'Communication', icon: '💬' },
  { id: 'productivity', label: 'Productivity', icon: '⚡' },
  { id: 'marketing', label: 'Marketing', icon: '📣' },
  { id: 'storage', label: 'Storage', icon: '🗂️' },
  { id: 'payments', label: 'Payments', icon: '💳' },
  { id: 'ai', label: 'AI', icon: '🤖' },
  { id: 'development', label: 'Development', icon: '🛠️' },
  { id: 'video', label: 'Video', icon: '🎬' },
  { id: 'forms', label: 'Forms', icon: '📝' },
  { id: 'custom', label: 'Custom', icon: '🔧' },
] as const;

/** Provider color map for quick lookup */
export const PROVIDER_COLORS: Record<string, string> = Object.fromEntries(
  APP_INTEGRATIONS.map((a) => [a.provider, a.color])
);

/** Get integration by provider key */
export function getIntegration(provider: string): AppIntegration | undefined {
  return INTEGRATION_BY_PROVIDER.get(provider);
}

/** Get integrations filtered by category and search */
export function filterIntegrations(
  category: string,
  search: string,
  integrations = APP_INTEGRATIONS
): AppIntegration[] {
  const q = search.toLowerCase();
  return integrations.filter((app) => {
    const matchCategory = category === 'all' || app.category === category;
    const matchSearch =
      !q ||
      app.name.toLowerCase().includes(q) ||
      app.description.toLowerCase().includes(q) ||
      app.tags.some((t) => t.toLowerCase().includes(q));
    return matchCategory && matchSearch;
  });
}

/** Group integrations by suite for display */
export function getGoogleSuiteApps(): AppIntegration[] {
  return APP_INTEGRATIONS.filter((a) => a.suite === 'google');
}

export function getMicrosoftSuiteApps(): AppIntegration[] {
  return APP_INTEGRATIONS.filter((a) => a.suite === 'microsoft');
}

/** Integrations used in a specific workflow template (for template cards) */
export const TEMPLATE_CONNECTORS: Record<string, string[]> = {
  // Healthcare
  'healthcare-intake': ['gmail', 'slack', 'google_sheets'],
  'appointment-scheduler': ['google_calendar', 'sendgrid', 'twilio'],
  // Field Service
  'field-hazard': ['slack', 'webhook', 'airtable'],
  'inventory-check': ['google_sheets', 'slack', 'airtable'],
  'maintenance-request': ['sendgrid', 'clickup', 'slack'],
  // Invoicing
  'invoice-approval': ['stripe', 'google_sheets', 'slack'],
  'expense-approval': ['google_sheets', 'slack', 'hubspot'],
  // HR
  'onboarding': ['gmail', 'slack', 'google_drive', 'notion'],
  // Students
  'student-research-assistant': ['openai', 'notion', 'google_docs'],
  'student-essay-feedback': ['openai', 'google_docs', 'gmail'],
  'student-study-scheduler': ['openai', 'google_calendar', 'notion'],
  'student-citation-formatter': ['openai', 'google_docs'],
  // SMB
  'smb-lead-capture': ['hubspot', 'mailchimp', 'slack'],
  'smb-customer-support': ['slack', 'openai', 'hubspot'],
  'smb-invoice-reminder': ['stripe', 'sendgrid', 'google_sheets'],
  'smb-review-request': ['sendgrid', 'typeform', 'airtable'],
  // Startups
  'startup-user-feedback': ['typeform', 'slack', 'notion'],
  'startup-onboarding-email': ['mailchimp', 'hubspot', 'openai'],
  'startup-metrics-report': ['google_sheets', 'slack', 'openai'],
  'startup-ab-test': ['slack', 'openai', 'airtable'],
};
