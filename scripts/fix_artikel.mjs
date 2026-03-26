import { createClient } from "@libsql/client";

const client = createClient({ url: 'file:local.db' });

async function run() {
  const schema = await client.execute("SELECT name, sql, type FROM sqlite_master WHERE sql LIKE '%users_old%'");
  
  if (schema.rows.length === 0) {
    console.log("No tables or triggers reference users_old!");
    return;
  }
  
  for (const row of schema.rows) {
    console.log(`Found users_old in ${row.type} ${row.name}`);
    if (row.type === "trigger") {
      console.log(`Dropping trigger ${row.name}`);
      await client.execute(`DROP TRIGGER ${row.name}`);
    } else if (row.type === "table") {
      const sql = row.sql;
      const newSchema = sql.replace(/users_old/g, "users").replace(`CREATE TABLE \`${row.name}\``, `CREATE TABLE \`${row.name}_new\``).replace(`CREATE TABLE ${row.name}`, `CREATE TABLE ${row.name}_new`);
      
      console.log(`Recreating table ${row.name}...`);
      await client.execute('PRAGMA foreign_keys=OFF;');
      await client.execute(newSchema);
      await client.execute(`INSERT INTO \`${row.name}_new\` SELECT * FROM \`${row.name}\``);
      await client.execute(`DROP TABLE \`${row.name}\``);
      await client.execute(`ALTER TABLE \`${row.name}_new\` RENAME TO \`${row.name}\``);
      await client.execute('PRAGMA foreign_keys=ON;');
      console.log(`Fixed table ${row.name}`);
    }
  }
}

run().catch(console.error);
