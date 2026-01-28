import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "../shared/schema.js";

console.log("DATABASE_URL from env:", process.env.DATABASE_URL ? "[PRESENT]" : "[MISSING]");
console.log("Current working directory:", process.cwd());
console.log(".env file path:", path.join(process.cwd(), '.env'));

// Defer DATABASE_URL check to allow server to start even if DB is not configured
// This enables health checks and graceful degradation
const databaseUrl = process.env.DATABASE_URL || '';

if (!databaseUrl) {
  console.warn("⚠️ DATABASE_URL is not set. Database operations will fail.");
  console.warn("⚠️ The server will start for health checks but most features will be unavailable.");
}

// Configure neon for HTTP-only connections (no WebSocket)
neonConfig.fetchConnectionCache = true;

// Use HTTP adapter instead of WebSocket for better compatibility with shared hosting providers
// Note: If DATABASE_URL is empty, use a placeholder to prevent neon() from throwing
// The connection will fail when actually used, but allows the server to start
const sql = neon(databaseUrl || 'postgresql://placeholder:placeholder@localhost:5432/placeholder');
export const db = drizzle(sql, { schema });

// Create a simple pool interface for backward compatibility
export const pool = {
  query: sql,
  connect: () => ({ query: sql, release: () => {} }),
  end: () => Promise.resolve()
};