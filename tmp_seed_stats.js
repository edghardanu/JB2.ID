const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function seed() {
  try {
    // Create table if it doesn't exist (Drizzle might not have pushed it yet)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS visitor_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        country_code TEXT NOT NULL UNIQUE,
        country_name TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    const countries = [
      { code: 'ID', name: 'Indonesia', count: 1250 },
      { code: 'MY', name: 'Malaysia', count: 420 },
      { code: 'SG', name: 'Singapore', count: 310 },
      { code: 'US', name: 'United States', count: 150 },
      { code: 'AU', name: 'Australia', count: 90 },
      { code: 'JP', name: 'Japan', count: 75 },
    ];

    for (const c of countries) {
      await client.execute({
        sql: "INSERT OR IGNORE INTO visitor_stats (country_code, country_name, count) VALUES (?, ?, ?)",
        args: [c.code, c.name, c.count]
      });
      // Also update counts if they already exist
      await client.execute({
        sql: "UPDATE visitor_stats SET count = count + ? WHERE country_code = ?",
        args: [Math.floor(Math.random() * 50), c.code]
      });
    }
    console.log("Seeding visitor stats complete!");
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    process.exit(0);
  }
}

seed();
