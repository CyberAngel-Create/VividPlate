import { createRequire } from 'module';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// For dotenv, use a dynamic import
const require = createRequire(import.meta.url);
require('dotenv').config();

// Connect to database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createRegistrationAnalyticsTable() {
  console.log('Creating registration_analytics table...');
  
  try {
    // Check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'registration_analytics'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('Table registration_analytics already exists.');
      return;
    }
    
    // Create the table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "registration_analytics" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "source" TEXT,
        "registered_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "utm_source" TEXT,
        "utm_medium" TEXT,
        "utm_campaign" TEXT,
        "referral_code" TEXT,
        "device" TEXT,
        "browser" TEXT,
        "country" TEXT,
        CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    
    console.log('Successfully created registration_analytics table.');
  } catch (error) {
    console.error('Error creating registration_analytics table:', error);
    throw error;
  } finally {
    // Close connection
    pool.end();
  }
}

createRegistrationAnalyticsTable().catch(console.error);