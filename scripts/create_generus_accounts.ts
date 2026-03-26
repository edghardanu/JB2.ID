import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from "@libsql/client";
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function run() {
  try {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    console.log("Mulai sinkronisasi akun (Raw SQL)...");
    
    // Fetch all generus
    const generusRS = await client.execute("SELECT id, nama, nomor_unik, desa_id, kelompok_id FROM generus");
    console.log(`Ditemukan ${generusRS.rows.length} data generus.`);

    // Fetch existing users
    const usersRS = await client.execute("SELECT email, generus_id FROM users");
    console.log(`Ditemukan ${usersRS.rows.length} user yang sudah ada.`);
    
    const linkedGenerusIds = new Set(usersRS.rows.filter(u => u.generus_id).map(u => u.generus_id as string));
    const usedEmails = new Set(usersRS.rows.map(u => String(u.email).toLowerCase()));

    const passwordHash = await bcrypt.hash('generusjb2', 12);
    let created = 0;

    for (const g of generusRS.rows) {
      if (linkedGenerusIds.has(g.id as string)) continue;

      const rawName = (g.nama as string) || "User";
      const names = rawName.trim().split(/\s+/);
      const firstName = names[0].toLowerCase().replace(/[^a-z0-9]/g, '') || "user";
      let email = `${firstName}@jb2.id`;

      if (usedEmails.has(email)) {
        const suffix = String(g.nomor_unik).toLowerCase().replace(/[^a-z0-9]/g, '').slice(-4);
        email = `${firstName}.${suffix}@jb2.id`;
      }
      
      let attempt = 1;
      while (usedEmails.has(email)) {
        email = `${firstName}${attempt}@jb2.id`;
        attempt++;
      }

      await client.execute({
        sql: "INSERT INTO users (id, name, email, password_hash, role, desa_id, kelompok_id, generus_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        args: [
          uuidv4(),
          rawName,
          email,
          passwordHash,
          'generus',
          g.desa_id,
          g.kelompok_id,
          g.id
        ]
      });

      usedEmails.add(email);
      created++;
      if (created % 10 === 0) console.log(`Progres: ${created} akun baru dibuat...`);
    }

    console.log(`------------------------------`);
    console.log(`TOTAL AKUN DIBUAT: ${created}`);
    console.log(`Email default: [namadepan]@jb2.id`);
    console.log(`Password: generusjb2`);
    console.log(`Role: Generus`);
    process.exit(0);

  } catch (error: any) {
    console.error("CRITICAL ERROR:", error);
    process.exit(1);
  }
}

run();
