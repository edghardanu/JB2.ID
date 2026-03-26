import "dotenv/config";
import { client } from "../lib/db";

async function listData() {
    try {
        console.log("Checking data in database:", process.env.TURSO_DATABASE_URL);
        
        const desas = await client.execute("SELECT * FROM desa LIMIT 5;");
        console.log("Desa IDs:", desas.rows.map(r => r.id));
        
        const kelompoks = await client.execute("SELECT * FROM kelompok LIMIT 5;");
        console.log("Kelompok IDs:", kelompoks.rows.map(r => r.id));
        
    } catch (error) {
        console.error("Failed to list data:", error);
    }
}

listData().catch(console.error);
