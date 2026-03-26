import { db } from './lib/db';
import { generus, users } from './lib/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  try {
    const allGen = await db.select().from(generus).all();
    const allUsr = await db.select().from(users).all();
    console.log(`Generus: ${allGen.length}`);
    console.log(`Total Users: ${allUsr.length}`);
    console.log(`Users with role generus: ${allUsr.filter(u => u.role === 'generus').length}`);
  } catch (err: any) {
    console.error("ERROR:", err.message);
  }
}
run();
