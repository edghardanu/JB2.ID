import { db } from "./lib/db";
import { sql } from "drizzle-orm";
import fs from "fs";

async function main() {
    console.log("Starting DB Repair for users table...");
    try {
        const usersSqlData = await db.run(sql`SELECT sql FROM sqlite_master WHERE name = 'users'`);
        const currentSql = usersSqlData.rows[0].sql;
        console.log("Table SQL discovered:", currentSql);

        if (currentSql.includes("peserta")) {
            console.log("Table already contains 'peserta' in constraint, no repair needed.");
            return;
        }

        // Repair needed to include 'peserta' or just remove the check
        await db.run(sql`ALTER TABLE users RENAME TO users_backup`);
        // We'll use the original SQL but we'll remove the CHECK constraint logic.
        // Actually, we'll just create it based on current lib/schema.ts
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
        console.log("Created fresh users table");

        // Migrate data
        await db.run(sql`INSERT INTO users SELECT id, name, email, password_hash, role, desa_id, kelompok_id, mandiri_desa_id, mandiri_kelompok_id, generus_id, created_at FROM users_backup`);
        console.log("Migrated data to new table");

        // Drop backup
        await db.run(sql`DROP TABLE users_backup`);
        console.log("Dropped backup table");

        console.log("DB REPAIR SUCCESSFUL!");
    } catch (err) {
        console.error("DB REPAIR FAILED!", err);
    }
}
main();
