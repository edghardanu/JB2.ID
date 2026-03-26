import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generus, desa, kelompok } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

function generateNomorUnik() {
  const prefix = "GNR";
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${num}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      nama, tempatLahir, tanggalLahir, jenisKelamin, kategoriUsia, alamat, noTelp, 
      pendidikan, pekerjaan, statusNikah, desaId, kelompokId, 
      hobi, makananMinumanFavorit, suku, foto 
    } = body;

    if (!nama || !jenisKelamin || !kategoriUsia || !desaId) {
      return NextResponse.json({ error: "Nama dan Wilayah wajib diisi" }, { status: 400 });
    }

    // Duplicate Check
    const duplicate = await db.query.generus.findFirst({
        where: and(
            eq(generus.nama, nama),
            tanggalLahir ? eq(generus.tanggalLahir, tanggalLahir) : undefined
        )
    });
    if (duplicate) {
        return NextResponse.json({ error: "Data generus ini sudah terdaftar sebelumnya" }, { status: 400 });
    }

    let nomorUnik = generateNomorUnik();
    while (await db.query.generus.findFirst({ where: eq(generus.nomorUnik, nomorUnik) })) {
      nomorUnik = generateNomorUnik();
    }

    const id = uuidv4();
    await db.insert(generus).values({
      id,
      nomorUnik,
      nama,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      kategoriUsia,
      alamat,
      noTelp,
      pendidikan,
      pekerjaan,
      statusNikah: statusNikah || "Belum Menikah",
      desaId: Number(desaId),
      kelompokId: kelompokId ? Number(kelompokId) : null,
      hobi,
      makananMinumanFavorit,
      suku,
      foto,
      createdBy: "PUBLIC_REGISTRATION",
    });

    return NextResponse.json({ success: true, id, nomorUnik });
  } catch (error: any) {
    console.error("Public Generus Registration error:", error);
    return NextResponse.json({ error: "Gagal memproses pendaftaran" }, { status: 500 });
  }
}
