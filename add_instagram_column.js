const { createClient } = require("@libsql/client");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log("Adding 'instagram' column to 'generus' table...");
  try {
    await client.execute("ALTER TABLE generus ADD COLUMN instagram TEXT");
    console.log("SUCCESS: Column 'instagram' added to 'generus'.");
  } catch (e) {
    if (e.message.includes("duplicate column name") || e.message.includes("already exists")) {
      console.log("INFO: Column 'instagram' already exists in 'generus'.");
    } else {
      console.error("ERROR:", e.message);
    }
  }
  process.exit(0);
}
main().catch(console.error);
