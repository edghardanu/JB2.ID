const { createClient } = require("@libsql/client");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log("Checking columns in 'artikel'...");
  const info = await client.execute("PRAGMA table_info(artikel)");
  const cols = info.rows.map(r => r.name);
  console.log("Columns found:", cols.join(", "));

  if (!cols.includes("tipe")) {
    console.log("Adding 'tipe' column...");
    await client.execute("ALTER TABLE artikel ADD COLUMN tipe TEXT DEFAULT 'artikel' NOT NULL");
    console.log("SUCCESS: 'tipe' added.");
  } else {
    console.log("INFO: 'tipe' already exists.");
  }

  if (!cols.includes("status")) {
    console.log("Adding 'status' column...");
    await client.execute("ALTER TABLE artikel ADD COLUMN status TEXT DEFAULT 'pending' NOT NULL");
    console.log("SUCCESS: 'status' added.");
  } else {
    console.log("INFO: 'status' already exists.");
  }

  process.exit(0);
}
main().catch(e => {
  console.error("FATAL ERROR:", e.message);
  process.exit(1);
});
