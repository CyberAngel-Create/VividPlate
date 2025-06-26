import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure neon for HTTP-only connections (no WebSocket)
neonConfig.fetchConnectionCache = true;

// Use HTTP adapter instead of WebSocket for better Replit compatibility
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Create a simple pool interface for backward compatibility
export const pool = {
  query: sql,
  connect: () => ({ query: sql, release: () => {} }),
  end: () => Promise.resolve()
};