import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mandiriKuisioner, mandiriPemilihan } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { pemilihanId, namaPnkb, noHpPnkb, tanggapan, rekomendasi } = body;

        if (!tanggapan || !rekomendasi) {
            return NextResponse.json({ error: "Mohon isi semua field kuisioner" }, { status: 400 });
        }

        const id = uuidv4();
        await db.insert(mandiriKuisioner).values({
            id,
            pemilihanId,
            pengisiId: session.generusId!,
            namaPnkb,
            noHpPnkb,
            tanggapan,
            rekomendasi
        });

        // If pemilihanId exists, mark selection as "Selesai"
        if (pemilihanId) {
            await db.update(mandiriPemilihan).set({ status: "Selesai" }).where(eq(mandiriPemilihan.id, pemilihanId));
        }

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error("POST kuisioner error:", error);
        return NextResponse.json({ error: "Gagal menyimpan kuisioner" }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !["admin", "kmm_daerah"].includes(session.role)) {
            return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
        }

        const data = await db.select().from(mandiriKuisioner);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
    }
}
