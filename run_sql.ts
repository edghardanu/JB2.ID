import { db } from "./lib/db"
import { sql } from "drizzle-orm"

async function run() {
  const res = await db.run(sql`SELECT name, sql, type FROM sqlite_master`);
  console.log(res);
}

run().catch(console.error);
