const { createClient } = require("@libsql/client");
require("dotenv").config({ path: ".env.local" });

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
  
  const createSql = res.rows[0].sql;
  console.log("Current SQL:", createSql);
  
  // Update the roles list
  const rolesMatch = createSql.match(/role\s+IN\s+\(([^)]+)\)/i);
  if (!rolesMatch) {
    console.log("No 'role IN (...)' constraint found.");
    return;
  }
  
  const currentRoles = rolesMatch[1];
  if (currentRoles.includes("'admin_kegiatan'")) {
    console.log("Role 'admin_kegiatan' already exists.");
    return;
  }
  
  const updatedRoles = currentRoles + ", 'admin_kegiatan'";
  const updatedSql = createSql.replace(currentRoles, updatedRoles);
  
  console.log("1. Renaming users to users_backup...");
  await client.execute("ALTER TABLE users RENAME TO users_backup");
  
  console.log("2. Creating new users table...");
  await client.execute(updatedSql);
  
  console.log("3. Restoring data...");
  const cols = await client.execute("PRAGMA table_info(users_backup)");
  const colNames = cols.rows.map(c => `"${c.name}"`).join(", ");
  await client.execute(`INSERT INTO users (${colNames}) SELECT ${colNames} FROM users_backup`);
  
  console.log("4. Cleaning up...");
  await client.execute("DROP TABLE users_backup");
  
  console.log("Migration successful!");
}

run().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
