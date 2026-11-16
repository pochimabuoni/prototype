#!/usr/bin/env bash
# Applies all migrations + seed to a scratch PostgreSQL database (with a small
# Supabase shim) and runs the SQL security tests in supabase/tests.
# Usage: DATABASE_URL=postgres://postgres@localhost:5432/postgres scripts/test-db.sh
set -euo pipefail
shopt -s nullglob
BASE_URL="${DATABASE_URL:-postgres://postgres@localhost:5432/postgres}"
DB="pmb_test_$$"
psql "$BASE_URL" -v ON_ERROR_STOP=1 -q -c "create database $DB" >/dev/null
trap 'psql "$BASE_URL" -q -c "drop database if exists $DB with (force)" >/dev/null' EXIT
TEST_URL="${BASE_URL%/*}/$DB"
run() { psql "$TEST_URL" -v ON_ERROR_STOP=1 -q -X -f "$1" >/dev/null; }
run supabase/tests/00_supabase_shim.sql
for f in supabase/migrations/*.sql; do echo "migrate: $f"; run "$f"; done
echo "seed: supabase/seed.sql"; run supabase/seed.sql
for f in supabase/tests/*.test.sql; do
  echo "test: $f"
  psql "$TEST_URL" -v ON_ERROR_STOP=1 -q -X -o /dev/null -f "$f" 2>&1 | sed -e "s/^psql:[^ ]* NOTICE:  /  /"
done
echo "All database tests passed."
