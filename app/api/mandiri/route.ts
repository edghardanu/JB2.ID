export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mandiri, generus, desa, kelompok, mandiriDesa, mandiriKelompok } from "@/lib/schema";
import { eq, and, or, like, sql, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowedRoles = ["admin", "pengurus_daerah", "kmm_daerah"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(generus.nama, `%${search}%`),
          like(generus.nomorUnik, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    console.log("Mandiri GET Where:", whereClause ? "Yes" : "No");

    const data = await db
      .select({
        id: mandiri.id,
        statusMandiri: mandiri.statusMandiri,
        catatan: mandiri.catatan,
        generusId: mandiri.generusId,
        nama: generus.nama,
        nomorUnik: generus.nomorUnik,
        jenisKelamin: generus.jenisKelamin,
        kategoriUsia: generus.kategoriUsia,
        desaNama: sql<string>`COALESCE(${mandiriDesa.nama}, ${desa.nama})`,
        kelompokNama: sql<string>`COALESCE(${mandiriKelompok.nama}, ${kelompok.nama})`,
        noTelp: generus.noTelp,
        foto: generus.foto,
        createdAt: mandiri.createdAt,
      })
      .from(mandiri)
      .innerJoin(generus, eq(mandiri.generusId, generus.id))
      .leftJoin(desa, eq(generus.desaId, desa.id))
      .leftJoin(kelompok, eq(generus.kelompokId, kelompok.id))
      .leftJoin(mandiriDesa, eq(generus.mandiriDesaId, mandiriDesa.id))
      .leftJoin(mandiriKelompok, eq(generus.mandiriKelompokId, mandiriKelompok.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(mandiri.createdAt));

    console.log("Mandiri GET Results Count:", data.length);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(mandiri)
      .innerJoin(generus, eq(mandiri.generusId, generus.id))
      .where(whereClause);

    return NextResponse.json({
      data,
      total: Number(countResult[0]?.count || 0),
      page,
      limit,
    });
  } catch (error) {
    console.error("Mandiri GET error:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowedRoles = ["admin", "pengurus_daerah", "kmm_daerah"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    // Check Deadline for non-admins
    if (session.role !== "admin") {
      const settingsTable = (await import("@/lib/schema")).settings;
      const deadlineSet = await db.select().from(settingsTable).where(eq(settingsTable.key, "mandiri_registration_deadline"));
      if (deadlineSet[0]?.value) {
        if (new Date() > new Date(deadlineSet[0].value)) {
          return NextResponse.json({ error: "Batas waktu pendaftaran telah berakhir. Penambahan manual dikunci." }, { status: 403 });
        }
      }
    }

    const body = await request.json();
    const { generusId, statusMandiri, catatan } = body;

    if (!generusId) {
      return NextResponse.json({ error: "Generus ID wajib diisi" }, { status: 400 });
    }

    // Check if already in list
    const existing = await db.query.mandiri.findFirst({
      where: eq(mandiri.generusId, generusId),
    });

    if (existing) {
      return NextResponse.json({ error: "Generus ini sudah ada dalam daftar Mandiri" }, { status: 400 });
    }

    const id = uuidv4();
    await db.insert(mandiri).values({
      id,
      generusId,
      statusMandiri: statusMandiri || "Aktif",
      catatan,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Mandiri POST error:", error);
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, statusMandiri, catatan } = body;

    if (!id) return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });

    await db.update(mandiri)
      .set({ statusMandiri, catatan, updatedAt: sql`(datetime('now'))` })
      .where(eq(mandiri.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mandiri PUT error:", error);
    return NextResponse.json({ error: "Gagal update data" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });

    await db.delete(mandiri).where(eq(mandiri.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mandiri DELETE error:", error);
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}
