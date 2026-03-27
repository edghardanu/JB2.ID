import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function check() {
    try {
        const res = await client.execute("SELECT is_generus FROM generus LIMIT 1");
        console.log("Verification Success: Column is_generus exists and is accessible.");
        console.log("Sample Data:", res.rows[0]);
    } catch (err) {
        console.error("Verification Failed:", err.message);
    }
}

check().then(() => process.exit(0));
