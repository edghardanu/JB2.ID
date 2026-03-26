const { createClient } = require("@libsql/client");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  const res = await client.execute("PRAGMA table_info(artikel)");
  console.log(JSON.stringify(res.rows.map(r => r.name)));
  process.exit(0);
}
main().catch(console.error);
