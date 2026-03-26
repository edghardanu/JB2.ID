import { db } from "../lib/db";
import { generus } from "../lib/schema";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Checking columns in generus table...");
    const res = await db.select({
        hobi: generus.hobi,
        makananMinumanFavorit: generus.makananMinumanFavorit
    }).from(generus).limit(1);
    console.log("DB Sample:", res);
}

main().catch(console.error);
