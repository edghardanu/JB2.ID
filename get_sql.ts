import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "./lib/db";
import { sql } from "drizzle-orm";

async function main() {
  const usersSql = await db.run(sql`SELECT sql FROM sqlite_master WHERE name = 'users'`);
  const usersOldSql = await db.run(sql`SELECT sql FROM sqlite_master WHERE name = 'users_old'`);
  const out = `USERS: ${usersSql.rows[0].sql}\n\nUSERS_OLD: ${usersOldSql.rows[0].sql}\n`;
  fs.writeFileSync("db_sql.txt", out);
  console.log("Done");
}

main();
