export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generus, mandiri, settings, desa, kelompok, users } from "@/lib/schema";
import { eq, desc, and, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

function generateNomorUnik() {
  const prefix = "MND"; // Using MND prefix for public mandiri registration
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${num}`;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Check Deadline
    const deadlineSet = await db.select().from(settings).where(eq(settings.key, "mandiri_registration_deadline"));
    if (deadlineSet[0]?.value) {
      const deadlineDate = new Date(deadlineSet[0].value);
      if (new Date() > deadlineDate) {
        return NextResponse.json({ error: "Batas waktu pendaftaran telah berakhir (" + deadlineSet[0].value + ")" }, { status: 403 });
      }
    }

    const body = await request.json();
    const { 
        nama, jenisKelamin, kategoriUsia, tempatLahir, tanggalLahir, 
        alamat, noTelp, pendidikan, pekerjaan, statusNikah, 
        hobi, makananMinumanFavorit, suku, foto, 
        mandiriDesaId, mandiriKelompokId 
    } = body;

    if (!nama || !jenisKelamin || !kategoriUsia || !mandiriDesaId || !tempatLahir || !tanggalLahir || !noTelp || !pendidikan || !pekerjaan || !hobi || !makananMinumanFavorit) {
      return NextResponse.json({ error: "Mohon lengkapi semua data wajib (Nama, JK, Usia, Lahir, Kontak, Pendidikan, Kerja, Hobi, & Favorit)" }, { status: 400 });
    }

    // Duplicate Check
    const duplicateConditions = [];
    if (nama && tanggalLahir) {
        duplicateConditions.push(and(eq(generus.nama, nama), eq(generus.tanggalLahir, tanggalLahir)));
    }
    if (noTelp) {
        duplicateConditions.push(eq(generus.noTelp, noTelp));
    }

    const duplicate = duplicateConditions.length > 0 
        ? await db.query.generus.findFirst({ where: or(...duplicateConditions) })
        : null;

    if (duplicate) {
        return NextResponse.json({ 
            error: `Data dengan Nama "${nama}" atau Nomor HP "${noTelp}" sudah terdaftar sebelumnya. Silakan hubungi admin jika ini kesalahan.` 
        }, { status: 400 });
    }

    // Workaround for NOT NULL constraint on generus.desa_id and kelompok_id
    // We try to pick a valid kelompok and use its desa_id first
    const fkWorkaround = await db.select({ 
        kId: kelompok.id, 
        dId: kelompok.desaId 
    }).from(kelompok).limit(1);

    let defaultDesaId = null;
    let defaultKelompokId = null;

    if (fkWorkaround.length > 0) {
        defaultKelompokId = fkWorkaround[0].kId;
        defaultDesaId = fkWorkaround[0].dId;
    } else {
        // Fallback to first desa if no kelompok exists
        const firstDesa = await db.select({ id: desa.id }).from(desa).limit(1);
        defaultDesaId = firstDesa[0]?.id;
    }

    const firstUser = await db.select({ id: users.id }).from(users).limit(1);
    const systemUserId = firstUser[0]?.id || "public-registration";

    console.log("Inserting Generus with:", {
        defaultDesaId, defaultKelompokId, mandiriDesaId, mandiriKelompokId, systemUserId
    });

    let nomorUnik = generateNomorUnik();
    // Ensure unique
    let existing = await db.query.generus.findFirst({ where: eq(generus.nomorUnik, nomorUnik) });
    while (existing) {
      nomorUnik = generateNomorUnik();
      existing = await db.query.generus.findFirst({ where: eq(generus.nomorUnik, nomorUnik) });
    }

    const generusId = uuidv4();

    const generusData: any = {
      id: generusId,
      nomorUnik,
      nama,
      jenisKelamin,
      kategoriUsia,
      tempatLahir,
      tanggalLahir,
      alamat,
      noTelp,
      pendidikan,
      pekerjaan,
      statusNikah: statusNikah || "Belum Menikah",
      hobi,
      makananMinumanFavorit,
      suku,
      foto,
      desaId: defaultDesaId,
      kelompokId: defaultKelompokId,
      mandiriDesaId: mandiriDesaId ? Number(mandiriDesaId) : null,
      mandiriKelompokId: mandiriKelompokId ? Number(mandiriKelompokId) : null,
      createdBy: systemUserId
    };

    console.log("FINAL INSERT GENERUS PK CHECK:", {
        desaId: generusData.desaId,
        kelompokId: generusData.kelompokId,
        mandiriDesaId: generusData.mandiriDesaId,
        mandiriKelompokId: generusData.mandiriKelompokId
    });

    try {
        await db.insert(generus).values(generusData);
    } catch (insertError: any) {
        console.error("GENERUS INSERT FAILED:", insertError.message);
        throw insertError;
    }

    // Insert into mandiri table
    await db.insert(mandiri).values({
      id: uuidv4(),
      generusId,
      statusMandiri: "Aktif",
      catatan: "Pendaftaran mandiri (Public)"
    });

    return NextResponse.json({ success: true, generusId, nomorUnik });
  } catch (error) {
    console.error("Public Registration error:", error);
    return NextResponse.json({ error: "Gagal memproses pendaftaran" }, { status: 500 });
  }
}
