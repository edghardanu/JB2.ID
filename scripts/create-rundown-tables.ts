import { db } from "../lib/db"
import { sql } from "drizzle-orm"

async function run() {
  console.log("Creating Rundown tables...");
  
  try {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS rundown (
        id TEXT PRIMARY KEY,
        kegiatan_id TEXT REFERENCES kegiatan(id) ON DELETE CASCADE,
        mandiri_kegiatan_id TEXT REFERENCES mandiri_kegiatan(id) ON DELETE CASCADE,
        waktu TEXT NOT NULL,
        agenda TEXT NOT NULL,
        pic TEXT,
        keterangan TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
    console.log("Table 'rundown' created or exists.");

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS rundown_approval (
        id TEXT PRIMARY KEY,
        kegiatan_id TEXT REFERENCES kegiatan(id) ON DELETE CASCADE,
        mandiri_kegiatan_id TEXT REFERENCES mandiri_kegiatan(id) ON DELETE CASCADE,
        status_pengurus TEXT DEFAULT 'pending',
        is_submitted INTEGER DEFAULT 0,
        catatan_pengurus TEXT,
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
    console.log("Table 'rundown_approval' created or exists.");

    console.log("Database schema updated successfully.");
  } catch (error) {
    console.error("Error updating schema:", error);
  }
}

run().catch(console.error);
