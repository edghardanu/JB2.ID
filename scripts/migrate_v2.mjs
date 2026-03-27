import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const client = createClient({
    url: process.env.DATABASE_URL || "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN
});

async function migrate() {
    console.log("Starting migration (Plain JS): Adding is_generus column...");
    
    try {
        // 1. Add column
        try {
            await client.execute("ALTER TABLE generus ADD COLUMN is_generus INTEGER DEFAULT 0");
            console.log("Column is_generus added successfully.");
        } catch (e) {
            console.log("Column is_generus might already exist or error occurred:", e.message);
        }

        // 2. Population: Set for everyone already existing.
        // Isolation logic will apply to NEW registrations.
        await client.execute("UPDATE generus SET is_generus = 1");
        console.log("Existing data updated with is_generus = 1.");

        console.log("Migration finished.");
    } catch (err) {
        console.error("Migration fatal error:", err);
    } finally {
        // Libsql client might not have a close() or it is implicit
    }
}

migrate();
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
delay(2000).then(() => process.exit(0));
