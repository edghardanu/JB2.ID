import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log("Fixing generus table constraints and migrating 'Dewasa' to 'Bekerja'...");

  try {
    await client.execute("PRAGMA foreign_keys = OFF;");

    // Update existing records
    await client.execute("UPDATE generus SET kategori_usia = 'Bekerja' WHERE kategori_usia = 'Dewasa';");

    // Rename old table
    await client.execute("ALTER TABLE generus RENAME TO generus_old;");

    // Create new table with updated CHECK constraint
    await client.execute(`
      CREATE TABLE generus (
        id TEXT PRIMARY KEY,
        nomor_unik TEXT NOT NULL UNIQUE,
        nama TEXT NOT NULL,
        tempat_lahir TEXT,
        tanggal_lahir TEXT,
        jenis_kelamin TEXT CHECK(jenis_kelamin IN ('L', 'P')) NOT NULL,
        kategori_usia TEXT CHECK(kategori_usia IN ('PAUD', 'TK', 'SD', 'SMP', 'SMA', 'Kuliah', 'Bekerja')) NOT NULL,
        alamat TEXT,
        no_telp TEXT,
        pendidikan TEXT,
        pekerjaan TEXT,
        status_nikah TEXT CHECK(status_nikah IN ('Belum Menikah', 'Menikah')) DEFAULT 'Belum Menikah',
        foto TEXT,
        desa_id INTEGER NOT NULL REFERENCES desa(id) ON DELETE CASCADE,
        kelompok_id INTEGER NOT NULL REFERENCES kelompok(id) ON DELETE CASCADE,
        created_by TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Copy data
    await client.execute(`
      INSERT INTO generus (id, nomor_unik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, kategori_usia, alamat, no_telp, pendidikan, pekerjaan, status_nikah, foto, desa_id, kelompok_id, created_by, created_at, updated_at)
      SELECT id, nomor_unik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, kategori_usia, alamat, no_telp, pendidikan, pekerjaan, status_nikah, foto, desa_id, kelompok_id, created_by, created_at, updated_at
      FROM generus_old;
    `);

    // Drop old table
    await client.execute("DROP TABLE generus_old;");

    await client.execute("PRAGMA foreign_keys = ON;");

    console.log("Migration complete!");
  } catch (e) {
    console.error(e);
  }
}

main();
