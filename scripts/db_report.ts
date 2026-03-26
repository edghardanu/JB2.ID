import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function makeReport() {
  const tables = ["desa", "kelompok", "users", "generus", "kegiatan", "absensi", "artikel"];
  let report = "# Database Overview (local.db)\n\n";
  
  for (const table of tables) {
    try {
      const result = await client.execute(`SELECT * FROM ${table}`);
      report += `## Table: ${table}\n`;
      report += `Total rows: ${result.rows.length}\n\n`;
      if (result.rows.length > 0) {
        report += "```json\n" + JSON.stringify(result.rows, null, 2) + "\n```\n\n";
      } else {
        report += "*No data*\n\n";
      }
    } catch (e) {
      report += `## Table: ${table}\nError querying table.\n\n`;
    }
  }
  
  const fs = require('fs');
  fs.writeFileSync('db_report.md', report);
}

makeReport();
