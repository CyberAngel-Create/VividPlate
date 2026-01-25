import "dotenv/config";
import { neon } from "@neondatabase/serverless";

type Row = {
  user_id: number;
  username: string;
  email: string;
  restaurant_id: number | null;
  restaurant_name: string | null;
};

function parseArgs() {
  const usernameArg = process.argv.find((arg) => arg.startsWith("--username="));
  const userIdArg = process.argv.find((arg) => arg.startsWith("--userId="));

  const username = usernameArg ? usernameArg.split("=")[1] : undefined;
  const userId = userIdArg ? Number(userIdArg.split("=")[1]) : undefined;

  if (!username && !userId) {
    throw new Error("Provide --username=<name> or --userId=<id>.");
  }

  if (userIdArg && (!Number.isFinite(userId) || userId! < 1)) {
    throw new Error("--userId must be a positive integer");
  }

  return { username, userId };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Add it to your .env file.");
  }

  const { username, userId } = parseArgs();
  const sql = neon<Row>(databaseUrl);

  let rows: Row[];
  if (username) {
    rows = await sql`
      SELECT u.id AS user_id, u.username, u.email, r.id AS restaurant_id, r.name AS restaurant_name
      FROM users u
      LEFT JOIN restaurants r ON r.user_id = u.id
      WHERE LOWER(u.username) = LOWER(${username})
      ORDER BY r.id;
    `;
  } else {
    rows = await sql`
      SELECT u.id AS user_id, u.username, u.email, r.id AS restaurant_id, r.name AS restaurant_name
      FROM users u
      LEFT JOIN restaurants r ON r.user_id = u.id
      WHERE u.id = ${userId!}
      ORDER BY r.id;
    `;
  }

  if (!rows.length) {
    console.log("No matching user found.");
    return;
  }

  console.log(`User matches: ${rows[0].username} (ID ${rows[0].user_id}, email ${rows[0].email || "<missing>"})`);
  if (rows[0].restaurant_id === null) {
    console.log("This user currently owns no restaurants.");
    return;
  }

  console.table(
    rows.map((row) => ({
      restaurantId: row.restaurant_id,
      restaurantName: row.restaurant_name,
    })),
  );
}

main().catch((error) => {
  console.error("Failed to show user restaurants:", error);
  process.exit(1);
});
