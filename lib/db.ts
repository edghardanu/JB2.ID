import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

console.log("DB_CLIENT_CONNECTING_TO:", process.env.TURSO_DATABASE_URL?.substring(0, 20) + "...");
export const db = drizzle(client, { schema });
export { client };
