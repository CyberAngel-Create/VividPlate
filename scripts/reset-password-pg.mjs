/**
 * reset-password-pg.mjs
 * Uses the standard pg TCP driver (not neon serverless HTTP) so it works from local network.
 * Usage: node scripts/reset-password-pg.mjs <username> <newPassword>
 */
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;
const [,, username, newPassword] = process.argv;

if (!username || !newPassword) {
  console.error('Usage: node scripts/reset-password-pg.mjs <username> <newPassword>');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetPassword() {
  console.log(`\n🔑 Resetting password for user: "${username}"`);
  await client.connect();

  const { rows } = await client.query(
    `SELECT id, username, email FROM users WHERE LOWER(username) = LOWER($1)`,
    [username]
  );

  if (rows.length === 0) {
    console.error(`❌ User "${username}" not found in database.`);
    await client.end();
    process.exit(1);
  }

  const user = rows[0];
  console.log(`✅ Found user: ID=${user.id}, username=${user.username}, email=${user.email}`);

  const hash = await bcrypt.hash(newPassword, 10);
  await client.query(`UPDATE users SET password = $1 WHERE id = $2`, [hash, user.id]);
  
  await client.end();
  console.log(`✅ Password updated successfully!`);
  console.log(`\n📋 Login credentials:`);
  console.log(`   Username: ${user.username}`);
  console.log(`   Password: ${newPassword}`);
}

resetPassword().catch(async err => {
  console.error('❌ Failed:', err.message);
  await client.end().catch(() => {});
  process.exit(1);
});
