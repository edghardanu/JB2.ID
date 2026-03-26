import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function run() {
  console.log("Starting database migration...");
  
  // 1. Get current schema to replicate it
  const schemaRes = await client.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
  const oldSql = schemaRes.rows[0].sql as string;
  console.log("Old SQL:", oldSql);
  
  // 2. Prepare new SQL.
  // We'll replace the old CHECK constraint with the new one.
  // The error said the current constraint is: role IN ('admin', 'desa', 'kelompok', 'generus', 'creator', 'pending')
  // We want to add 'pengurus_daerah' and 'kmm_daerah'
  
  const newEnum = "'admin', 'pengurus_daerah', 'kmm_daerah', 'desa', 'kelompok', 'generus', 'creator', 'pending'";
  let newSql = oldSql.replace(
    /CHECK\s*\(role\s*IN\s*\([^)]+\)\)/i, 
    `CHECK(role IN (${newEnum}))`
  );
  
  // If no check constraint was found (maybe it's different?), let's log it.
  if (newSql === oldSql) {
    console.log("No CHECK constraint found with exact regex. Trying a simpler approach...");
    // Just replace the enum part
    newSql = oldSql.replace(
       /'admin', 'desa', 'kelompok', 'generus', 'creator', 'pending'/,
       newEnum
    );
  }
  
  if (newSql === oldSql) {
     console.error("Failed to update SQL schema string!");
     process.exit(1);
  }

  console.log("New SQL:", newSql);
  
  const tempName = `users_new_${Date.now()}`;
  const createTempSql = newSql.replace("CREATE TABLE users", `CREATE TABLE ${tempName}`);

  try {
    console.log("Running migration steps...");
    await client.execute("PRAGMA foreign_keys = OFF");
    
    await client.execute(createTempSql);
    console.log("Temp table created.");
    
    await client.execute(`INSERT INTO ${tempName} SELECT * FROM users`);
    console.log("Data copied.");
    
    await client.execute("DROP TABLE users");
    console.log("Old table dropped.");
    
    await client.execute(`ALTER TABLE ${tempName} RENAME TO users`);
    console.log("Table renamed.");
    
    await client.execute("PRAGMA foreign_keys = ON");
    console.log("Migration successful!");
  } catch (e) {
    console.error("Migration failed:", e);
    await client.execute("PRAGMA foreign_keys = ON");
    process.exit(1);
  }
  
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
