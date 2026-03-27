import { db } from "./lib/db";
import { generus, mandiri } from "./lib/schema";
import { eq, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";

async function migrate() {
    console.log("Starting migration: Adding is_generus column...");
    
    try {
        // 1. Add column if it doesn't exist (Drizzle might have issues with raw SQLite alter in some environments)
        // Check if the column exists by trying to select it
        try {
            await db.run(sql`ALTER TABLE generus ADD COLUMN is_generus INTEGER DEFAULT 0`);
            console.log("Column is_generus added.");
        } catch (e) {
            console.log("Column is_generus might already exist, skipping alter.");
        }

        // 2. Set is_generus = 1 for existing data that should be in the Generus list.
        // Rule: If they was created by FORM_GENERUS or they are NOT in Mandiri, they should definitely be in Generus list.
        // For others, let's just make everyone existing visible in Generus for now to avoid data loss.
        await db.run(sql`UPDATE generus SET is_generus = 1`);
        
        console.log("Migration completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    }
}

migrate().then(() => process.exit(0));
