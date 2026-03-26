import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  console.log("Migrating mandiri_desa and mandiri_kelompok...");
  
  await client.execute("DROP TABLE IF EXISTS mandiri_kelompok");
  await client.execute("DROP TABLE IF EXISTS mandiri_desa");
  await client.execute("DROP TABLE IF EXISTS mandiri_kegiatan");

  await client.execute(`
    CREATE TABLE mandiri_desa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      kota TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE mandiri_kelompok (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      mandiri_desa_id INTEGER NOT NULL REFERENCES mandiri_desa(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE mandiri_kegiatan (
      id TEXT PRIMARY KEY,
      judul TEXT NOT NULL,
      deskripsi TEXT,
      tanggal TEXT NOT NULL,
      lokasi TEXT,
      kota TEXT NOT NULL,
      desa_id INTEGER REFERENCES mandiri_desa(id) ON DELETE SET NULL,
      kelompok_id INTEGER REFERENCES mandiri_kelompok(id) ON DELETE SET NULL,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  console.log("Migration complete!");
}

main().catch(console.error);
