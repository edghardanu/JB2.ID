import { db } from "../lib/db";
import { users } from "../lib/schema";

async function run() {
  const all = await db.select({
      email: users.email,
      role: users.role,
      name: users.name
  }).from(users);
  console.log(JSON.stringify(all, null, 2));
}
run();
