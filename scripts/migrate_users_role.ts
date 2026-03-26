import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function migrate() {
  console.log("Starting migration for 'users' table role constraint...");

  try {
    // 1. Get current schema for tables and indices
    const tableRes = await client.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
    if (tableRes.rows.length === 0) throw new Error("Table 'users' not found.");
    const currentSql = tableRes.rows[0].sql as string;
    
    const indexRes = await client.execute("SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name='users' AND sql IS NOT NULL");
    const indices = indexRes.rows.map(r => r.sql as string);

    // 2. Define the new roles list
    const newRoles = ["admin", "pengurus_daerah", "kmm_daerah", "desa", "kelompok", "generus", "creator", "pending", "tim_pnkb", "admin_romantic_room"];
    const rolesListStr = newRoles.map(r => `'${r}'`).join(", ");
    const newCheckConstraint = `CHECK(role IN (${rolesListStr}))`;

    // 3. Create new SQL by replacing the old CHECK constraint
    const oldCheckPattern = /CHECK\s*\(role\s*IN\s*\([^)]+\)\)/i;
    const newSql = currentSql.replace(oldCheckPattern, newCheckConstraint);

    if (newSql === currentSql) {
        console.log("SQL is the same. Maybe already updated.");
        // Skip migration
    } else {
        console.log("Performing table migration...");
        
        await client.execute("PRAGMA foreign_keys=OFF");
        
        // SQLite table rebuild pattern
        await client.batch([
            `CREATE TABLE users_new ${newSql.substring(currentSql.indexOf("("))}`,
            "INSERT INTO users_new SELECT * FROM users",
            "DROP TABLE users",
            "ALTER TABLE users_new RENAME TO users",
            ...indices
        ]);
        
        await client.execute("PRAGMA foreign_keys=ON");
        console.log("Table structure migrated successfully!");
    }
  } catch (error) {
    console.error("Migration failed:", error);
    try { await client.execute("ROLLBACK"); } catch {}
  } finally {
    process.exit(0);
  }
}

migrate();
