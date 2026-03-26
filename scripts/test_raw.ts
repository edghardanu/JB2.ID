import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from "@libsql/client";

async function test() {
    console.log('Connecting to client...');
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    console.log('Executing query...');
    try {
        const rs = await client.execute("SELECT COUNT(*) FROM generus");
        console.log('Count RSS:', rs.rows[0][0]);
    } catch (err) {
        console.error('Raw Error:', err);
    }
    process.exit(0);
}
test();
