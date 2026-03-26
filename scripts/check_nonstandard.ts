import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from "@libsql/client";

async function test() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    console.log('Querying non-standard accounts info...');
    try {
        const rs = await client.execute("SELECT u.email, u.role, g.nama FROM users u JOIN generus g ON u.generus_id = g.id WHERE u.role != 'generus'");
        console.log('Non-standard roles:', rs.rows.length);
        console.log('Non-standard examples:', rs.rows.slice(0, 5));
    } catch (err) {
        console.error('Raw Error:', err);
    }
    process.exit(0);
}
test();
