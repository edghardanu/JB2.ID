import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from "@libsql/client";

async function test() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    console.log('Querying info users...');
    try {
        const rs = await client.execute("PRAGMA table_info(users)");
        console.log('Columns users:', rs.rows.map(r => r.name));
    } catch (err) {
        console.error('Raw Error:', err);
    }
    process.exit(0);
}
test();
