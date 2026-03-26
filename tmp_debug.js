require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');
console.log("Menghubungkan ke Turso...");
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    console.log("Menjalankan query...");
    const genRes = await client.execute('SELECT count(*) as cnt FROM generus');
    console.log(`Ditemukan ${genRes.rows[0].cnt} generus.`);
  } catch (err) {
    console.error("EROR:", err);
  } finally {
    process.exit(0);
  }
}
run();
