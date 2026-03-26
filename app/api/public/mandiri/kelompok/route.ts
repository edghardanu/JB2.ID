export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mandiriKelompok } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mandiriDesaId = searchParams.get("mandiriDesaId");
    if (!mandiriDesaId) return NextResponse.json([]);
    const data = await db.select().from(mandiriKelompok).where(eq(mandiriKelompok.mandiriDesaId, Number(mandiriDesaId))).orderBy(mandiriKelompok.nama);
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}
