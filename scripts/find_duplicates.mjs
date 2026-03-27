import { createClient } from '@libsql/client';
import "dotenv/config";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log("Checking for duplicate Generus records...");
  
  // Find names that appear more than once
  const result = await client.execute(`
    SELECT nama, COUNT(*) as count 
    FROM generus 
    GROUP BY nama 
    HAVING count > 1
  `);

  if (result.rows.length === 0) {
    console.log("No duplicate names found.");
    return;
  }

  console.log(`Found ${result.rows.length} potential duplicates by name.`);

  for (const row of result.rows) {
    const name = row.nama;
    const details = await client.execute({
        sql: "SELECT g.id, g.nama, g.nomorUnik, m.id as mandiriId FROM generus g LEFT JOIN mandiri m ON g.id = m.generusId WHERE g.nama = ?",
        args: [name]
    });

    console.log(`\nName: ${name}`);
    for (const d of details.rows) {
        console.log(`  - ID: ${d.id}, NoUnik: ${d.nomorUnik}, Mandiri: ${d.mandiriId ? 'YES' : 'NO'}`);
    }
  }
}

main().catch(console.error);
