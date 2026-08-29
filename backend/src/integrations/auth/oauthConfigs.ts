import { IntegrationProvider, OAuth2Config } from '@silo/shared/types/integration';

const apiBase = () => process.env.API_URL || 'http://localhost:5000';
const redirect = () => `${apiBase()}/api/integrations/oauth/callback`;

export function getOAuth2Config(provider: IntegrationProvider): OAuth2Config | null {
  const google = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        redirectUri: redirect(),
      }
    : null;

  const slack = process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET
    ? {
        clientId: process.env.SLACK_CLIENT_ID,
        clientSecret: process.env.SLACK_CLIENT_SECRET,
        authorizationUrl: 'https://slack.com/oauth/v2/authorize',
        tokenUrl: 'https://slack.com/api/oauth.v2.access',
        redirectUri: redirect(),
      }
    : null;

  const ms = process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
    ? {
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        redirectUri: redirect(),
      }
    : null;

  const configs: Partial<Record<IntegrationProvider, OAuth2Config>> = {};

  if (google) {
    configs[IntegrationProvider.GMAIL] = { ...google, scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'] };
    configs[IntegrationProvider.GOOGLE_SHEETS] = { ...google, scopes: ['https://www.googleapis.com/auth/spreadsheets'] };
    configs[IntegrationProvider.GOOGLE_CALENDAR] = { ...google, scopes: ['https://www.googleapis.com/auth/calendar'] };
  }
  if (slack) {
    configs[IntegrationProvider.SLACK] = { ...slack, scopes: ['chat:write', 'channels:read'] };
  }
  if (ms) {
    configs[IntegrationProvider.MICROSOFT_OUTLOOK] = { ...ms, scopes: ['https://graph.microsoft.com/Mail.Send', 'offline_access'] };
    configs[IntegrationProvider.MICROSOFT_TEAMS] = { ...ms, scopes: ['https://graph.microsoft.com/Chat.ReadWrite', 'offline_access'] };
  }

  return configs[provider] || null;
}
