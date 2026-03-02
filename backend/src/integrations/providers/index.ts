/**
 * Integration Provider Registry
 * Central registry for all integration providers
 */

import { GmailIntegration } from './GmailIntegration';
import { SlackIntegration } from './SlackIntegration';
import { DiscordIntegration } from './Discord';
import {
  GoogleSheetsIntegration,
  NotionIntegration,
  AirtableIntegration,
  GitHubIntegration,
  StripeIntegration,
  TwilioIntegration,
  OpenAIIntegration,
  WebhookIntegration,
  DropboxIntegration,
  TrelloIntegration,
  SendGridIntegration,
  HubSpotIntegration,
  ZoomIntegration,
  GoogleDriveIntegration,
  GoogleCalendarIntegration,
  GoogleDocsIntegration,
  YouTubeIntegration,
  MicrosoftOutlookIntegration,
  MicrosoftTeamsIntegration,
  MicrosoftExcelIntegration,
  MicrosoftOneDriveIntegration,
  ClickUpIntegration,
  MailChimpIntegration,
  FacebookAdsIntegration,
  TypeformIntegration,
  ChatGPTIntegration,
} from './integrations';
import { BaseIntegration } from '../base/BaseIntegration';
import { IntegrationProvider } from '@silo/shared/types/integration';

/**
 * Integration Registry - Singleton pattern
 */
class IntegrationRegistry {
  private integrations: Map<IntegrationProvider, BaseIntegration> = new Map();

  constructor() {
    this.registerAll();
  }

  /**
   * Register all available integrations
   */
  private registerAll(): void {
    this.register(new GmailIntegration());
    this.register(new SlackIntegration());
    this.register(new GoogleSheetsIntegration());
    this.register(new NotionIntegration());
    this.register(new AirtableIntegration());
    this.register(new GitHubIntegration());
    this.register(new StripeIntegration());
    this.register(new TwilioIntegration());
    this.register(new OpenAIIntegration());
    this.register(new WebhookIntegration());
    this.register(new DropboxIntegration());
    this.register(new TrelloIntegration());
    this.register(new SendGridIntegration());
    this.register(new HubSpotIntegration());
    this.register(new ZoomIntegration());
    // Google Suite
    this.register(new GoogleDriveIntegration());
    this.register(new GoogleCalendarIntegration());
    this.register(new GoogleDocsIntegration());
    this.register(new YouTubeIntegration());
    // Microsoft Suite
    this.register(new MicrosoftOutlookIntegration());
    this.register(new MicrosoftTeamsIntegration());
    this.register(new MicrosoftExcelIntegration());
    this.register(new MicrosoftOneDriveIntegration());
    // Communication
    this.register(new DiscordIntegration());
    // Productivity
    this.register(new ClickUpIntegration());
    // Marketing
    this.register(new MailChimpIntegration());
    this.register(new FacebookAdsIntegration());
    this.register(new TypeformIntegration());
    // AI
    this.register(new ChatGPTIntegration());
  }

  /**
   * Register a single integration
   */
  private register(integration: BaseIntegration): void {
    const metadata = integration.getInfo().metadata;
    this.integrations.set(metadata.provider, integration);
  }

  /**
   * Get integration by provider
   */
  get(provider: IntegrationProvider): BaseIntegration | undefined {
    return this.integrations.get(provider);
  }

  /**
   * Get all registered integrations
   */
  getAll(): BaseIntegration[] {
    return Array.from(this.integrations.values());
  }

  /**
   * Get integrations by category
   */
  getByCategory(category: string): BaseIntegration[] {
    return this.getAll().filter((integration) => {
      return integration.getInfo().metadata.category === category;
    });
  }

  /**
   * Get all integration metadata
   */
  getAllMetadata() {
    return this.getAll().map((integration) => integration.getInfo().metadata);
  }

  /**
   * Check if provider is supported
   */
  isSupported(provider: IntegrationProvider): boolean {
    return this.integrations.has(provider);
  }
}

// Export singleton instance
export const integrationRegistry = new IntegrationRegistry();

// Export individual integrations for direct use
export {
  GmailIntegration,
  SlackIntegration,
  GoogleSheetsIntegration,
  NotionIntegration,
  AirtableIntegration,
  GitHubIntegration,
  StripeIntegration,
  TwilioIntegration,
  OpenAIIntegration,
  WebhookIntegration,
  DropboxIntegration,
  TrelloIntegration,
  SendGridIntegration,
  HubSpotIntegration,
  ZoomIntegration,
  GoogleDriveIntegration,
  GoogleCalendarIntegration,
  GoogleDocsIntegration,
  YouTubeIntegration,
  MicrosoftOutlookIntegration,
  MicrosoftTeamsIntegration,
  MicrosoftExcelIntegration,
  MicrosoftOneDriveIntegration,
  DiscordIntegration,
  ClickUpIntegration,
  MailChimpIntegration,
  FacebookAdsIntegration,
  TypeformIntegration,
  ChatGPTIntegration,
};
