import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";

// Use EXTERNAL_DATABASE_URL if set (user's own DB), otherwise fall back to Replit DATABASE_URL
const DB_URL = process.env.EXTERNAL_DATABASE_URL || process.env.DATABASE_URL;

if (!DB_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: DB_URL,
  ssl: DB_URL?.includes('sslmode=disable') ? false : undefined,
});

export const db = drizzle(pool, { schema });
