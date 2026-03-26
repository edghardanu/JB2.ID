import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const client = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

async function addCols() {
  console.log("Adding columns...");
  try {
    await client.execute("ALTER TABLE generus ADD COLUMN hobi TEXT;");
    console.log("Added hobi");
  } catch(e) { console.log(e); }
  
  try {
    await client.execute("ALTER TABLE generus ADD COLUMN makanan_minuman_favorit TEXT;");
    console.log("Added makanan_minuman_favorit");
  } catch(e) { console.log(e); }
  
  process.exit(0);
}

addCols();
