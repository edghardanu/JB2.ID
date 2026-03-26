import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from "@libsql/client";

async function test() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    console.log('Querying all nomor_unik (112)...');
    try {
        const rs = await client.execute("SELECT nomor_unik FROM generus");
        console.log('Success! Got:', rs.rows.length);
    } catch (err) {
        console.error('Raw Error:', err);
    }
    process.exit(0);
}
test();
