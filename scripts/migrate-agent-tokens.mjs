import pg from "pg";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to migrate agent token tables.");
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
  max: 1,
});

const statements = [
  `
  CREATE TABLE IF NOT EXISTS agents (
    id serial PRIMARY KEY,
    user_id integer NOT NULL UNIQUE,
    agent_code text UNIQUE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    date_of_birth text,
    gender text,
    address text,
    city text,
    state text,
    country text,
    postal_code text,
    id_type text NOT NULL,
    id_number text NOT NULL,
    id_front_image_url text NOT NULL,
    id_back_image_url text,
    selfie_image_url text,
    token_balance integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    approval_status text DEFAULT 'pending',
    approval_notes text,
    approved_by integer,
    approved_at timestamp,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )
  `,
  `ALTER TABLE agents ADD COLUMN IF NOT EXISTS agent_code text`,
  `ALTER TABLE agents ADD COLUMN IF NOT EXISTS token_balance integer NOT NULL DEFAULT 0`,
  `ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true`,
  `ALTER TABLE agents ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending'`,
  `ALTER TABLE agents ADD COLUMN IF NOT EXISTS approval_notes text`,
  `ALTER TABLE agents ADD COLUMN IF NOT EXISTS approved_by integer`,
  `ALTER TABLE agents ADD COLUMN IF NOT EXISTS approved_at timestamp`,
  `ALTER TABLE agents ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now()`,
  `CREATE UNIQUE INDEX IF NOT EXISTS agents_agent_code_unique ON agents(agent_code) WHERE agent_code IS NOT NULL`,
  `
  CREATE TABLE IF NOT EXISTS token_requests (
    id serial PRIMARY KEY,
    agent_id integer NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    requested_tokens integer NOT NULL,
    status text DEFAULT 'pending',
    notes text,
    admin_notes text,
    approved_by integer,
    approved_at timestamp,
    created_at timestamp DEFAULT now()
  )
  `,
  `CREATE INDEX IF NOT EXISTS token_requests_agent_id_idx ON token_requests(agent_id)`,
  `CREATE INDEX IF NOT EXISTS token_requests_status_idx ON token_requests(status)`,
  `
  CREATE TABLE IF NOT EXISTS token_transactions (
    id serial PRIMARY KEY,
    agent_id integer NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    amount integer NOT NULL,
    type text NOT NULL,
    reason text NOT NULL,
    restaurant_id integer,
    token_request_id integer,
    admin_id integer,
    created_at timestamp DEFAULT now()
  )
  `,
  `CREATE INDEX IF NOT EXISTS token_transactions_agent_id_idx ON token_transactions(agent_id)`,
  `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS agent_id integer`,
  `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false`,
  `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS premium_months integer DEFAULT 0`,
  `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS premium_expires_at timestamp`,
  `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS tokens_used integer DEFAULT 0`,
];

async function main() {
  const client = await pool.connect();
  try {
    console.log("Running agent token migration...");
    await client.query("BEGIN");
    for (const statement of statements) {
      await client.query(statement);
    }
    await client.query("COMMIT");
    console.log("Agent token migration complete.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Agent token migration failed:", error);
  process.exit(1);
});
