import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mandiriAntrean, generus, desa, kelompok, users } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Admins can see all, generus see their own and the active list?
        // For simple UI, let's return the whole list of "Menunggu" and "Diproses" for admins, and status for individuals.
        const data = await db.select({
            id: mandiriAntrean.id,
            status: mandiriAntrean.status,
            createdAt: mandiriAntrean.createdAt,
            generusId: mandiriAntrean.generusId,
            nama: generus.nama,
            nomorUnik: generus.nomorUnik,
            desa: desa.nama,
            kelompok: kelompok.nama,
            gender: generus.jenisKelamin
        })
        .from(mandiriAntrean)
        .innerJoin(generus, eq(mandiriAntrean.generusId, generus.id))
        .leftJoin(desa, eq(generus.desaId, desa.id))
        .leftJoin(kelompok, eq(generus.kelompokId, kelompok.id))
        .orderBy(desc(mandiriAntrean.createdAt));

        return NextResponse.json(data);
    } catch (error) {
        console.error("GET antrean error:", error);
        return NextResponse.json({ error: "Gagal mengambil data antrean" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        let generusId = session.generusId;
        if (!generusId) {
            const userRec = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
            generusId = userRec?.generusId;
        }

        if (!generusId) return NextResponse.json({ error: "Akun Anda tidak terhubung dengan profil Generus" }, { status: 400 });

        // Check if already in queue
        const existing = await db.query.mandiriAntrean.findFirst({
            where: and(eq(mandiriAntrean.generusId, generusId), eq(mandiriAntrean.status, "Menunggu"))
        });

        if (existing) return NextResponse.json({ error: "Anda sudah terdaftar dalam antrean" }, { status: 400 });

        const id = uuidv4();
        await db.insert(mandiriAntrean).values({
            id,
            generusId,
            status: "Menunggu"
        });

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error("POST antrean error:", error);
        return NextResponse.json({ error: "Gagal mendaftar antrean" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !["admin", "kmm_daerah"].includes(session.role)) {
            return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
        }

        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) return NextResponse.json({ error: "ID dan Status wajib diisi" }, { status: 400 });

        await db.update(mandiriAntrean).set({ status }).where(eq(mandiriAntrean.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("PUT antrean error:", error);
        return NextResponse.json({ error: "Gagal update antrean" }, { status: 500 });
    }
}
