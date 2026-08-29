import '../env';
import postgres from 'postgres';

// For IPv6 support, ensure your DATABASE_URL uses the bracketed IPv6 host form:
//   postgres://user:pass@[2001:db8::1]:5432/dbname
// The postgres driver will use the host as provided. No extra option is required.
const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  // Keep startup non-fatal here; consumers should handle missing DB gracefully.
  console.warn('postgres: DATABASE_URL not set; postgres client will be uninitialized.');
}

const needsSsl =
  process.env.DB_SSL === 'true' ||
  connectionString.includes('supabase.co') ||
  connectionString.includes('sslmode=require');

const sql = postgres(connectionString, {
  max: 10,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});

export default sql;

