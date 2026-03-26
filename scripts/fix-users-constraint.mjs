import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  console.log("Checking current table structure of 'users'...");
  const res = await client.execute("SELECT sql FROM sqlite_master WHERE name = 'users'");
  if (res.rows.length === 0) {
    console.error("Table 'users' not found!");
    return;
  }
  
  const createSql = res.rows[0].sql as string;
  console.log("Current SQL:", createSql);
  
  // Find the role IN constraint
  const rolesMatch = createSql.match(/role\s+IN\s+\(([^)]+)\)/i);
  if (!rolesMatch) {
    console.log("No 'role IN (...)' constraint found. Maybe it's a different constraint type.");
    return;
  }
  
  const currentRoles = rolesMatch[1];
  if (currentRoles.includes("'admin_kegiatan'")) {
    console.log("Role 'admin_kegiatan' already exists in constraint.");
    return;
  }
  
  const updatedRoles = currentRoles + ", 'admin_kegiatan'";
  const updatedSql = createSql.replace(currentRoles, updatedRoles);
  
  console.log("Updated SQL will be:", updatedSql);
  
  try {
    console.log("1. Renaming users to users_backup...");
    await client.execute("ALTER TABLE users RENAME TO users_backup");
    
    console.log("2. Creating new users table...");
    await client.execute(updatedSql);
    
    console.log("3. Restoring data from backup...");
    const cols = await client.execute("PRAGMA table_info(users_backup)");
    const colList = cols.rows.map(c => `"${c.name}"`).join(", ");
    await client.execute(`INSERT INTO users (${colList}) SELECT ${colList} FROM users_backup`);
    
    console.log("4. Cleaning up...");
    await client.execute("DROP TABLE users_backup");
    
    console.log("Database updated successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
    console.log("Attempting rollback...");
    try {
       await client.execute("DROP TABLE IF EXISTS users");
       await client.execute("ALTER TABLE users_backup RENAME TO users");
       console.log("Rollback successful.");
    } catch (e) {
       console.error("Rollback failed!", e);
    }
  }
}

run().catch(err => {
  console.error("Script error:", err);
  process.exit(1);
});
