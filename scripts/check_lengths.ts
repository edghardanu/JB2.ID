import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from "@libsql/client";

async function test() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    console.log('Querying lengths...');
    try {
        const rs = await client.execute("SELECT LENGTH(nomor_unik) as len, nomor_unik FROM generus LIMIT 10");
        console.log('Lengths:', rs.rows.map(r => r.len));
        console.log('Values:', rs.rows.map(r => r.nomor_unik));
    } catch (err) {
        console.error('Raw Error:', err);
    }
    process.exit(0);
}
test();
