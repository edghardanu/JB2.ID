import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { desa, kelompok, users } from "../lib/schema";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client);

async function seed() {
  console.log("🌱 Seeding database...");

  // Create tables
  await client.execute(`
    CREATE TABLE IF NOT EXISTS desa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS kelompok (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      desa_id INTEGER NOT NULL REFERENCES desa(id),
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'kelompok',
      desa_id INTEGER REFERENCES desa(id),
      kelompok_id INTEGER REFERENCES kelompok(id),
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS generus (
      id TEXT PRIMARY KEY,
      nomor_unik TEXT NOT NULL UNIQUE,
      nama TEXT NOT NULL,
      tempat_lahir TEXT,
      tanggal_lahir TEXT,
      jenis_kelamin TEXT NOT NULL,
      kategori_usia TEXT NOT NULL,
      alamat TEXT,
      no_telp TEXT,
      pendidikan TEXT,
      pekerjaan TEXT,
      status_nikah TEXT DEFAULT 'Belum Menikah',
      foto TEXT,
      desa_id INTEGER NOT NULL REFERENCES desa(id),
      kelompok_id INTEGER NOT NULL REFERENCES kelompok(id),
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS kegiatan (
      id TEXT PRIMARY KEY,
      judul TEXT NOT NULL,
      deskripsi TEXT,
      tanggal TEXT NOT NULL,
      lokasi TEXT,
      desa_id INTEGER REFERENCES desa(id),
      kelompok_id INTEGER REFERENCES kelompok(id),
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS absensi (
      id TEXT PRIMARY KEY,
      kegiatan_id TEXT NOT NULL REFERENCES kegiatan(id),
      generus_id TEXT NOT NULL REFERENCES generus(id),
      timestamp TEXT DEFAULT (datetime('now')),
      keterangan TEXT DEFAULT 'hadir'
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS artikel (
      id TEXT PRIMARY KEY,
      judul TEXT NOT NULL,
      konten TEXT NOT NULL,
      ringkasan TEXT,
      cover_image TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      author_id TEXT NOT NULL REFERENCES users(id),
      published_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Seed desa
  console.log("📍 Seeding desa...");
  const desaData = [
    { nama: "Desa Sukamaju" },
    { nama: "Desa Cikaret" },
    { nama: "Desa Margahayu" },
  ];
  await db.insert(desa).values(desaData).onConflictDoNothing();

  const desaList = await db.select().from(desa);
  console.log("Desa:", desaList);

  // Seed kelompok
  console.log("👥 Seeding kelompok...");
  const kelompokData = desaList.flatMap((d) => [
    { nama: `Kelompok A - ${d.nama}`, desaId: d.id },
    { nama: `Kelompok B - ${d.nama}`, desaId: d.id },
  ]);
  await db.insert(kelompok).values(kelompokData).onConflictDoNothing();

  const kelompokList = await db.select().from(kelompok);
  console.log("Kelompok:", kelompokList.length, "entries");

  // Seed admin user
  console.log("👤 Seeding admin user...");
  const passwordHash = await bcrypt.hash("admin123456", 12);
  await db.insert(users).values({
    id: uuidv4(),
    name: "Administrator",
    email: "admin@jb2.id",
    passwordHash,
    role: "admin",
    desaId: null,
    kelompokId: null,
  }).onConflictDoNothing();

  console.log("✅ Seeding selesai!");
  console.log("📋 Admin credentials:");
  console.log("   Email: admin@jb2.id");
  console.log("   Password: admin123456");

  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed error:", e);
  process.exit(1);
});
