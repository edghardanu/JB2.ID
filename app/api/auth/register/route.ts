import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, generus, mandiri } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, nomorUnik } = await request.json();

    if (!name || !email || !password || !nomorUnik) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    // 1. Verify that this Nomor Unik is a registered Mandiri participant
    const person = await db.query.generus.findFirst({
        where: eq(generus.nomorUnik, nomorUnik.toUpperCase().trim())
    });

    if (!person) {
        return NextResponse.json({ error: "Nomor Unik tidak ditemukan dalam database generus." }, { status: 403 });
    }

    const isMandiriParticipant = await db.query.mandiri.findFirst({
        where: eq(mandiri.generusId, person.id)
    });

    if (!isMandiriParticipant) {
        return NextResponse.json({ 
            error: "Pendaftaran gagal. Anda belum terdaftar sebagai Peserta Mandiri. Silakan isi form registrasi mandiri via link terlebih dahulu." 
        }, { status: 403 });
    }

    // 2. Check if Email or GenerusID already has an account
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    const existingByGenerus = await db.query.users.findFirst({
        where: eq(users.generusId, person.id)
    });

    if (existingByGenerus) {
        return NextResponse.json({ error: "Nomor Unik ini sudah memiliki akun yang terdaftar." }, { status: 409 });
    }

    // 3. Create User
    const passwordHash = await bcrypt.hash(password, 12);
    const id = uuidv4();

    await db.insert(users).values({
      id,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "generus", // Default to generus role for participants
      generusId: person.id,
      desaId: person.desaId,
      kelompokId: person.kelompokId,
      mandiriDesaId: person.mandiriDesaId,
      mandiriKelompokId: person.mandiriKelompokId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
