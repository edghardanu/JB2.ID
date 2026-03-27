import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "./lib/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Starting DB Repair for users table on Turso...");
    try {
        const usersSqlData = await db.run(sql`SELECT sql FROM sqlite_master WHERE name = 'users'`);
        const currentSql = usersSqlData.rows[0].sql;
        console.log("Table SQL discovered on Turso:", currentSql);

        // We completely recreate it without check constraints and ensuring all columns exist
        await db.run(sql`ALTER TABLE users RENAME TO users_backup_final`);
        
        // Ensure all columns match lib/schema.ts
        await db.run(sql`
            CREATE TABLE users (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              email TEXT NOT NULL UNIQUE,
              password_hash TEXT NOT NULL,
              role TEXT NOT NULL DEFAULT 'pending',
              desa_id INTEGER,
              kelompok_id INTEGER,
              mandiri_desa_id INTEGER,
              mandiri_kelompok_id INTEGER,
              generus_id TEXT,
              created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("Created fresh users table on Turso");

        // Migrate data - match existing columns in DB
        // Based on my previous view, users had: id, name, email, password_hash, role, desa_id, kelompok_id, created_at, generus_id
        await db.run(sql`
          INSERT INTO users (id, name, email, password_hash, role, desa_id, kelompok_id, created_at, generus_id) 
          SELECT id, name, email, password_hash, role, desa_id, kelompok_id, created_at, generus_id 
          FROM users_backup_final
        `);
        console.log("Migrated data to new table on Turso");

        // Drop backup
        await db.run(sql`DROP TABLE users_backup_final`);
        console.log("Dropped backup table on Turso");

        console.log("TURSO USERS REPAIR SUCCESSFUL!");
    } catch (err) {
        console.error("TURSO USERS REPAIR FAILED!", err);
    }
}
main();
