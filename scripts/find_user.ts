import { db } from "../lib/db";
import { users } from "../lib/schema";
import { like } from "drizzle-orm";

async function run() {
  const matching = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role
  }).from(users).where(like(users.name, "%Edgar%"));
  console.log("MATCHING:", JSON.stringify(matching, null, 2));
}
run();
