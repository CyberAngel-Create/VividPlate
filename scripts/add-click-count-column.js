
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addClickCountColumn() {
  console.log('Starting migration: Adding click_count column to menu_items table');
  
  try {
    await pool.query(`
      ALTER TABLE menu_items 
      ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0
    `);
    console.log('Successfully added click_count column');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

addClickCountColumn();
