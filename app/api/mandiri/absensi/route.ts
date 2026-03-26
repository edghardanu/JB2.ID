export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mandiriAbsensi, generus, mandiriKegiatan } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const kegiatanId = searchParams.get("kegiatanId");

    if (!kegiatanId) return NextResponse.json({ error: "kegiatanId diperlukan" }, { status: 400 });

    const data = await db
      .select({
        id: mandiriAbsensi.id,
        kegiatanId: mandiriAbsensi.kegiatanId,
        generusId: mandiriAbsensi.generusId,
        timestamp: mandiriAbsensi.timestamp,
        keterangan: mandiriAbsensi.keterangan,
        generusNama: generus.nama,
        generusNomorUnik: generus.nomorUnik,
        generusKategori: generus.kategoriUsia,
      })
      .from(mandiriAbsensi)
      .leftJoin(generus, eq(mandiriAbsensi.generusId, generus.id))
      .where(eq(mandiriAbsensi.kegiatanId, kegiatanId));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Mandiri Absensi GET error:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { kegiatanId, generusId: rawGenerusId, keterangan } = body;

    if (!kegiatanId || !rawGenerusId) {
      return NextResponse.json({ error: "kegiatanId dan generusId diperlukan" }, { status: 400 });
    }

    // Resolve generus
    let resolvedGenerus = await db.query.generus.findFirst({
      where: eq(generus.id, rawGenerusId),
    });
    if (!resolvedGenerus) {
      resolvedGenerus = await db.query.generus.findFirst({
        where: eq(generus.nomorUnik, rawGenerusId),
      });
    }

    if (!resolvedGenerus) {
      return NextResponse.json({ error: `Generus tidak ditemukan` }, { status: 404 });
    }

    const resolvedGenerusId = resolvedGenerus.id;

    // Check if already present in Mandiri Absensi
    const existing = await db.query.mandiriAbsensi.findFirst({
      where: and(eq(mandiriAbsensi.kegiatanId, kegiatanId), eq(mandiriAbsensi.generusId, resolvedGenerusId)),
    });

    if (existing) {
      return NextResponse.json({ error: "Sudah diabsen", existing }, { status: 409 });
    }

    const id = uuidv4();
    await db.insert(mandiriAbsensi).values({
      id,
      kegiatanId,
      generusId: resolvedGenerusId,
      keterangan: keterangan || "hadir",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id, generusNama: resolvedGenerus.nama });
  } catch (error) {
    console.error("Mandiri Absensi POST error:", error);
    return NextResponse.json({ error: "Gagal menyimpan absensi" }, { status: 500 });
  }
}
