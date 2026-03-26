import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { client } from "../lib/db";

async function createRabApprovalTable() {
  try {
    console.log("Creating rab_approval table...");
    await client.execute(`
      CREATE TABLE IF NOT EXISTS rab_approval (
        id TEXT PRIMARY KEY,
        kegiatan_id TEXT,
        mandiri_kegiatan_id TEXT,
        status_pengurus TEXT DEFAULT 'pending',
        status_admin TEXT DEFAULT 'pending',
        catatan_pengurus TEXT,
        catatan_admin TEXT,
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (kegiatan_id) REFERENCES kegiatan(id) ON DELETE CASCADE,
        FOREIGN KEY (mandiri_kegiatan_id) REFERENCES mandiri_kegiatan(id) ON DELETE CASCADE
      )
    `);
    
    console.log("Creating indices...");
    await client.execute('CREATE INDEX IF NOT EXISTS rab_approval_kegiatan_id_idx ON rab_approval(kegiatan_id)');
    await client.execute('CREATE INDEX IF NOT EXISTS rab_approval_mandiri_kegiatan_id_idx ON rab_approval(mandiri_kegiatan_id)');
    
    console.log("Table 'rab_approval' created successfully!");
  } catch (error) {
    console.error("Error creating rab_approval table:", error);
  }
}

createRabApprovalTable();
