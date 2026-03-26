import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  const res = await client.execute("SELECT name, sql FROM sqlite_master WHERE sql LIKE '%generus_old%'");
  console.log(res.rows.map(r => r.name + ":\n" + r.sql).join("\n\n"));
}
main().catch(console.error);
