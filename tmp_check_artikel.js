const { createClient } = require("@libsql/client");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log("Checking artikel columns...");
  const res = await client.execute("PRAGMA table_info(artikel)");
  res.rows.forEach(r => {
    console.log(`Column: ${r.name}, Type: ${r.type}`);
  });
  
  const master = await client.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='artikel'");
  console.log("\nSQL Definition:\n", master.rows[0]?.sql);
  process.exit(0);
}
main().catch(console.error);
