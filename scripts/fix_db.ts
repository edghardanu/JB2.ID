import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const client = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

async function fixDB() {
  console.log("Memulai perbaikan skema database...");

  const tx = await client.transaction("write");
  try {
    // Nonaktifkan PRAGMA foreign keys untuk memanipulasi skema rusak
    await tx.execute("PRAGMA foreign_keys = OFF;");
    
    console.log("Rename existing tables to broken...");
    await tx.execute("ALTER TABLE absensi RENAME TO absensi_broken;");
    await tx.execute("ALTER TABLE users RENAME TO users_broken;");

    console.log("Recreate tables with correct foreign keys...");
    await tx.execute(`
      CREATE TABLE absensi (
        id TEXT PRIMARY KEY,
        kegiatan_id TEXT NOT NULL REFERENCES kegiatan(id) ON DELETE CASCADE,
        generus_id TEXT NOT NULL REFERENCES generus(id) ON DELETE CASCADE,
        timestamp TEXT DEFAULT (datetime('now')),
        keterangan TEXT CHECK(keterangan IN ('hadir', 'izin', 'alpha')) DEFAULT 'hadir'
      )
    `);

    await tx.execute(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'pengurus_daerah', 'kmm_daerah', 'desa', 'kelompok', 'generus', 'creator', 'pending', 'tim_pnkb')) NOT NULL DEFAULT 'pending',
        desa_id INTEGER REFERENCES desa(id) ON DELETE SET NULL,
        kelompok_id INTEGER REFERENCES kelompok(id) ON DELETE SET NULL,
        generus_id TEXT REFERENCES generus(id) ON DELETE CASCADE,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    console.log("Copying data...");
    await tx.execute(`INSERT INTO absensi SELECT * FROM absensi_broken;`);
    await tx.execute(`INSERT INTO users SELECT * FROM users_broken;`);

    console.log("Dropping broken tables...");
    await tx.execute("DROP TABLE absensi_broken;");
    await tx.execute("DROP TABLE users_broken;");

    await tx.commit();
    console.log("✅ Perbaikan skema database berhasil!");
  } catch (e) {
    await tx.rollback();
    console.error("❌ Gagal memperbaiki database:", e);
  } finally {
    process.exit(0);
  }
}

fixDB();
