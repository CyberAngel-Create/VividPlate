/**
 * db-admin.mjs — Direct DB admin tool using pg with the full connection string
 * Lists all users and creates/resets admin user
 */
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const DATABASE_URL = "postgresql://neondb_owner:npg_tWvqo9fuah3U@ep-calm-poetry-abx9kptm-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 10000,
  max: 1
});

async function main() {
  console.log('🔌 Connecting to Neon database...');
  const client = await pool.connect();
  console.log('✅ Connected!\n');

  try {
    // List all users
    const { rows: users } = await client.query(
      `SELECT id, username, email, role, "isAdmin", "subscriptionTier", "isActive", 
       LEFT(password, 10) as pass_preview
       FROM users ORDER BY id`
    );
    console.log(`=== USERS IN DATABASE (${users.length} total) ===`);
    users.forEach(u => console.log(
      `ID:${u.id} | ${u.username} | ${u.email} | role:${u.role} | admin:${u.isAdmin} | tier:${u.subscriptionTier} | active:${u.isActive} | pass:${u.pass_preview}...`
    ));

    // Check if admin user exists
    const { rows: adminRows } = await client.query(
      `SELECT id, username FROM users WHERE LOWER(username) = 'admin' OR "isAdmin" = true`
    );

    if (adminRows.length > 0) {
      // Update existing admin password
      for (const admin of adminRows) {
        const hash = await bcrypt.hash('admin1234', 10);
        await client.query(
          `UPDATE users SET password = $1, "isAdmin" = true, role = 'admin', "subscriptionTier" = 'admin', "isActive" = true WHERE id = $2`,
          [hash, admin.id]
        );
        console.log(`\n✅ Reset password for existing admin user: ${admin.username} (ID: ${admin.id})`);
      }
    } else {
      // Create new admin user
      const hash = await bcrypt.hash('admin1234', 10);
      const { rows: newAdmin } = await client.query(
        `INSERT INTO users (username, password, email, "fullName", role, "isAdmin", "subscriptionTier", "isActive", "createdAt", "updatedAt")
         VALUES ('admin', $1, 'admin@vividplate.com', 'System Administrator', 'admin', true, 'admin', true, NOW(), NOW())
         RETURNING id, username`,
        [hash]
      );
      console.log(`\n✅ Created new admin user: ${newAdmin[0].username} (ID: ${newAdmin[0].id})`);
    }

    // Also verify Agent1 password is correct bcrypt
    const { rows: agent1 } = await client.query(
      `SELECT id, username, LEFT(password, 7) as pass_start FROM users WHERE LOWER(username) = 'agent1'`
    );
    if (agent1.length > 0) {
      const isbcrypt = agent1[0].pass_start.startsWith('$2');
      if (!isbcrypt) {
        const hash = await bcrypt.hash('agent1234', 10);
        await client.query(`UPDATE users SET password = $1 WHERE id = $2`, [hash, agent1[0].id]);
        console.log(`✅ Fixed Agent1 password to bcrypt`);
      } else {
        console.log(`✅ Agent1 password is already bcrypt format`);
      }
    }

    console.log('\n📋 ADMIN LOGIN CREDENTIALS:');
    console.log('   Username: admin');
    console.log('   Password: admin1234');
    console.log('\n📋 AGENT1 LOGIN CREDENTIALS:');
    console.log('   Username: Agent1');
    console.log('   Password: agent1234');

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
