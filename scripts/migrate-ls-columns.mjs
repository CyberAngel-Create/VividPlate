/**
 * Direct SQL migration script to add LemonSqueezy columns to the users table.
 * Safe to run multiple times — uses IF NOT EXISTS.
 */

import { config } from 'dotenv';
config();

import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  await client.connect();
  console.log('Connected to database');

  const migrations = [
    // Add ls_customer_id if missing
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS ls_customer_id TEXT;`,
    // Add ls_subscription_id if missing
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS ls_subscription_id TEXT;`,
    // Ensure subscription_expiry exists
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMP;`,
    // Ensure role column exists with correct default
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';`,
  ];

  for (const sql of migrations) {
    try {
      await client.query(sql);
      console.log(`✅ ${sql.slice(0, 60)}...`);
    } catch (err) {
      console.warn(`⚠️  Skipped (may already exist): ${err.message}`);
    }
  }

  await client.end();
  console.log('Migration complete');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
