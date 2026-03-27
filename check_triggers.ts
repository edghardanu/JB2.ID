import { db } from "./lib/db";
import { sql } from "drizzle-orm";
import fs from "fs";

async function main() {
    const triggers = await db.run(sql`SELECT name, tbl_name, sql FROM sqlite_master WHERE type='trigger'`);
    fs.writeFileSync("db_triggers.json", JSON.stringify(triggers, null, 2));
    
    // Also fetch the constraint list from pragma if possible
    const check = await db.run(sql`PRAGMA table_info(users_old)`);
    fs.writeFileSync("db_info.json", JSON.stringify(check, null, 2));
}
main();
