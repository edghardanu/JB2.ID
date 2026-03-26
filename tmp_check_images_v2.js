const { createClient } = require("@libsql/client");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  const res = await client.execute("SELECT id, judul, cover_image FROM artikel WHERE status IN ('published', 'approved') LIMIT 10");
  for (const row of res.rows) {
    console.log(`ID: ${row.id} | Judul: ${row.judul} | Cover: ${row.cover_image}`);
  }
  process.exit(0);
}
main().catch(console.error);
