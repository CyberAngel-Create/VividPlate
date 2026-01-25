import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

interface MultiRestaurantRow {
  user_id: number;
  owner_username: string | null;
  owner_email: string | null;
  restaurant_id: number;
  restaurant_name: string | null;
  restaurant_index: number;
  total_restaurants: number;
}

interface GeneratedCredentials {
  username: string;
  email: string;
  phone: string;
  password: string;
  fullName: string;
}

function generateCredentials(row: MultiRestaurantRow): GeneratedCredentials {
  const safeName = row.restaurant_name?.trim() || `Restaurant ${row.restaurant_id}`;
  const username = `restaurant_${row.restaurant_id}`;
  const email = `${username}@owners.vividplate.auto`;
  const phone = `${9000000000 + row.restaurant_id}`;
  const password = `Vip${row.restaurant_id}${randomBytes(3).toString("hex")}`;

  return {
    username,
    email,
    phone,
    password,
    fullName: safeName,
  };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Please configure it in your .env file.");
  }

  const sql = neon(databaseUrl);

  const rows = await sql<MultiRestaurantRow>`
    WITH ranked AS (
      SELECT
        r.id AS restaurant_id,
        r.user_id,
        r.name AS restaurant_name,
        u.username AS owner_username,
        u.email AS owner_email,
        ROW_NUMBER() OVER (PARTITION BY r.user_id ORDER BY r.id) AS restaurant_index,
        COUNT(*) OVER (PARTITION BY r.user_id) AS total_restaurants
      FROM restaurants r
      JOIN users u ON u.id = r.user_id
    )
    SELECT *
    FROM ranked
    WHERE total_restaurants > 1 AND restaurant_index > 1
    ORDER BY user_id, restaurant_index;
  `;

  if (!rows.length) {
    console.log("✅ Every restaurant already has a dedicated owner account.");
    return;
  }

  const results: Array<Record<string, unknown>> = [];

  for (const row of rows) {
    const credentials = generateCredentials(row);
    const hashedPassword = await bcrypt.hash(credentials.password, 10);

    await sql`BEGIN`;
    try {
      const newUser = await sql<{ id: number }>`
        INSERT INTO users (username, password, email, full_name, phone, role)
        VALUES (${credentials.username}, ${hashedPassword}, ${credentials.email}, ${credentials.fullName}, ${credentials.phone}, 'user')
        RETURNING id;
      `;

      const newUserId = newUser[0].id;

      await sql`
        UPDATE restaurants
        SET user_id = ${newUserId}
        WHERE id = ${row.restaurant_id};
      `;

      await sql`COMMIT`;

      results.push({
        restaurantId: row.restaurant_id,
        restaurantName: row.restaurant_name,
        originalOwner: row.owner_username,
        newUsername: credentials.username,
        tempPassword: credentials.password,
        tempEmail: credentials.email,
      });
    } catch (error) {
      await sql`ROLLBACK`;
      console.error(`Failed to process restaurant ${row.restaurant_id}:`, error);
      throw error;
    }
  }

  console.log("Created dedicated owner accounts:");
  console.table(results);
}

main().catch((error) => {
  console.error("Failed to split restaurant owners:", error);
  process.exit(1);
});
