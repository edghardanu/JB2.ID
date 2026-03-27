import { db } from "../lib/db";
import { users } from "../lib/schema";
import { eq } from "drizzle-orm";

const args = process.argv.slice(2);
const email = args[0];
const newRole = args[1];

async function run() {
  if (!email) {
    console.log("Usage: npx tsx scripts/reset_password.ts <email> [newRole]");
    process.exit(1);
  }

  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  const user = result[0];

  if (!user) {
    console.log(`User ${email} not found.`);
    process.exit(1);
  }

  const data: any = {};
  if (newRole) data.role = newRole;

  if (Object.keys(data).length > 0) {
    await db.update(users).set(data).where(eq(users.id, user.id));
    if (newRole) console.log(`Role for ${email} updated to: ${newRole}`);
  } else {
    console.log(`User ${email} found, no changes requested.`);
  }
}
run();
