import fs from 'fs';
import path from 'path';
import { Client } from '@neondatabase/serverless';

(async function(){
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    env.split(/\r?\n/).forEach(line => {
      const m = line.match(/^(\w+)=(.*)$/);
      if (m) process.env[m[1]] = m[2];
    });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    const existsRes = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'agent_messages'
      ) as exists
    `);
    console.log('agent_messages exists:', existsRes.rows[0].exists);

    if (existsRes.rows[0].exists) {
      const cols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='agent_messages'`);
      console.log('Columns:', cols.rows);
    }

    await client.end();
  } catch (err) {
    console.error('Error checking table:', err);
    process.exit(1);
  }
})();
