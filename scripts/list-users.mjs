import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const rows = await sql`SELECT id, username, email, role, "subscriptionTier", "isActive" FROM users ORDER BY id LIMIT 30`;
console.log('\n=== ALL USERS IN DB ===');
rows.forEach(r => console.log(JSON.stringify(r)));
