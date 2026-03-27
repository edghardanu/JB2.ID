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

async function migrate() {
    console.log("Adding missing table: mandiri_absensi...");
    
    try {
        await client.execute(`
            CREATE TABLE IF NOT EXISTS mandiri_absensi (
                id TEXT PRIMARY KEY,
                kegiatan_id TEXT NOT NULL REFERENCES mandiri_kegiatan(id),
                generus_id TEXT NOT NULL REFERENCES generus(id),
                timestamp TEXT DEFAULT (datetime('now')),
                keterangan TEXT DEFAULT 'hadir'
            )
        `);
        console.log("Table mandiri_absensi created successfully.");

        // Indices
        try {
            await client.execute("CREATE INDEX IF NOT EXISTS mandiri_absensi_kegiatan_id_idx ON mandiri_absensi(kegiatan_id)");
            await client.execute("CREATE INDEX IF NOT EXISTS mandiri_absensi_generus_id_idx ON mandiri_absensi(generus_id)");
            console.log("Indexes created successfully.");
        } catch (e) {
            console.log("Index creation note:", e.message);
        }

    } catch (err) {
        console.error("Migration fatal error:", err.message);
    }
}

migrate().then(() => process.exit(0));
