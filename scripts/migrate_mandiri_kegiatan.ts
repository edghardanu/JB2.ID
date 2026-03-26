import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  console.log("Migrating mandiri_kegiatan...");
  await client.execute(`
    CREATE TABLE IF NOT EXISTS mandiri_kegiatan (
      id TEXT PRIMARY KEY,
      judul TEXT NOT NULL,
      deskripsi TEXT,
      tanggal TEXT NOT NULL,
      lokasi TEXT,
      kota TEXT NOT NULL,
      desa_id INTEGER,
      kelompok_id INTEGER,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log("Migration complete!");
}

main().catch(console.error);
