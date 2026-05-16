import "dotenv/config";
import { neon } from "@neondatabase/serverless";

function parseThresholdArgument(): number {
  const defaultThreshold = 3;
  const arg = process.argv.slice(2).find((value) => value.startsWith("--min="));
  if (!arg) return defaultThreshold;

  const parsed = Number(arg.split("=")[1]);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("--min argument must be a positive integer");
  }
  return Math.floor(parsed);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Please update your .env file.");
  }

  const minRestaurants = parseThresholdArgument();
  const sql = neon(databaseUrl);

  const rows = await sql`
    SELECT r.user_id, u.username, u.email, COUNT(*)::int AS restaurant_count
    FROM restaurants r
    LEFT JOIN users u ON r.user_id = u.id
    GROUP BY r.user_id, u.username, u.email
    HAVING COUNT(*) >= ${minRestaurants}
    ORDER BY restaurant_count DESC;
  `;

  if (!rows.length) {
    console.log(`✅ No users currently own ${minRestaurants} or more restaurants.`);
    return;
  }

  console.log(`Users with ${minRestaurants} or more restaurants:`);
  console.table(
    rows.map((row: any) => ({
      userId: row.user_id,
      username: row.username || "<missing>",
      email: row.email || "<missing>",
      restaurantCount: row.restaurant_count,
    })),
  );
}

main().catch((error) => {
  console.error("Failed to check restaurant ownership:", error);
  process.exit(1);
});
