import path from 'path';
import fs from 'fs';

export type DatabaseUrlInfo = {
  host: string;
  port: string;
  user: string;
  database: string;
  isSupabasePooler: boolean;
  isSupabaseDirect: boolean;
  hasSslMode: boolean;
};

function parseDbUrl(url: string): DatabaseUrlInfo | null {
  try {
    const normalized = url.replace(/^postgresql:/, 'http:').replace(/^postgres:/, 'http:');
    const u = new URL(normalized);
    return {
      host: u.hostname,
      port: u.port || '5432',
      user: decodeURIComponent(u.username),
      database: u.pathname.replace(/^\//, '') || 'postgres',
      isSupabasePooler: u.hostname.includes('.pooler.supabase.com'),
      isSupabaseDirect: u.hostname.startsWith('db.') && u.hostname.endsWith('.supabase.co'),
      hasSslMode: u.search.includes('sslmode='),
    };
  } catch {
    return null;
  }
}

export function buildSupabasePoolerUrl(opts: {
  projectRef: string;
  password: string;
  poolerHost: string;
  port?: string;
  database?: string;
}): string {
  const user = `postgres.${opts.projectRef}`;
  const pass = encodeURIComponent(opts.password);
  const port = opts.port || '5432';
  const db = opts.database || 'postgres';
  return `postgresql://${user}:${pass}@${opts.poolerHost}:${port}/${db}?sslmode=require`;
}

export function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim();
  }

  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const projectRef = process.env.SUPABASE_PROJECT_REF?.trim();
  const poolerHost = process.env.SUPABASE_POOLER_HOST?.trim();

  if (password && projectRef && poolerHost) {
    return buildSupabasePoolerUrl({ projectRef, password, poolerHost });
  }

  return '';
}

export function applyDatabaseUrlToEnv(): void {
  const resolved = resolveDatabaseUrl();
  if (resolved) {
    process.env.DATABASE_URL = resolved;
  }
}

export function getDatabaseUrlInfo(): DatabaseUrlInfo | null {
  const url = process.env.DATABASE_URL || '';
  if (!url) return null;
  return parseDbUrl(url);
}

export function getDatabaseConnectionHints(): string[] {
  const info = getDatabaseUrlInfo();
  const hints: string[] = [];

  if (!process.env.DATABASE_URL) {
    hints.push('Set DATABASE_URL or SUPABASE_DB_PASSWORD + SUPABASE_PROJECT_REF + SUPABASE_POOLER_HOST in backend/.env');
    return hints;
  }

  if (!info) {
    hints.push('DATABASE_URL is malformed. Wrap the full URL in double quotes if the password has # or @ characters.');
    return hints;
  }

  if (info.isSupabaseDirect) {
    hints.push('Direct db.*.supabase.co is IPv6-only. Use Session pooler host (*.pooler.supabase.com) instead.');
  }

  if ((info.isSupabasePooler || info.isSupabaseDirect) && !info.hasSslMode) {
    hints.push('Add ?sslmode=require to your Supabase DATABASE_URL.');
  }

  if (info.isSupabasePooler && info.user === 'postgres') {
    hints.push('Pooler username should be postgres.[project-ref], not just postgres.');
  }

  return hints;
}

export function formatDatabaseStartupError(error: unknown): string[] {
  const msg = error instanceof Error ? error.message : String(error);
  const lines: string[] = [msg];

  if (/authentication failed|password authentication failed|credentials.*not valid/i.test(msg)) {
    lines.push('Supabase rejected the database password.');
    lines.push('Use the Database password from Supabase Dashboard → Project Settings → Database (not anon/service API keys).');
    lines.push('If the password has special characters (#, @, /, :), either URL-encode it or set SUPABASE_DB_PASSWORD instead of embedding it in DATABASE_URL.');
  }

  if (/can't reach database server|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(msg)) {
    lines.push('Network could not reach the database host. Prefer Session pooler URI over direct db.* host.');
  }

  lines.push(...getDatabaseConnectionHints());
  return lines;
}

export function loadedEnvFiles(): string[] {
  const backendDir = path.resolve(__dirname, '../..');
  const rootDir = path.resolve(backendDir, '..');
  const candidates = [
    path.join(rootDir, '.env'),
    path.join(backendDir, '.env'),
  ];
  return candidates.filter((p) => fs.existsSync(p));
}
