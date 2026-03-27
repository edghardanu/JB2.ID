import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load .env.local explicitly since it's common in Next.js
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
    console.error("TURSO_DATABASE_URL is not set in environment.");
    process.exit(1);
}

const client = createClient({ url, authToken });

async function migrate() {
    console.log(`Connecting to: ${url}`);
    
    try {
        // 1. Add column
        try {
            await client.execute("ALTER TABLE generus ADD COLUMN is_generus INTEGER DEFAULT 0");
            console.log("Column is_generus added successfully.");
        } catch (e) {
            console.log("ALTER TABLE error (might already exist):", e.message);
        }

        // 2. Population: Set for everyone already existing.
        await client.execute("UPDATE generus SET is_generus = 1");
        console.log("Existing data updated with is_generus = 1.");

        console.log("Migration finished.");
    } catch (err) {
        console.error("Migration fatal error:", err);
    }
}

migrate();
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
delay(3000).then(() => process.exit(0));
