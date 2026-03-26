import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { setSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, desaId, kelompokId } = await request.json();

    if (!name || !email || !password || !desaId || !kelompokId) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const id = uuidv4();

    await db.insert(users).values({
      id,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "pending",
      desaId: Number(desaId),
      kelompokId: Number(kelompokId),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
