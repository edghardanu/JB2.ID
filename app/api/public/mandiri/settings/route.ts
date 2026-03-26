export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings, mandiriKegiatan, kegiatan } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key") || "mandiri_registration_deadline";
    
    const data = await db.select().from(settings).where(eq(settings.key, key));
    
    // Fallbacks for Mandiri
    if (key === "mandiri_registration_title" && !data[0]?.value) {
        const latest = await db.select({ value: mandiriKegiatan.judul }).from(mandiriKegiatan).orderBy(desc(mandiriKegiatan.tanggal)).limit(1);
        return NextResponse.json({ key, value: latest[0]?.value || "Peserta Mandiri" });
    }

    if (key === "mandiri_registration_description" && !data[0]?.value) {
        const latest = await db.select({ value: mandiriKegiatan.deskripsi }).from(mandiriKegiatan).orderBy(desc(mandiriKegiatan.tanggal)).limit(1);
        return NextResponse.json({ key, value: latest[0]?.value || "" });
    }

    // Fallbacks for Generus
    if (key === "generus_registration_title" && !data[0]?.value) {
        const latest = await db.select({ value: kegiatan.judul }).from(kegiatan).orderBy(desc(kegiatan.tanggal)).limit(1);
        return NextResponse.json({ key, value: latest[0]?.value || "Daftar Peserta" });
    }

    if (key === "generus_registration_description" && !data[0]?.value) {
        const latest = await db.select({ value: kegiatan.deskripsi }).from(kegiatan).orderBy(desc(kegiatan.tanggal)).limit(1);
        return NextResponse.json({ key, value: latest[0]?.value || "" });
    }
    
    if (data[0] && key === "mandiri_registration_deadline") {
      const isPast = data[0].value ? new Date() > new Date(data[0].value) : false;
      return NextResponse.json({ ...data[0], isPast });
    }
    
    return NextResponse.json(data[0] || { key, value: "" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengambil settings" }, { status: 500 });
  }
}
