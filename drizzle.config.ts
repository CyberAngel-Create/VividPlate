import { defineConfig } from "drizzle-kit";

const DB_URL = process.env.EXTERNAL_DATABASE_URL || process.env.DATABASE_URL;

if (!DB_URL) {
  throw new Error("DATABASE_URL or EXTERNAL_DATABASE_URL must be set, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DB_URL,
  },
});
