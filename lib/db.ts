import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN || "";

const client = createClient({
  url,
  authToken,
});

if (process.env.TURSO_DATABASE_URL) {
  console.log("DB_CLIENT_CONNECTING_TO:", process.env.TURSO_DATABASE_URL.substring(0, 20) + "...");
} else {
  console.log("DB_CLIENT: TURSO_DATABASE_URL is missing, using local fallback (normal during build time)");
}

export const db = drizzle(client, { schema });
export { client };
