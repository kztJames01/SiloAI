import dotenv from 'dotenv';
import path from 'path';
import { applyDatabaseUrlToEnv } from './db/database-url';
import { ensureProductionSecrets } from './utils/security';

const backendDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(backendDir, '..');

// Root first, backend/.env wins (override) so backend secrets are authoritative
const envPaths = [
  path.join(rootDir, '.env'),
  path.join(backendDir, '.env'),
];

for (const p of envPaths) {
  dotenv.config({ path: p, override: true });
}

applyDatabaseUrlToEnv();
ensureProductionSecrets();
