import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;
const [,, username, password, email] = process.argv;

if (!username || !password || !email) {
  console.error('Usage: node scripts/create-admin-pg.mjs <username> <password> <email>');
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

async function createAdmin() {
  console.log(`\n🔑 Creating admin user: "${username}"`);
  await client.connect();

  const { rows: existingRows } = await client.query(
    `SELECT id FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)`,
    [username, email]
  );

  if (existingRows.length > 0) {
    console.error(`❌ User with username "${username}" or email "${email}" already exists.`);
    
    // Just reset password instead
    const user = existingRows[0];
    const hash = await bcrypt.hash(password, 10);
    await client.query(`UPDATE users SET password = $1, role = 'admin', "isAdmin" = true, "subscriptionTier" = 'admin' WHERE id = $2`, [hash, user.id]);
    console.log(`✅ User updated to admin and password reset.`);
    
  } else {
    const hash = await bcrypt.hash(password, 10);
    await client.query(
        `INSERT INTO users (username, password, email, "fullName", role, "isAdmin", "subscriptionTier", "isActive") 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [username, hash, email, 'System Administrator', 'admin', true, 'admin', true]
    );
    console.log(`✅ Admin user created successfully!`);
  }

  await client.end();
  console.log(`\n📋 Login credentials:`);
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${password}`);
}

createAdmin().catch(async err => {
  console.error('❌ Failed:', err.message);
  await client.end().catch(() => {});
  process.exit(1);
});
