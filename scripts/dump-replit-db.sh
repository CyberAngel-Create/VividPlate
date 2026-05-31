#!/bin/bash
# ============================================================
# Run this script INSIDE REPLIT shell to dump the database
# Usage: bash scripts/dump-replit-db.sh
# ============================================================

SOURCE_DB="postgresql://postgres:password@helium/heliumdb?sslmode=disable"
OUTPUT_FILE="replit_dump.sql"

echo "🔄 Dumping Replit database to $OUTPUT_FILE ..."

pg_dump "$SOURCE_DB" \
  --no-owner \
  --no-acl \
  --no-comments \
  --format=plain \
  --file="$OUTPUT_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Dump complete: $OUTPUT_FILE"
  echo "📦 File size: $(du -sh $OUTPUT_FILE | cut -f1)"
  echo ""
  echo "Next steps:"
  echo "  1. Download '$OUTPUT_FILE' from Replit's file panel"
  echo "  2. Run the restore script on your local machine"
else
  echo "❌ Dump failed. Check the DB connection."
  exit 1
fi
