import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  console.log("Creating Rundown tables via @libsql/client...");
  
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS rundown (
        id TEXT PRIMARY KEY,
        kegiatan_id TEXT,
        mandiri_kegiatan_id TEXT,
        waktu TEXT NOT NULL,
        agenda TEXT NOT NULL,
        pic TEXT,
        keterangan TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
    console.log("Table 'rundown' created.");

    await client.execute(`
      CREATE TABLE IF NOT EXISTS rundown_approval (
        id TEXT PRIMARY KEY,
        kegiatan_id TEXT,
        mandiri_kegiatan_id TEXT,
        status_pengurus TEXT DEFAULT 'pending',
        is_submitted INTEGER DEFAULT 0,
        catatan_pengurus TEXT,
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
    console.log("Table 'rundown_approval' created.");

    console.log("Database schema updated successfully.");
  } catch (error) {
    console.error("Error updating schema:", error);
  }
}

run().catch(console.error);
