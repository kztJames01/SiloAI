import '../env';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

if (!process.env.DATABASE_URL) {
  logger.error('❌ DATABASE_URL environment variable is not set!');
  logger.error('Please set DATABASE_URL in your .env file');
}

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });

  // Handle connection errors
  client.$on('error' as never, (e: any) => {
    logger.error('Prisma Client Error:', e);
  });

  return client;
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    logger.debug(`Query: ${e.query}`);
  });
}

export default prisma;
