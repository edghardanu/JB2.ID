const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve('local.db');
const db = new sqlite3.Database(dbPath);

console.log("Ensuring Matchmaking Tables Exist...");

db.serialize(() => {
    // 1. Antrean
    db.run(`CREATE TABLE IF NOT EXISTS mandiri_antrean (
        id TEXT PRIMARY KEY,
        generus_id TEXT NOT NULL,
        status TEXT DEFAULT 'Menunggu',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => { if (err) console.error("Antrean Table Error:", err.message); else console.log("Antrean Table Ready."); });

    // 2. Pemilihan
    db.run(`CREATE TABLE IF NOT EXISTS mandiri_pemilihan (
        id TEXT PRIMARY KEY,
        pengirim_id TEXT NOT NULL,
        penerima_id TEXT NOT NULL,
        status TEXT DEFAULT 'Menunggu',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => { if (err) console.error("Pemilihan Table Error:", err.message); else console.log("Pemilihan Table Ready."); });

    // 3. Kuisioner
    db.run(`CREATE TABLE IF NOT EXISTS mandiri_kuisioner (
        id TEXT PRIMARY KEY,
        pemilihan_id TEXT,
        pengisi_id TEXT NOT NULL,
        nama_pnkb TEXT,
        no_hp_pnkb TEXT,
        tanggapan TEXT,
        rekomendasi TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => { if (err) console.error("Kuisioner Table Error:", err.message); else console.log("Kuisioner Table Ready."); });
});

db.close();
