import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  const res = await client.execute("SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name='users'");
  res.rows.forEach(r => console.log(r.sql));
}

main().catch(console.error);
