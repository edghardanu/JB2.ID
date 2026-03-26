import { db } from "../lib/db";
import { generus } from "../lib/schema";
import { eq } from "drizzle-orm";

async function main() {
    const id = process.argv[2];
    if (!id) return console.log("Usage: npx tsx scripts/test_update.ts <id>");
    
    console.log("Testing update for ID:", id);
    const testUrl = "/uploads/test.jpg";
    await db.update(generus).set({ foto: testUrl }).where(eq(generus.id, id));
    
    const res = await db.select({ foto: generus.foto }).from(generus).where(eq(generus.id, id));
    console.log("Result in DB:", res);
}

main().catch(console.error);
