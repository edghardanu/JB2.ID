import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from "@libsql/client";

async function test() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    console.log('Executing query SELECT OFFSET 50...');
    try {
        const rs = await client.execute("SELECT id, nama FROM generus LIMIT 50 OFFSET 50");
        console.log('Success! Got:', rs.rows.length);
    } catch (err) {
        console.error('Raw Error:', err);
    }
    process.exit(0);
}
test();
