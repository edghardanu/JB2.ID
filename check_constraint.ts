import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function run() {
  const result = await client.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
  const sql = result.rows[0].sql as string;
  const match = sql.match(/CHECK\s*\(role\s*IN\s*\([^)]+\)\)/i);
  console.log("CHECK constraint found:", match?.[0]);
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
