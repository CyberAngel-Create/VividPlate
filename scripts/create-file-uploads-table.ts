#!/usr/bin/env tsx

// Script to create the file_uploads table in the database
// Run this script as a one-time operation to add the new table

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure neon for WebSocket connections
neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createFileUploadsTable() {
  const client = await pool.connect();
  
  try {
    console.log('Creating file_uploads table...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Check if table already exists
    const checkTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'file_uploads'
      );
    `);
    
    const tableExists = checkTableResult.rows[0].exists;
    
    if (tableExists) {
      console.log('file_uploads table already exists, skipping creation.');
    } else {
      // Create the table
      await client.query(`
        CREATE TABLE file_uploads (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          restaurant_id INTEGER,
          original_filename TEXT NOT NULL,
          stored_filename TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_url TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          file_category TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          metadata JSONB DEFAULT '{}'
        );
      `);
      
      console.log('file_uploads table created successfully.');
      
      // Create indexes
      await client.query(`CREATE INDEX idx_file_uploads_user_id ON file_uploads(user_id);`);
      await client.query(`CREATE INDEX idx_file_uploads_restaurant_id ON file_uploads(restaurant_id);`);
      await client.query(`CREATE INDEX idx_file_uploads_file_category ON file_uploads(file_category);`);
      
      console.log('Added indexes to file_uploads table.');
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('File uploads table migration completed successfully!');
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error creating file_uploads table:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
createFileUploadsTable();