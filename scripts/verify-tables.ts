import "dotenv/config";
import { client } from "../lib/db";

async function listTables() {
    try {
        console.log("Checking tables in database:", process.env.TURSO_DATABASE_URL);
        const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
        console.log("Tables found:", result.rows.map(r => r.name));
    } catch (error) {
        console.error("Failed to list tables:", error);
    }
}

listTables().catch(console.error);
