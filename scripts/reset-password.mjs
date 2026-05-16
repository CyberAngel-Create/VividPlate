/**
 * reset-password.mjs
 * Usage: node scripts/reset-password.mjs <username> <newPassword>
 * Resets a user's password in the production Neon DB using bcrypt (matching server auth).
 */
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const [,, username, newPassword] = process.argv;

if (!username || !newPassword) {
  console.error('Usage: node scripts/reset-password.mjs <username> <newPassword>');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function resetPassword() {
  console.log(`\n🔑 Resetting password for user: "${username}"`);

  // Check if user exists
  const users = await sql`SELECT id, username, email FROM users WHERE LOWER(username) = LOWER(${username})`;
  if (users.length === 0) {
    console.error(`❌ User "${username}" not found in database.`);
    process.exit(1);
  }

  const user = users[0];
  console.log(`✅ Found user: ID=${user.id}, username=${user.username}, email=${user.email}`);

  // Hash the new password with bcrypt (salt rounds=10, same as registration)
  const hash = await bcrypt.hash(newPassword, 10);
  console.log(`✅ Generated bcrypt hash`);

  // Update in database
  await sql`UPDATE users SET password = ${hash} WHERE id = ${user.id}`;
  console.log(`✅ Password updated successfully in database!`);
  console.log(`\n📋 You can now log in with:`);
  console.log(`   Username: ${user.username}`);
  console.log(`   Password: ${newPassword}`);
}

resetPassword().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
