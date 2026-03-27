export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generus, mandiri, settings, desa, kelompok, users } from "@/lib/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

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
        mandiriDesaId, mandiriKelompokId, instagram, email
    } = body;

    if (!nama || !jenisKelamin || !kategoriUsia || !mandiriDesaId || !tempatLahir || !tanggalLahir || !noTelp || !pendidikan || !pekerjaan || !hobi || !makananMinumanFavorit || !email) {
      return NextResponse.json({ error: "Mohon lengkapi semua data wajib (termasuk Email)" }, { status: 400 });
    }

    // 2. Email Uniqueness Check in 'users' table
    const existingEmail = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });
    if (existingEmail) {
        return NextResponse.json({ error: `Email "${email}" sudah digunakan oleh akun lain. Gunakan email lain.` }, { status: 400 });
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
        // Check if already in mandiri list
        const existingMandiri = await db.query.mandiri.findFirst({
            where: eq(mandiri.generusId, duplicate.id)
        });

        if (existingMandiri) {
            return NextResponse.json({ 
                isAlreadyRegistered: true,
                nomorUnik: duplicate.nomorUnik,
                message: "Peserta sudah terdaftar sebelumnya."
            });
        }

        // --- VALIDATION PASSED: Existing Generus found, Proceed to add to Mandiri ---
        
        // Update existing generus data with the latest info from Mandiri form
        await db.update(generus).set({
            nama, jenisKelamin, kategoriUsia, tempatLahir, tanggalLahir,
            alamat, noTelp, pendidikan, pekerjaan, statusNikah: statusNikah || "Belum Menikah",
            hobi, makananMinumanFavorit, suku, foto,
            mandiriDesaId: mandiriDesaId ? Number(mandiriDesaId) : null,
            mandiriKelompokId: mandiriKelompokId ? Number(mandiriKelompokId) : null,
            instagram: instagram || duplicate.instagram, 
            updatedAt: new Date().toISOString()
        }).where(eq(generus.id, duplicate.id));

        // Calculate next nomorUrut
        const lastRes = await db.select({ maxNr: sql<number>`max(${mandiri.nomorUrut})` }).from(mandiri);
        const nextNr = (lastRes[0]?.maxNr || 0) + 1;

        // Add to mandiri activity list
        await db.insert(mandiri).values({
            id: uuidv4(),
            generusId: duplicate.id,
            nomorUrut: nextNr,
            statusMandiri: "Aktif",
            catatan: "Pendaftaran mandiri (Public - Existing Generus)"
        });

        // AUTO-CREATE OR SYNC USER ACCOUNT
        const existingUser = await db.query.users.findFirst({ where: eq(users.generusId, duplicate.id) });
        if (!existingUser) {
            const passwordHash = await bcrypt.hash(duplicate.nomorUnik, 10);
            await db.insert(users).values({
                id: uuidv4(),
                name: nama,
                email: email.toLowerCase(),
                passwordHash, 
                role: "peserta",
                generusId: duplicate.id,
                desaId: duplicate.desaId,
                kelompokId: duplicate.kelompokId,
                mandiriDesaId: Number(mandiriDesaId),
                mandiriKelompokId: Number(mandiriKelompokId),
            });
        } else if (existingUser.role === "generus" || existingUser.role === "pending") {
            // Upgrade role to 'peserta' if it's currently low-level
            await db.update(users).set({ role: "peserta" }).where(eq(users.id, existingUser.id));
        }

        return NextResponse.json({ success: true, generusId: duplicate.id, nomorUnik: duplicate.nomorUnik, nomorUrut: nextNr, email });
    }

    // --- CASE: NEW GENERUS ---

    // Pick a valid kelompok/desa for the new entry to satisfy constraints
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
        const firstDesa = await db.select({ id: desa.id }).from(desa).limit(1);
        defaultDesaId = firstDesa[0]?.id;
    }

    let nomorUnik = generateNomorUnik();
    let uniqueExisting = await db.query.generus.findFirst({ where: eq(generus.nomorUnik, nomorUnik) });
    while (uniqueExisting) {
      nomorUnik = generateNomorUnik();
      uniqueExisting = await db.query.generus.findFirst({ where: eq(generus.nomorUnik, nomorUnik) });
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
      instagram,
      createdBy: "FORM_MANDIRI"
    };

    await db.insert(generus).values(generusData);

    // Calculate next nomorUrut
    const lastRes = await db.select({ maxNr: sql<number>`max(${mandiri.nomorUrut})` }).from(mandiri);
    const nextNr = (lastRes[0]?.maxNr || 0) + 1;

    // Add to mandiri activity list
    await db.insert(mandiri).values({
      id: uuidv4(),
      generusId,
      nomorUrut: nextNr,
      statusMandiri: "Aktif",
      catatan: "Pendaftaran mandiri (Public - New User)"
    });

    // AUTO-CREATE USER ACCOUNT
    const passwordHash = await bcrypt.hash(nomorUnik, 10);
    await db.insert(users).values({
        id: uuidv4(),
        name: nama,
        email: email.toLowerCase(),
        passwordHash, 
        role: "peserta",
        generusId: generusId,
        desaId: defaultDesaId,
        kelompokId: defaultKelompokId,
        mandiriDesaId: Number(mandiriDesaId),
        mandiriKelompokId: Number(mandiriKelompokId),
    });

    return NextResponse.json({ success: true, generusId, nomorUnik, nomorUrut: nextNr, email });
  } catch (error) {
    console.error("Public Registration error:", error);
    return NextResponse.json({ error: "Gagal memproses pendaftaran" }, { status: 500 });
  }
}
