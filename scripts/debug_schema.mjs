import { createClient } from "@libsql/client";

const client = createClient({ url: 'file:local.db' });

async function run() {
  const table = "artikel";
  const master = await client.execute(`SELECT sql FROM sqlite_master WHERE name='${table}'`);
  console.log(`SCHEMA for ${table}:\n`, master.rows[0].sql);
  
  const fk = await client.execute(`PRAGMA foreign_key_list('${table}')`);
  console.log(`FK LIST for ${table}:\n`, JSON.stringify(fk.rows, null, 2));
}

run().catch(console.error);
