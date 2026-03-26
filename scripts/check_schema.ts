import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  try {
    const res = await client.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='generus'");
    console.log(res.rows[0].sql);
  } catch (e) {
    console.error(e);
  } finally {
    client.close();
  }
}

main();
