import { db } from "../lib/db";
import { users } from "../lib/schema";

async function run() {
  const all = await db.select().from(users).limit(20);
  console.log(JSON.stringify(all, null, 2));
}
run();
