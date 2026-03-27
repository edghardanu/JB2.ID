import { db } from "../lib/db";
import { users } from "../lib/schema";
import { eq } from "drizzle-orm";

async function run() {
  const admins = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role
  }).from(users).where(eq(users.role, "admin"));
  console.log("ADMINS:", JSON.stringify(admins, null, 2));
}
run();
