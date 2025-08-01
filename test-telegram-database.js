#!/usr/bin/env node

/**
 * Test script to verify Telegram bot database integration
 * Tests phone number lookup and verification against VividPlate database
 */

import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure environment and WebSocket
dotenv.config();
neonConfig.webSocketConstructor = ws;

// Phone number variations generator (same as in telegram bot)
function generatePhoneVariations(phoneNumber) {
  if (!phoneNumber) return [];
  
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const variations = new Set();
  
  variations.add(cleanPhone);
  variations.add(`+${cleanPhone}`);
  
  if (cleanPhone.startsWith('251') && cleanPhone.length > 3) {
    const withoutCountryCode = cleanPhone.substring(3);
    variations.add(withoutCountryCode);
    variations.add(`0${withoutCountryCode}`);
  }
  
  if (cleanPhone.startsWith('0') && cleanPhone.length > 1) {
    const withoutLeadingZero = cleanPhone.substring(1);
    variations.add(withoutLeadingZero);
    variations.add(`251${withoutLeadingZero}`);
    variations.add(`+251${withoutLeadingZero}`);
  }
  
  if (!cleanPhone.startsWith('251') && !cleanPhone.startsWith('0')) {
    variations.add(`251${cleanPhone}`);
    variations.add(`+251${cleanPhone}`);
    variations.add(`0${cleanPhone}`);
  }
  
  return Array.from(variations);
}

// Database connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL
});

async function testPhoneNumberLookup(phoneNumber) {
  try {
    console.log(`\n🔍 Testing phone number: ${phoneNumber}`);
    
    const phoneVariations = generatePhoneVariations(phoneNumber);
    console.log(`📱 Generated variations:`, phoneVariations);

    const query = `
      SELECT id, email, full_name, phone, created_at
      FROM users 
      WHERE phone = ANY($1)
      LIMIT 1
    `;
    
    const result = await pool.query(query, [phoneVariations]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`✅ User found in database:`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Name: ${user.full_name || 'No name set'}`);
      console.log(`   - Phone: ${user.phone}`);
      console.log(`   - Created: ${new Date(user.created_at).toLocaleDateString()}`);
      return user;
    } else {
      console.log(`❌ Phone number not found in database`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Database query error:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 VividPlate Telegram Bot Database Integration Test\n');
  
  // Test database connection
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }

  // Test known phone numbers
  const testPhones = [
    '+251977816299',      // Entoto Cloud user
    '251977816299',       // Same without +
    '0977816299',         // Ethiopian local format
    '977816299',          // Without country code or 0
    '+1234567890',        // Non-existent number
    '251999999999'        // Another non-existent Ethiopian number
  ];

  for (const phone of testPhones) {
    await testPhoneNumberLookup(phone);
  }

  // Test all users in database
  try {
    console.log('\n📊 All registered users in database:');
    const allUsersQuery = 'SELECT id, email, phone, full_name FROM users ORDER BY created_at';
    const allUsers = await pool.query(allUsersQuery);
    
    if (allUsers.rows.length > 0) {
      allUsers.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} | ${user.phone} | ${user.full_name || 'No name'}`);
      });
    } else {
      console.log('No users found in database');
    }
  } catch (error) {
    console.error('❌ Error fetching all users:', error.message);
  }

  console.log('\n✅ Database integration test completed');
  process.exit(0);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});