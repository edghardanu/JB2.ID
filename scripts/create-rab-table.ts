import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Import AFTER dotenv config
import { client } from "../lib/db";

async function createRabTable() {
  try {
    const url = process.env.TURSO_DATABASE_URL;
    console.log("DB_URL from env exists:", !!url);
    if (url) console.log("DB_URL starts with:", url.substring(0, 10));
    
    console.log("Creating rab table...");
    await client.execute(`
      CREATE TABLE IF NOT EXISTS rab (
        id TEXT PRIMARY KEY,
        kegiatan_id TEXT,
        mandiri_kegiatan_id TEXT,
        item TEXT NOT NULL,
        volume INTEGER NOT NULL,
        satuan TEXT NOT NULL,
        harga_satuan INTEGER NOT NULL,
        total_harga INTEGER NOT NULL,
        keterangan TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (kegiatan_id) REFERENCES kegiatan(id) ON DELETE CASCADE,
        FOREIGN KEY (mandiri_kegiatan_id) REFERENCES mandiri_kegiatan(id) ON DELETE CASCADE
      )
    `);
    
    console.log("Creating indices...");
    await client.execute('CREATE INDEX IF NOT EXISTS rab_kegiatan_id_idx ON rab(kegiatan_id)');
    await client.execute('CREATE INDEX IF NOT EXISTS rab_mandiri_kegiatan_id_idx ON rab(mandiri_kegiatan_id)');
    
    console.log("Table 'rab' created successfully!");
  } catch (error) {
    console.error("Error creating rab table:", error);
  }
}

createRabTable();
