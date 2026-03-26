export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generus, mandiri } from "@/lib/schema";
import { eq, or, like, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// Search specifically for generus who are in the mandiri list
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    if (!q) return NextResponse.json([]);

    const data = await db
      .select({
        id: generus.id,
        nama: generus.nama,
        nomorUnik: generus.nomorUnik,
        kategoriUsia: generus.kategoriUsia,
      })
      .from(mandiri)
      .innerJoin(generus, eq(mandiri.generusId, generus.id))
      .where(
        or(
          like(generus.nama, `%${q}%`),
          like(generus.nomorUnik, `%${q}%`)
        )
      )
      .limit(10);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Mandiri Search generus error:", error);
    return NextResponse.json({ error: "Gagal mencari data" }, { status: 500 });
  }
}
