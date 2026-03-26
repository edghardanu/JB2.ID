import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });

async function run() {
  const master = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
  for (const table of master.rows.map(r => r.name)) {
    const fks = await client.execute(`PRAGMA foreign_key_list('${table}')`);
    for (const fk of fks.rows) {
      if (fk.table === "users_old") {
         console.log(`BINGO! Table ${table} still points to users_old.`);
         // Fix it...
      }
    }
  }
  console.log("Validation complete.");
}
run();
