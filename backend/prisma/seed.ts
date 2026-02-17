import prisma from '../src/db/prisma';
import { logger } from '../src/utils/logger';
import { AuthType } from '@prisma/client';

async function main() {
  logger.info('Seeding database...');

  // Create integrations
  const integrations = [
    {
      name: 'slack',
      displayName: 'Slack',
      description: 'Team communication platform',
      authType: 'OAUTH2' as AuthType,
      baseUrl: 'https://slack.com/api',
    },
    {
      name: 'gmail',
      displayName: 'Gmail',
      description: 'Email service by Google',
      authType: 'OAUTH2' as AuthType,
      baseUrl: 'https://gmail.googleapis.com',
    },
    {
      name: 'googlesheets',
      displayName: 'Google Sheets',
      description: 'Spreadsheet application',
      authType: 'OAUTH2' as AuthType,
      baseUrl: 'https://sheets.googleapis.com',
    },
    {
      name: 'github',
      displayName: 'GitHub',
      description: 'Developer platform',
      authType: 'OAUTH2' as AuthType,
      baseUrl: 'https://api.github.com',
    },
    {
      name: 'openai',
      displayName: 'OpenAI',
      description: 'AI language models',
      authType: 'API_KEY' as AuthType,
      baseUrl: 'https://api.openai.com/v1',
    },
    {
      name: 'anthropic',
      displayName: 'Anthropic',
      description: 'Claude AI assistant',
      authType: 'API_KEY' as AuthType,
      baseUrl: 'https://api.anthropic.com/v1',
    },
    {
      name: 'webhook',
      displayName: 'Webhook',
      description: 'HTTP webhooks',
      authType: 'NONE' as AuthType,
    },
    {
      name: 'http',
      displayName: 'HTTP Request',
      description: 'Make HTTP requests',
      authType: 'NONE' as AuthType,
    },
  ];

  for (const integration of integrations) {
    await prisma.integration.upsert({
      where: { name: integration.name },
      update: integration,
      create: integration,
    });
  }

  logger.info(`✅ Created ${integrations.length} integrations`);
  logger.info('✅ Database seeding completed');
}

main()
  .catch((e) => {
    logger.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
