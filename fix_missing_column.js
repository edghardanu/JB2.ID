const { createClient } = require("@libsql/client");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log("Adding 'tipe' column to 'artikel' table...");
  try {
    await client.execute("ALTER TABLE artikel ADD COLUMN tipe TEXT DEFAULT 'artikel' NOT NULL");
    console.log("SUCCESS: Column 'tipe' added.");
  } catch (e) {
    if (e.message.includes("duplicate column name")) {
      console.log("INFO: Column 'tipe' already exists.");
    } else {
      console.error("ERROR:", e.message);
    }
  }
  process.exit(0);
}
main().catch(console.error);
