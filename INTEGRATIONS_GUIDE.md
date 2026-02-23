# 🔌 App Integrations System - Complete Guide

## Overview

The Silo App Integrations system provides a comprehensive framework for connecting to popular SaaS platforms and services. It includes OAuth2 authentication, encrypted credential storage, rate limiting, error handling, and a beautiful UI for managing connections.

## ✅ Features Implemented

### 1. **Integration Framework**
- ✅ Base integration class with common functionality
- ✅ Integration registry for managing providers
- ✅ Extensible architecture for adding new integrations
- ✅ Type-safe integration definitions

### 2. **Authentication & Security**
- ✅ OAuth2 2.0 flow (authorization code grant)
- ✅ API key management
- ✅ Basic authentication support
- ✅ AES-256-GCM encryption for credentials
- ✅ Secure credential storage in database
- ✅ Token refresh handling
- ✅ CSRF protection for OAuth flows

### 3. **15 Integration Providers**
1. **Gmail** - Send and read emails (OAuth2)
2. **Slack** - Team communication (OAuth2)
3. **Google Sheets** - Spreadsheet operations (OAuth2)
4. **Notion** - Knowledge management (OAuth2)
5. **Airtable** - Database operations (API Key)
6. **GitHub** - Code repository management (OAuth2)
7. **Stripe** - Payment processing (API Key)
8. **Twilio** - SMS and voice calls (Basic Auth)
9. **OpenAI** - AI text generation (Bearer Token)
10. **Webhook** - HTTP requests to any endpoint (None)
11. **Dropbox** - File storage (OAuth2) *
12. **Trello** - Project management (API Key) *
13. **SendGrid** - Email delivery (API Key) *
14. **HubSpot** - CRM and marketing (OAuth2) *
15. **Zoom** - Video conferencing (OAuth2) *

*Coming soon - stubs ready for implementation

### 4. **Rate Limiting & Error Handling**
- ✅ Configurable rate limits per provider
- ✅ Automatic retry with exponential backoff
- ✅ Rate limit detection and waiting
- ✅ Comprehensive error handling
- ✅ Request logging and analytics
- ✅ Token expiration handling

### 5. **Frontend UI**
- ✅ Integration marketplace with search and filters
- ✅ Connection management dashboard
- ✅ OAuth flow handling
- ✅ API key input forms
- ✅ Connection testing
- ✅ Status indicators
- ✅ Connection logs

## 🚀 Setup Instructions

### 1. Environment Variables

Add the following to your `backend/.env` file:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/silo"

# API Configuration
API_URL="http://localhost:3000"
NODE_ENV="development"

# Encryption Key (32+ characters, use strong random string)
INTEGRATION_ENCRYPTION_KEY="your-very-strong-encryption-key-change-me-32-chars-min"

# OAuth2 Provider Credentials

# Google (Gmail, Google Sheets)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Slack
SLACK_CLIENT_ID="your-slack-client-id"  
SLACK_CLIENT_SECRET="your-slack-client-secret"

# GitHub
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Notion
NOTION_CLIENT_ID="your-notion-client-id"
NOTION_CLIENT_SECRET="your-notion-client-secret"

# HubSpot (optional)
HUBSPOT_CLIENT_ID="your-hubspot-client-id"
HUBSPOT_CLIENT_SECRET="your-hubspot-client-secret"

# Zoom (optional)
ZOOM_CLIENT_ID="your-zoom-client-id"
ZOOM_CLIENT_SECRET="your-zoom-client-secret"

# Dropbox (optional)
DROPBOX_CLIENT_ID="your-dropbox-client-id"
DROPBOX_CLIENT_SECRET="your-dropbox-client-secret"
```

### 2. Database Migration

```bash
cd backend
npx prisma migrate dev --name add_integrations
npx prisma generate
```

### 3. Install Dependencies

No additional dependencies needed - the system uses existing packages!

### 4. Start the Servers

```bash
# Backend
cd backend
npm run dev

# Frontend  
cd frontend
npm run dev
```

### 5. Access the Integration Marketplace

Navigate to: `http://localhost:5173/integrations`

## 📚 How to Get OAuth Credentials

### Gmail / Google Sheets

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Gmail API and Google Sheets API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Application type: Web application
6. Authorized redirect URIs: `http://localhost:3000/api/integrations/oauth/callback`
7. Copy Client ID and Client Secret

### Slack

