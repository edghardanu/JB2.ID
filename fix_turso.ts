import { db } from "./lib/db";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  console.log("Starting DB Repair for users_old on Turso...");
  try {
      // 1. Rename existing table
      await db.run(sql`ALTER TABLE users_old RENAME TO users_old_backup`);
      console.log("Renamed to users_old_backup");

      // 2. Create new table without constraints
      await db.run(sql`
        CREATE TABLE users_old (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'generus',
          desa_id INTEGER,
          kelompok_id INTEGER,
          generus_id TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `);
      console.log("Created fresh users_old table");

      // 3. Migrate data
      await db.run(sql`INSERT INTO users_old SELECT id, name, email, password_hash, role, desa_id, kelompok_id, generus_id, created_at FROM users_old_backup`);
      console.log("Migrated data to new table");

      // 4. Drop backup
      await db.run(sql`DROP TABLE users_old_backup`);
      console.log("Dropped backup table");

      console.log("TURSO DB REPAIR SUCCESSFUL!");
  } catch (err) {
      console.error("TURSO DB REPAIR FAILED!", err);
  }
}

main();
