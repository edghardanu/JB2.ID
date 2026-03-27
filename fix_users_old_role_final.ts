import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as dotenv from "dotenv";
import fs from "fs";

// Load env
dotenv.config({ path: ".env.local" });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
    console.error("TURSO_DATABASE_URL is missing!");
    process.exit(1);
}

const client = createClient({
    url,
    authToken,
});

async function main() {
    console.log("Starting DB Repair for users_old on Turso...");
    console.log("DB URL:", url.substring(0, 30) + "...");

    try {
        // 1. Check if users_old_backup already exists from a previous failed run
        try {
            await client.execute("DROP TABLE IF EXISTS users_old_backup");
            console.log("Cleanup: Dropped any existing users_old_backup");
        } catch (e) {
            // ignore
        }

        // 2. Rename existing table
        const renameRes = await client.execute("ALTER TABLE users_old RENAME TO users_old_backup");
        console.log("Step 1: Renamed users_old to users_old_backup");

        // 3. Create new table without CHECK constraints on role
        // We'll also include all columns as they appear in lib/schema.ts for users_old
        await client.execute(`
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
        console.log("Step 2: Created fresh users_old table without constraints");

        // 4. Migrate data
        // We specify columns explicitly to be safe
        await client.execute(`
            INSERT INTO users_old (id, name, email, password_hash, role, desa_id, kelompok_id, generus_id, created_at)
            SELECT id, name, email, password_hash, role, desa_id, kelompok_id, generus_id, created_at
            FROM users_old_backup
        `);
        console.log("Step 3: Migrated data from backup to new table");

        // 5. Drop the backup
        await client.execute("DROP TABLE users_old_backup");
        console.log("Step 4: Dropped users_old_backup");

        console.log("\n========================================");
        console.log("SUCCESS: users_old table constraint removed!");
        console.log("You should now be able to set any role without error.");
        console.log("========================================\n");

    } catch (err: any) {
        console.error("\n========================================");
        console.error("FAILED to repair table!", err.message);
        console.error("========================================\n");
        
        // Try to revert if possible
        try {
             const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users_old'");
             if (tables.rows.length === 0) {
                 const backupTables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users_old_backup'");
                 if (backupTables.rows.length > 0) {
                     console.log("Attempting to restore from backup...");
                     await client.execute("ALTER TABLE users_old_backup RENAME TO users_old");
                     console.log("Restored users_old table from backup.");
                 }
             }
        } catch (revertErr) {
            console.error("Critical: Could not revert safely!", revertErr);
        }
    } finally {
        // Close client?
    }
}

main();
