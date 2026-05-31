#!/usr/bin/env node
// ============================================================
// restore-to-neon.mjs
// Run LOCALLY after downloading replit_dump.sql from Replit
// Usage: node scripts/restore-to-neon.mjs
// ============================================================
import { execSync } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dumpFile = path.resolve(__dirname, "../replit_dump.sql");

const NEON_DB = "postgresql://neondb_owner:npg_tWvqo9fuah3U@ep-calm-poetry-abx9kptm-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

if (!existsSync(dumpFile)) {
  console.error(`❌ Dump file not found: ${dumpFile}`);
  console.error("   Download replit_dump.sql from Replit and place it in the project root.");
  process.exit(1);
}

console.log("🔄 Restoring database to Neon...");
console.log(`   Source file: ${dumpFile}`);
console.log(`   Target: Neon (eu-west-2)`);
console.log("");

try {
  // Drop and restore — using psql for plain SQL dump
  execSync(
    `psql "${NEON_DB}" -f "${dumpFile}" --echo-errors`,
    { stdio: "inherit" }
  );
  console.log("\n✅ Restore complete! Your Neon database now has the Replit data.");
} catch (err) {
  console.error("\n⚠️  Some errors may appear above (e.g. existing objects) — these are usually safe to ignore.");
  console.error("   If data is missing, try running with --single-transaction flag or check table conflicts.");
}
