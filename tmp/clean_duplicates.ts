import { db } from "../lib/db";
import { generus } from "../lib/schema";
import { eq, and, sql } from "drizzle-orm";

async function cleanDuplicates() {
  console.log("Memulai pembersihan data duplikat...");

  // Identifikasi duplikat berdasarkan Nama, Desa, dan Kelompok
  const allGenerus = await db.select().from(generus);
  
  const seen = new Map<string, string>(); // Key: "nama|desaId|kelompokId", Value: firstId
  const toDelete: string[] = [];

  for (const item of allGenerus) {
    const key = `${item.nama.toLowerCase().trim()}|${item.desaId}|${item.kelompokId}`;
    
    if (seen.has(key)) {
      console.log(`Menemukan duplikat: ${item.nama} (ID: ${item.id})`);
      toDelete.push(item.id);
    } else {
      seen.set(key, item.id);
    }
  }

  if (toDelete.length === 0) {
    console.log("Tidak ditemukan data duplikat.");
    return;
  }

  console.log(`Menghapus ${toDelete.length} data duplikat...`);

  for (const id of toDelete) {
    try {
      await db.delete(generus).where(eq(generus.id, id));
    } catch (e) {
      console.error(`Gagal menghapus ID ${id}`);
    }
  }

  console.log("Pembersihan selesai.");
}

cleanDuplicates();
