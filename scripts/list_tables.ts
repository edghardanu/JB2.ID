import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function run() {
  const tables = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table'`);
  console.log(JSON.stringify(tables, null, 2));
}
run();
