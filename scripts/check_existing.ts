import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from "@libsql/client";

async function test() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    console.log('Querying existing accounts info...');
    try {
        const rs = await client.execute("SELECT u.email, u.role, g.nama FROM users u JOIN generus g ON u.generus_id = g.id LIMIT 5");
        console.log('Existing Accounts Examples:', rs.rows);
    } catch (err) {
        console.error('Raw Error:', err);
    }
    process.exit(0);
}
test();
