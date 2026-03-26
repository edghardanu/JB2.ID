import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { client } from "./lib/db";

async function checkSchema() {
  const result = await client.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
  console.log(result.rows[0].sql);
}

checkSchema().catch(console.error);
