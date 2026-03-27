import { client } from "../lib/db";

async function run() {
  console.log("Checking users_old table...");
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users_old (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'generus',
        desa_id INTEGER,
        kelompok_id INTEGER,
        generus_id TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    console.log("Table users_old ready!");
  } catch (e) {
    console.error("Error creating users_old:", e);
  }
}
run();
