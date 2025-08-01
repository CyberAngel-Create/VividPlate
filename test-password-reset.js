#!/usr/bin/env node

/**
 * Test script to verify password reset functionality
 * Simulates the complete password reset flow for registered users
 */

import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Configure environment and WebSocket
dotenv.config();
neonConfig.webSocketConstructor = ws;

// Database connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL
});

// Generate a secure random password (same logic as bot)
function generateNewPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return password;
}

async function testPasswordReset() {
  console.log('🔐 Testing Password Reset Functionality\n');
  
  try {
    // Get the Michael Legesse user who was verified
    const getUserQuery = `
      SELECT id, email, full_name, phone, password
      FROM users 
      WHERE email = 'michaellegesse32@gmail.com'
      LIMIT 1
    `;
    
    const userResult = await pool.query(getUserQuery);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Test user not found in database');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('👤 Test User Found:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Name: ${user.full_name}`);
    console.log(`   - Phone: ${user.phone}`);
    console.log(`   - Current password hash: ${user.password.substring(0, 20)}...`);
    
    // Store original password hash for comparison
    const originalPasswordHash = user.password;
    
    // Generate new password and hash it
    const newPassword = generateNewPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log(`\n🔑 Generated new password: ${newPassword}`);
    console.log(`🔒 New password hash: ${hashedPassword.substring(0, 20)}...`);
    
    // Update password in database (simulate bot reset)
    const updateQuery = `
      UPDATE users 
      SET password = $1, 
          reset_password_token = NULL, 
          reset_password_expires = NULL 
      WHERE id = $2
    `;
    
    await pool.query(updateQuery, [hashedPassword, user.id]);
    console.log('✅ Password updated in database');
    
    // Verify the update worked
    const verifyQuery = `
      SELECT password
      FROM users 
      WHERE id = $1
    `;
    
    const verifyResult = await pool.query(verifyQuery, [user.id]);
    const updatedPasswordHash = verifyResult.rows[0].password;
    
    console.log('\n🔍 Verification Results:');
    console.log(`   - Password changed: ${originalPasswordHash !== updatedPasswordHash ? '✅ YES' : '❌ NO'}`);
    console.log(`   - New hash matches: ${updatedPasswordHash === hashedPassword ? '✅ YES' : '❌ NO'}`);
    
    // Test password verification
    const passwordMatch = await bcrypt.compare(newPassword, updatedPasswordHash);
    console.log(`   - Password verification: ${passwordMatch ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test with wrong password
    const wrongPasswordMatch = await bcrypt.compare('wrongpassword', updatedPasswordHash);
    console.log(`   - Wrong password rejected: ${!wrongPasswordMatch ? '✅ PASS' : '❌ FAIL'}`);
    
    if (passwordMatch && !wrongPasswordMatch && originalPasswordHash !== updatedPasswordHash) {
      console.log('\n🎉 Password Reset Test: SUCCESSFUL');
      console.log('   - New password generated correctly');
      console.log('   - Database updated successfully');
      console.log('   - Password verification works');
      console.log('   - Security validation passed');
    } else {
      console.log('\n❌ Password Reset Test: FAILED');
    }
    
    // Restore original password for testing purposes
    console.log('\n🔄 Restoring original password for continued testing...');
    await pool.query(updateQuery, [originalPasswordHash, user.id]);
    console.log('✅ Original password restored');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

async function runPasswordResetTest() {
  console.log('🚀 VividPlate Telegram Bot Password Reset Test\n');
  
  // Test database connection
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }

  await testPasswordReset();
  
  console.log('\n✅ Password reset test completed');
  process.exit(0);
}

// Run test
runPasswordResetTest().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});