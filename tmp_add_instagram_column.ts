import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { client } from "./lib/db";

async function addColumn() {
  try {
    await client.execute("ALTER TABLE generus ADD COLUMN instagram TEXT");
    console.log("Column 'instagram' added to 'generus' table.");
  } catch (error) {
    console.error("Error adding column:", error);
  }
}

addColumn().catch(console.error);
