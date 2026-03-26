import { db } from "../lib/db";
import { generus } from "../lib/schema";
import { sql, like } from "drizzle-orm";

async function main() {
    console.log("Updating existing /uploads/ links to /api/images/...");
    // Update all 'foto' columns that start with /uploads/
    const results = await db.update(generus)
        .set({ 
            foto: sql`REPLACE(foto, '/uploads/', '/api/images/')`
        })
        .where(like(generus.foto, '/uploads/%'));
        
    console.log("Update completed.");
}

main().catch(console.error);
