require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    const gen = await client.execute('SELECT count(*) as cnt FROM generus');
    const usr = await client.execute("SELECT count(*) as cnt FROM users WHERE role = 'generus'");
    console.log(`Generus: ${gen.rows[0].cnt}`);
    console.log(`Users (generus): ${usr.rows[0].cnt}`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
