const { createClient } = require("@libsql/client");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  const res = await client.execute("SELECT DISTINCT status FROM artikel");
  console.log("Statuses:", res.rows.map(r => r.status));
  process.exit(0);
}
main().catch(console.error);
