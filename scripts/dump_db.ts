import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function dump() {
  const tables = ["desa", "kelompok", "users", "generus", "kegiatan", "absensi", "artikel"];
  
  console.log("-- Database Dump --\n");
  
  for (const table of tables) {
    try {
      const result = await client.execute(`SELECT * FROM ${table}`);
      console.log(`-- TABLE: ${table} (${result.rows.length} rows) --`);
      if (result.rows.length > 0) {
        console.log(JSON.stringify(result.rows, null, 2));
      } else {
        console.log("(No data)");
      }
      console.log("\n");
    } catch (e) {
      console.log(`-- TABLE: ${table} (Not found or error) --\n`);
    }
  }
}

dump();
