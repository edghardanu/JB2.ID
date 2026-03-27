import { db } from "./lib/db";
import { sql } from "drizzle-orm";
import fs from "fs";

async function main() {
    const res = await db.run(sql`SELECT sql FROM sqlite_master WHERE type='table' AND (name='users' OR name='users_old')`);
    fs.writeFileSync("db_detailed.json", JSON.stringify(res, null, 2));
}
main();