1. Go to [Slack API](https://api.slack.com/apps)
2. Create a new app → From scratch
3. Add OAuth scopes: `chat:write`, `channels:read`, `conversations:history`
4. Add redirect URL: `http://localhost:3000/api/integrations/oauth/callback`
5. Install app to workspace
6. Copy Client ID and Client Secret from "App Credentials"

### GitHub

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. New OAuth App
3. Authorization callback URL: `http://localhost:3000/api/integrations/oauth/callback`
4. Copy Client ID and generate Client Secret

### Notion

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create new integration
3. Set as public integration
4. Add redirect URI: `http://localhost:3000/api/integrations/oauth/callback`
5. Copy OAuth client ID and secret

## 🔧 Using Integrations

### Connect an Integration (Frontend)

1. Go to `/integrations`
2. Find the integration you want
3. Click "Connect"
4. For OAuth: You'll be redirected to provider's auth page
5. For API Key: Enter your key in the modal
6. Connection will be tested automatically

### Execute Actions in Workflows

Add an "HTTP Request" or custom integration node to your workflow:

```typescript
// Example: Send Slack message
{
  "connectionId": "conn-123",
  "action": "send_message",
  "parameters": {
    "channel": "#general",
    "text": "Hello from Silo!"
  }
}
```

### Programmatic Usage (Backend)

```typescript
import { integrationRegistry } from './integrations/providers';
import { credentialManager } from './integrations/auth/CredentialManager';
import { IntegrationProvider } from '@silo/shared/types/integration';

// Get integration
const gmail = integrationRegistry.get(IntegrationProvider.GMAIL);

// Load credentials from database
const connection = await prisma.integrationConnection.findFirst({
  where: { userId, provider: 'gmail' }
});
const credentials = credentialManager.decrypt(connection.credentials);

// Execute action
const result = await gmail.executeAction('send_email', {
  to: 'user@example.com',
  subject: 'Test Email',
  body: 'This is a test email from Silo!'
}, credentials);

console.log(result); // { success: true, data: { messageId: '...' } }
```

## 📝 Adding New Integrations

1. **Create Integration Class**

```typescript
// backend/src/integrations/providers/MyIntegration.ts
import { BaseIntegration } from '../base/BaseIntegration';

export class MyIntegration extends BaseIntegration {
  getMetadata(): IntegrationMetadata {
    return {
      provider: IntegrationProvider.MY_SERVICE,
      name: 'My Service',
      description: 'Connect to My Service',
      category: IntegrationCategory.PRODUCTIVITY,
      authType: AuthType.API_KEY,
      color: '#FF5733',
      enabled: true,
    };
  }

  getActions(): IntegrationAction[] {
    return [
      {
        id: 'do_something',
        name: 'Do Something',
        description: 'Perform an action',
        parameters: [
          { name: 'param1', type: 'string', required: true, description: 'Parameter 1' },
        ],
      },
    ];
  }

  getTriggers(): IntegrationTrigger[] {
    return [];
  }

  async testConnection(credentials: IntegrationCredentials): Promise<IntegrationTestResult> {
    try {
      await this.makeRequest({ url: 'https://api.myservice.com/test', method: 'GET' }, credentials);
      return { success: true, message: 'Connected!' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async executeAction(actionId: string, parameters: Record<string, any>, credentials: IntegrationCredentials): Promise<IntegrationResult> {
    // Implementation
  }
}
```

2. **Register Integration**

Add to `backend/src/integrations/providers/integrations.ts`:

```typescript
export class MyIntegration extends BaseIntegration { ... }
```

And register in `index.ts`:

```typescript
this.register(new MyIntegration());
```

3. **Update Types**

Add to `IntegrationProvider` enum in `shared/src/types/integration.ts`:

```typescript
export enum IntegrationProvider {
  // ... existing
  MY_SERVICE = 'my_service',
}
```

## 🔐 Security Best Practices

1. **Encryption Key**: Use a strong random 32+ character string
2. **Environment Variables**: Never commit credentials to git
3. **OAuth Redirect**: Use HTTPS in production
4. **Rate Limiting**: Configure appropriate limits per provider
5. **Credential Rotation**: Implement regular key rotation
6. **Audit Logs**: Monitor integration usage via IntegrationLog table

## 📊 Database Schema

### Integration
- Stores integration metadata and configuration

### IntegrationConnection
- User's connections with encrypted credentials
- Status tracking and error logging

### IntegrationLog
- Execution logs for auditing and debugging
- Performance metrics and error tracking

### OAuth2Token
- Dedicated storage for OAuth tokens
- Automatic expiration tracking

## 🐛 Troubleshooting

### OAuth Flow Issues

**Problem**: "Invalid redirect URI"
**Solution**: Ensure redirect URI in provider settings matches exactly: `http://localhost:3000/api/integrations/oauth/callback`

**Problem**: "Invalid state parameter"
**Solution**: State expires after 10 minutes. Start OAuth flow again.

### API Key Issues

**Problem**: "Authentication failed"
**Solution**: Verify API key is correct and has required permissions

**Problem**: "Connection test failed"
**Solution**: Check provider's API documentation for correct key format

### Rate Limiting

**Problem**: "Rate limit exceeded"
**Solution**: Integration will automatically wait and retry. Configure `getRateLimitConfig()` if needed.

## 📈 Monitoring

Check integration logs:

```sql
SELECT * FROM integration_logs 
WHERE user_id = 'user-id' 
ORDER BY timestamp DESC 
LIMIT 100;
```

View connection status:

```sql
SELECT 
  ic.name,
  i.provider,
  ic.status,
  ic.last_used,
  ic.error_message
FROM integration_connections ic
JOIN integrations i ON i.id = ic.integration_id
WHERE ic.user_id = 'user-id';
```

## 🎯 Next Steps

1. **Add More Integrations**: Implement the "Coming Soon" providers
2. **Webhook Triggers**: Add support for incoming webhooks
3. **Integration Nodes**: Create dedicated workflow nodes for each integration
4. **Rate Limit Dashboard**: Build UI for monitoring API usage
5. **Connection Sharing**: Allow team-wide integration connections
6. **Integration Templates**: Pre-built workflow templates for common use cases

## 📞 Support

- Check integration logs in UI
- Review error messages in connection status
- Test connections using "Test" button
- Consult provider's API documentation

---

**Built with ❤️ for the Silo workflow automation platform**
