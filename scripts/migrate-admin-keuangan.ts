import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function run() {
  console.log("Starting Admin Keuangan role migration...");
  
  // 1. Get current schema
  const usersSchemaRes = await client.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
  const oldSql = usersSchemaRes.rows[0].sql as string;
  console.log("Old Schema found.");
  
  // 2. Prepare new SQL with updated enum
  // CURRENT: CHECK(role IN ('admin', 'pengurus_daerah', 'kmm_daerah', 'desa', 'kelompok', 'generus', 'creator', 'pending', 'tim_pnkb', 'admin_romantic_room'))
  // NEW:     CHECK(role IN ('admin', 'pengurus_daerah', 'kmm_daerah', 'desa', 'kelompok', 'generus', 'creator', 'pending', 'tim_pnkb', 'admin_romantic_room', 'admin_keuangan'))
  
  const newEnum = "'admin', 'pengurus_daerah', 'kmm_daerah', 'desa', 'kelompok', 'generus', 'creator', 'pending', 'tim_pnkb', 'admin_romantic_room', 'admin_keuangan'";
  const newSql = oldSql.replace(
    /CHECK\s*\(role\s*IN\s*\([^)]+\)\)/i, 
    `CHECK(role IN (${newEnum}))`
  );
  
  if (newSql === oldSql) {
    console.error("Failed to update SQL schema string! Check if the regex matches.");
    process.exit(1);
  }

  console.log("New Schema prepared.");
  
  const tempName = `users_migrate_${Date.now()}`;
  const createTempSql = newSql.replace(/CREATE TABLE "?users"?/i, `CREATE TABLE ${tempName}`);

  // Get indexes to recreate them
  const indexRes = await client.execute("SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='users' AND sql IS NOT NULL");
  const indexes = indexRes.rows;

  try {
    console.log("Migrating data...");
    await client.execute("PRAGMA foreign_keys = OFF");
    
    // Create new temp table
    await client.execute(createTempSql);
    
    // Copy data (using column names to be safe)
    // We can just use * since we are not changing columns
    await client.execute(`INSERT INTO ${tempName} SELECT * FROM users`);
    
    // Rename tables
    await client.execute("DROP TABLE users");
    await client.execute(`ALTER TABLE ${tempName} RENAME TO users`);
    
    // Recreate indexes
    for (const idx of indexes) {
        if (idx.sql) {
            await client.execute(idx.sql as string);
        }
    }
    
    await client.execute("PRAGMA foreign_keys = ON");
    console.log("Migration successful!");
  } catch (e) {
    console.error("Migration failed:", e);
    await client.execute("PRAGMA foreign_keys = ON");
    process.exit(1);
  }
}

run().catch(console.error);
