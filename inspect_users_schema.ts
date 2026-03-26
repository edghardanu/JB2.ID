import { config } from "dotenv";
config({ path: ".env.local" });
import { client } from "./lib/db";

async function main() {
  const res = await client.execute("SELECT sql FROM sqlite_master WHERE name='users'");
  if (res.rows.length > 0) {
    console.log(res.rows[0].sql);
  } else {
    console.log("Table 'users' not found.");
  }
}

main().catch(console.error);
