// Uses only a temporary table in a rolled-back transaction; never migrates the real library.
// DATABASE_URL=... pnpm --filter @cabinet/api test:bookmark-order-db
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import pg from "pg"

if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL to a local test database")
const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()
try {
  await client.query("BEGIN; SET LOCAL search_path = pg_temp")
  await client.query(`CREATE TEMP TABLE bookmarks (
    id text PRIMARY KEY, title text NOT NULL, url text, "userId" text,
    "deletedAt" timestamp, position integer, "createdAt" timestamp
  )`)
  await client.query(`INSERT INTO bookmarks VALUES
    ('a', 'Zulu', 'https://www.apple.test/z', 'u', null, 0, '2026-01-03'),
    ('b', 'alpha', 'https://user:pass@zebra.test:443/path', 'u', null, 1, '2026-01-01'),
    ('c', 'Beta', 'https://apple.test/a', 'u', null, 2, '2026-01-02'),
    ('n', 'Note', null, 'u', null, 3, '2026-01-04')`)
  await client.query(await readFile(new URL("../prisma/migrations/20261020010000_bookmark_pin_and_sort/migration.sql", import.meta.url), "utf8"))
  assert.deepEqual((await client.query('SELECT "sortTitle", "sortDomain" FROM bookmarks WHERE id = $1', ['b'])).rows[0], { sortTitle: 'alpha', sortDomain: 'zebra.test' })
  await client.query('UPDATE bookmarks SET "isPinned" = true WHERE id = $1', ['b'])
  const cases = [
    ['position ASC, "createdAt" DESC', ['b', 'a', 'c', 'n']],
    ['"createdAt" DESC', ['b', 'n', 'a', 'c']],
    ['"createdAt" ASC', ['b', 'c', 'a', 'n']],
    ['"sortTitle" ASC', ['b', 'c', 'n', 'a']],
    ['"sortDomain" ASC NULLS LAST, "sortTitle" ASC', ['b', 'c', 'a', 'n']],
  ]
  for (const [sort, expected] of cases) {
    const sql = `SELECT id FROM bookmarks ORDER BY "isPinned" DESC, ${sort}, id ASC`
    const rows = [...(await client.query(`${sql} LIMIT 2`)).rows, ...(await client.query(`${sql} LIMIT 2 OFFSET 2`)).rows]
    assert.deepEqual(rows.map((row) => row.id), expected)
  }
  console.log("PASS bookmark pin/sort migration, domain backfill, all five database orders and pagination")
} finally {
  await client.query("ROLLBACK")
  await client.end()
}
