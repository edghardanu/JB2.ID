const { createClient } = require("@libsql/client");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

async function seedGenerus() {
  const client = createClient({
    url: "file:local.db",
  });

  try {
    console.log("Adding sample 'generus' data...");
    
    // 1. Get first desa and kelompok
    const desas = await client.execute("SELECT id FROM desa LIMIT 1");
    if (desas.rows.length === 0) {
        console.error("No desa found. Run npm run seed first.");
        return;
    }
    const desaId = desas.rows[0].id;
    
    const kelompokList = await client.execute("SELECT id FROM kelompok WHERE desa_id = " + desaId + " LIMIT 1");
    if (kelompokList.rows.length === 0) {
        console.error("No kelompok found.");
        return;
    }
    const kelompokId = kelompokList.rows[0].id;

    // 2. Create a generus
    const generusId = uuidv4();
    const nomorUnik = "G" + Date.now().toString().slice(-6);
    await client.execute({
        sql: "INSERT INTO generus (id, nomor_unik, nama, jenis_kelamin, kategori_usia, desa_id, kelompok_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [generusId, nomorUnik, "Generus Sample", "L", "Dewasa", desaId, kelompokId]
    });
    console.log("Created Generus:", generusId, "Unique No:", nomorUnik);

    // 3. Create a user account for this generus
    const userId = uuidv4();
    const email = "generus@test.com";
    const passwordHash = await bcrypt.hash("generus123", 12);
    
    await client.execute({
        sql: "INSERT INTO users (id, name, email, password_hash, role, desa_id, kelompok_id, generus_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        args: [userId, "Generus User", email, passwordHash, "generus", desaId, kelompokId, generusId]
    });
    console.log("Created User Account:", email, "Password: generus123");

  } catch (error) {
    console.error("Error seeding:", error);
  } finally {
    process.exit(0);
  }
}

seedGenerus();
