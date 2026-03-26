import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Adding 'foto' column if it doesn't exist...");
    try {
        await db.run(sql`ALTER TABLE generus ADD COLUMN foto TEXT`);
        console.log("Column 'foto' added successfully.");
    } catch (e: any) {
        if (e.message.includes("duplicate column name")) {
            console.log("Column 'foto' already exists.");
        } else {
            console.error("Error adding column:", e.message);
        }
    }
}

main().catch(console.error);
