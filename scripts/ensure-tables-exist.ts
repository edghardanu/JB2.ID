require('dotenv').config({ path: '.env.local' });
const { client } = require('../lib/db');

async function ensureTables() {
    console.log("Ensuring Matchmaking Tables Exist...");
    try {
        console.log("Using URL:", process.env.TURSO_DATABASE_URL);
        
        console.log("1. Checking Antrean table...");
        await client.execute(`
            CREATE TABLE IF NOT EXISTS mandiri_antrean (
                id TEXT PRIMARY KEY,
                generus_id TEXT NOT NULL,
                status TEXT DEFAULT 'Menunggu',
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("   --- Antrean table ready.");

        console.log("2. Checking Pemilihan table...");
        await client.execute(`
            CREATE TABLE IF NOT EXISTS mandiri_pemilihan (
                id TEXT PRIMARY KEY,
                pengirim_id TEXT NOT NULL,
                penerima_id TEXT NOT NULL,
                status TEXT DEFAULT 'Menunggu',
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("   --- Pemilihan table ready.");

        console.log("3. Checking Kuisioner table...");
        await client.execute(`
            CREATE TABLE IF NOT EXISTS mandiri_kuisioner (
                id TEXT PRIMARY KEY,
                pemilihan_id TEXT,
                pengisi_id TEXT NOT NULL,
                nama_pnkb TEXT,
                no_hp_pnkb TEXT,
                tanggapan TEXT,
                rekomendasi TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
        console.log("   --- Kuisioner table ready.");
        
        console.log("Initialization success!");
    } catch (error) {
        console.error("Initialization failed:", error);
    }
}

ensureTables().catch(console.error);
