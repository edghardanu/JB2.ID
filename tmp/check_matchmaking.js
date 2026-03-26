const { db } = require('./lib/db');
const { users, generus, mandiri, mandiriAntrean, mandiriPemilihan } = require('./lib/schema');
const { eq } = require('drizzle-orm');

async function check() {
    try {
        console.log("--- DB STATUS ---");
        const u = await db.select().from(users).limit(3);
        console.log("Users:", u.length);
        const g = await db.select().from(generus).limit(3);
        console.log("Generus:", g.length);
        const a = await db.select().from(mandiriAntrean).limit(3);
        console.log("Antrean:", a.length);
        const p = await db.select().from(mandiriPemilihan).limit(3);
        console.log("Pemilihan:", p.length);
    } catch (e) {
        console.error("Error:", e.message);
    }
}
check();
