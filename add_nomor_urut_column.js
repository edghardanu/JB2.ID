const { createClient } = require("@libsql/client");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log("Adding 'nomor_urut' column to 'mandiri' table...");
  try {
    await client.execute("ALTER TABLE mandiri ADD COLUMN nomor_urut INTEGER");
    console.log("SUCCESS: Column 'nomor_urut' added to 'mandiri'.");
  } catch (e) {
    if (e.message.includes("duplicate column name") || e.message.includes("already exists")) {
      console.log("INFO: Column 'nomor_urut' already exists in 'mandiri'.");
    } else {
      console.error("ERROR:", e.message);
    }
  }
  process.exit(0);
}
main().catch(console.error);
