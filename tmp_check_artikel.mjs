import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log("Checking artikel table structure...");
  try {
    const res = await client.execute("PRAGMA table_info(artikel)");
    console.table(res.rows);
    
    const master = await client.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='artikel'");
    console.log("\nTable Definition:");
    console.log(master.rows[0]?.sql || "Table NOT FOUND");
    
  } catch (e) {
    console.error("Error executing query:", e);
  } finally {
    process.exit(0);
  }
}
main().catch(console.error);
