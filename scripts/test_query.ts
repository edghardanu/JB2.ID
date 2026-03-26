import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    console.log('Loading modules...');
    const { db } = await import('../lib/db');
    const { generus } = await import('../lib/schema');
    console.log('Testing query...');
    try {
        const result = await db.select().from(generus).all();
        console.log('Result length:', result.length);
    } catch (err) {
        console.error('Error:', err);
    }
    process.exit(0);
}
test();
