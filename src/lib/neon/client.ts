/**
 * Neon serverless client — server-side only.
 * Uses @neondatabase/serverless with HTTP transport for edge compatibility.
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';

if (!connectionString) {
  console.warn('Missing DATABASE_URL env var. Database features will be disabled.');
}

const sql = connectionString ? neon(connectionString) : null;

export const db = sql ? drizzle(sql, { schema }) : null;
export { sql };
