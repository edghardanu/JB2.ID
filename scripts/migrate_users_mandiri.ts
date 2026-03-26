import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  console.log("Migrating users schema for mandiri isolation...");
  
  try {
    await client.execute("ALTER TABLE users ADD COLUMN mandiri_desa_id INTEGER REFERENCES mandiri_desa(id) ON DELETE SET NULL");
  } catch (e) {
    console.log("Column mandiri_desa_id might already exist in users table");
  }

  try {
    await client.execute("ALTER TABLE users ADD COLUMN mandiri_kelompok_id INTEGER REFERENCES mandiri_kelompok(id) ON DELETE SET NULL");
  } catch (e) {
    console.log("Column mandiri_kelompok_id might already exist in users table");
  }

  console.log("Migration complete!");
}

main().catch(console.error);
