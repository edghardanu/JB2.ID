import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client);

async function check() {
  const data = await db.all( { sql: "SELECT * FROM settings" } );
  console.log("Current Settings:", JSON.stringify(data, null, 2));
}

check();
