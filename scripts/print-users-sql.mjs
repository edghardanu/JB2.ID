import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  const r = await client.execute("SELECT sql FROM sqlite_master WHERE name = 'users'");
  console.log(r.rows[0].sql);
  process.exit(0);
}

run().catch(console.error);
