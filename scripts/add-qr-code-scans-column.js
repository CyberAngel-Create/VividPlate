const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

async function addQRCodeScansColumn() {
  console.log('Starting migration: Adding qr_code_scans column to restaurants table');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Check if the column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'restaurants' 
      AND column_name = 'qr_code_scans'
    `;
    
    const { rows } = await pool.query(checkColumnQuery);
    
    if (rows.length === 0) {
      // Column doesn't exist, so create it
      console.log('qr_code_scans column does not exist. Adding it now...');
      
      const alterTableQuery = `
        ALTER TABLE restaurants 
        ADD COLUMN qr_code_scans INTEGER DEFAULT 0
      `;
      
      await pool.query(alterTableQuery);
      console.log('Successfully added qr_code_scans column to restaurants table');
    } else {
      console.log('qr_code_scans column already exists');
    }
    
  } catch (error) {
    console.error('Error adding qr_code_scans column:', error);
  } finally {
    await pool.end();
    console.log('Migration completed');
  }
}

// Run the migration
addQRCodeScansColumn();