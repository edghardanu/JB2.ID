import fs from "fs";
import { db } from "./lib/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
      const usersSql = await db.run(sql`SELECT sql FROM sqlite_master WHERE name = 'users'`);
      const usersOldSql = await db.run(sql`SELECT sql FROM sqlite_master WHERE name = 'users_old'`);
      const out = `USERS: ${usersSql.rows[0].sql}\n\nUSERS_OLD: ${usersOldSql.rows[0].sql}\n`;
      fs.writeFileSync("c:\\Users\\ASUS\\OneDrive\\Documents\\Xampp1\\htdocs\\JB2.ID\\db_sql.txt", out);
      console.log("Done");
  } catch (err) {
      console.error(err);
  }
}

main();
