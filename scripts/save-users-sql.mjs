import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  const r = await client.execute("SELECT sql FROM sqlite_master WHERE name = 'users'");
  fs.writeFileSync("users_sql.txt", r.rows[0].sql as string);
  console.log("SQL saved to users_sql.txt");
  process.exit(0);
}

run().catch(console.error);
