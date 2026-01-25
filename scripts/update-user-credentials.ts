import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

interface UserRow {
  id: number;
  username: string;
}

interface Args {
  currentUsername?: string;
  userId?: number;
  newUsername: string;
  password: string;
}

function parseArgs(): Args {
  const entries = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const [key, value] = arg.split("=");
      return [key.replace(/^--/, ""), value];
    }),
  );

  const newUsername = entries.newUsername || entries.newusername;
  const password = entries.password;
  const currentUsername = entries.currentUsername || entries.currentusername;
  const userId = entries.userId ? Number(entries.userId) : undefined;

  if (!newUsername || !password) {
    throw new Error("Provide --newUsername=<value> and --password=<value>.");
  }

  if (!currentUsername && !userId) {
    throw new Error("Provide either --currentUsername=<value> or --userId=<id>.");
  }

  if (userId !== undefined && (!Number.isFinite(userId) || userId < 1)) {
    throw new Error("--userId must be a positive integer");
  }

  return { currentUsername, userId, newUsername, password };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Please configure it in your .env file.");
  }

  const args = parseArgs();
  const sql = neon<UserRow>(databaseUrl);

  let targetUser: UserRow | undefined;
  if (args.userId) {
    const rows = await sql`SELECT id, username FROM users WHERE id = ${args.userId};`;
    targetUser = rows[0];
  } else {
    const rows = await sql`
      SELECT id, username
      FROM users
      WHERE LOWER(username) = LOWER(${args.currentUsername!})
      LIMIT 1;
    `;
    targetUser = rows[0];
  }

  if (!targetUser) {
    throw new Error("Target user not found.");
  }

  const conflict = await sql`
    SELECT id FROM users WHERE LOWER(username) = LOWER(${args.newUsername}) AND id != ${targetUser.id} LIMIT 1;
  `;

  if (conflict.length) {
    throw new Error(`Username "${args.newUsername}" is already in use.`);
  }

  const hashedPassword = await bcrypt.hash(args.password, 10);

  const updated = await sql<UserRow>`
    UPDATE users
    SET username = ${args.newUsername}, password = ${hashedPassword}
    WHERE id = ${targetUser.id}
    RETURNING id, username;
  `;

  console.log("Updated user credentials:", updated[0]);
}

main().catch((error) => {
  console.error("Failed to update credentials:", error);
  process.exit(1);
});
