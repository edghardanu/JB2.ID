import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log("Fixing users table constraints...");

  try {
    await client.execute("PRAGMA foreign_keys = OFF;");

    // Rename old table
    await client.execute("ALTER TABLE users RENAME TO users_old;");

    // Create new table with updated CHECK constraint
    await client.execute(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'desa', 'kelompok', 'generus', 'pending')) NOT NULL DEFAULT 'pending',
        desa_id INTEGER REFERENCES desa(id) ON DELETE SET NULL,
        kelompok_id INTEGER REFERENCES kelompok(id) ON DELETE SET NULL,
        generus_id TEXT REFERENCES generus(id) ON DELETE CASCADE,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Copy data
    await client.execute(`
      INSERT INTO users (id, name, email, password_hash, role, desa_id, kelompok_id, generus_id, created_at)
      SELECT id, name, email, password_hash, role, desa_id, kelompok_id, generus_id, created_at
      FROM users_old;
    `);

    // Drop old table
    await client.execute("DROP TABLE users_old;");

    await client.execute("PRAGMA foreign_keys = ON;");

    console.log("Migration complete!");
  } catch (e) {
    console.error(e);
  }
}

main();
