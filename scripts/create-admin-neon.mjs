import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const [,, username, password, email] = process.argv;

if (!username || !password || !email) {
  console.error('Usage: node scripts/create-admin-neon.mjs <username> <password> <email>');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function createAdmin() {
  console.log(`\n🔑 Creating admin user: "${username}"`);

  const existingRows = await sql`SELECT id FROM users WHERE LOWER(username) = LOWER(${username}) OR LOWER(email) = LOWER(${email})`;

  if (existingRows.length > 0) {
    console.error(`❌ User with username "${username}" or email "${email}" already exists.`);
    
    // Just reset password instead
    const user = existingRows[0];
    const hash = await bcrypt.hash(password, 10);
    await sql`UPDATE users SET password = ${hash}, role = 'admin', "isAdmin" = true, "subscriptionTier" = 'admin' WHERE id = ${user.id}`;
    console.log(`✅ User updated to admin and password reset.`);
    
  } else {
    const hash = await bcrypt.hash(password, 10);
    await sql`INSERT INTO users (username, password, email, "fullName", role, "isAdmin", "subscriptionTier", "isActive") 
         VALUES (${username}, ${hash}, ${email}, 'System Administrator', 'admin', true, 'admin', true)`;
    console.log(`✅ Admin user created successfully!`);
  }

  console.log(`\n📋 Login credentials:`);
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${password}`);
}

createAdmin().catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
