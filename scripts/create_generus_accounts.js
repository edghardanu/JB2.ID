const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    console.log("Mulai Sinkronisasi Akun Generus (Full Update)...");
    
    // 1. Fetch all generus
    let allGen = [];
    let offset = 0;
    while(true) {
        const res = await client.execute({
            sql: "SELECT id, nama, nomor_unik, desa_id, kelompok_id FROM generus LIMIT 50 OFFSET ?",
            args: [offset]
        });
        if (res.rows.length === 0) break;
        allGen = allGen.concat(res.rows);
        offset += 50;
        if (res.rows.length < 50) break;
    }
    console.log(`Ditemukan ${allGen.length} data generus.`);

    // 2. Fetch all users linked to generus
    const userRes = await client.execute('SELECT id, email, generus_id FROM users');
    const existingUsers = new Map();
    const usedEmails = new Set();
    userRes.rows.forEach(r => {
        if (r.generus_id) existingUsers.set(String(r.generus_id), r);
        usedEmails.add(String(r.email).toLowerCase());
    });

    const passHash = await bcrypt.hash('generusjb2', 12);
    let created = 0;
    let updated = 0;

    for (const gen of allGen) {
      const gId = String(gen.id);
      const rawName = String(gen.nama).trim();
      const names = rawName.split(/\s+/);
      const firstName = names[0].toLowerCase().replace(/[^a-z0-9]/g, '') || "user";
      
      const user = existingUsers.get(gId);

      if (user) {
        // Update password & ensure role
        await client.execute({
            sql: "UPDATE users SET password_hash = ?, role = 'generus' WHERE id = ?",
            args: [passHash, user.id]
        });
        updated++;
        if (updated % 10 === 0) console.log(`Diupdate: ${updated} akun.`);
      } else {
        // Create new
        let email = `${firstName}@jb2.id`;
        if (usedEmails.has(email)) {
            const suffix = String(gen.nomor_unik).toLowerCase().replace(/[^a-z0-9]/g, '').slice(-4);
            email = `${firstName}.${suffix}@jb2.id`;
        }
        let attempt = 1;
        while (usedEmails.has(email)) {
            email = `${firstName}${attempt}@jb2.id`;
            attempt++;
        }

        await client.execute({
            sql: `INSERT INTO users (id, name, email, password_hash, role, desa_id, kelompok_id, generus_id) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [uuidv4(), rawName, email, passHash, 'generus', gen.desa_id, gen.kelompok_id, gen.id]
        });
        usedEmails.add(email);
        created++;
        console.log(`Dibuat: ${rawName} -> ${email}`);
      }
    }

    console.log(`------------------------------`);
    console.log(`STATUS AKHIR:`);
    console.log(`- Akun Baru Dibuat: ${created}`);
    console.log(`- Akun Lama Diupdate (Password & Role): ${updated}`);
    console.log(`- Total Akun Generus Sekarang: ${created + updated}`);
    console.log(`Password Default: generusjb2`);
    console.log(`Role: Generus`);
    console.log(`------------------------------`);
  } catch (err) {
    console.error("ERROR SINKRONISASI:", err);
  } finally {
    process.exit(0);
  }
}
run();
