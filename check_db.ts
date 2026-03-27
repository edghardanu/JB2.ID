import { db } from "./lib/db";
import { sql } from "drizzle-orm";

async function main() {
  const res = await db.run(sql`SELECT sql FROM sqlite_master WHERE name = 'users_old'`);
  console.log(JSON.stringify(res, null, 2));
}

main();
