export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mandiri, generus, desa, kelompok, mandiriDesa, mandiriKelompok, users } from "@/lib/schema";
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
    const search = (searchParams.get("search") || "").trim();
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const conditions = [];
    conditions.push(eq(users.role, "peserta"));

    if (search) {
      conditions.push(
        or(
          like(users.name, `%${search}%`),
          like(generus.nomorUnik, `%${search}%`)
        )
      );
    }

    const whereClause = and(...conditions);

    // Optimized Data Query
    const dataQuery = db
      .select({
        id: users.id, 
        nomorUrut: mandiri.nomorUrut,
        statusMandiri: mandiri.statusMandiri,
        catatan: mandiri.catatan,
        generusId: users.generusId,
        nama: users.name,
        nomorUnik: generus.nomorUnik,
        jenisKelamin: generus.jenisKelamin,
        kategoriUsia: generus.kategoriUsia,
        desaNama: sql<string>`COALESCE(${mandiriDesa.nama}, ${desa.nama})`,
        kelompokNama: sql<string>`COALESCE(${mandiriKelompok.nama}, ${kelompok.nama})`,
        noTelp: generus.noTelp,
        foto: generus.foto,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(generus, eq(users.generusId, generus.id))
      .leftJoin(mandiri, eq(generus.id, mandiri.generusId))
      .leftJoin(desa, eq(generus.desaId, desa.id))
      .leftJoin(kelompok, eq(generus.kelompokId, kelompok.id))
      .leftJoin(mandiriDesa, eq(generus.mandiriDesaId, mandiriDesa.id))
      .leftJoin(mandiriKelompok, eq(generus.mandiriKelompokId, mandiriKelompok.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.createdAt));

    // Optimized Count Query: Only join what's necessary
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    if (search) {
      countQuery.innerJoin(generus, eq(users.generusId, generus.id));
    }

    const [data, countResult] = await Promise.all([
      dataQuery,
      countQuery.where(whereClause)
    ]);

    return NextResponse.json({
      data,
      total: Number(countResult[0]?.count || 0),
      page,
      limit,
    }, {
      headers: { "Cache-Control": "private, s-maxage=30, stale-while-revalidate=60" }
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

    // Calculate next nomorUrut
    const lastRes = await db.select({ maxNr: sql<number>`max(${mandiri.nomorUrut})` }).from(mandiri);
    const nextNr = (lastRes[0]?.maxNr || 0) + 1;

    const id = uuidv4();
    await db.insert(mandiri).values({
      id,
      generusId,
      nomorUrut: nextNr,
      statusMandiri: statusMandiri || "Aktif",
      catatan,
    });

    // AUTO-SYNC USER ACCOUNT to 'peserta' role
    const genData = await db.query.generus.findFirst({ where: eq(generus.id, generusId) });
    if (genData) {
      const existingUser = await db.query.users.findFirst({ where: eq(users.generusId, generusId) });
      if (!existingUser) {
        // Create account with participant's nomor unik as initial password
        const passwordHash = await (await import("bcryptjs")).hash(genData.nomorUnik, 10);
        await db.insert(users).values({
          id: uuidv4(),
          name: genData.nama,
          email: `${genData.nomorUnik.toLowerCase()}@jb2.id`, // Default email since admin may not have it
          passwordHash,
          role: "peserta",
          generusId: generusId,
          desaId: genData.desaId,
          kelompokId: genData.kelompokId,
          mandiriDesaId: genData.mandiriDesaId,
          mandiriKelompokId: genData.mandiriKelompokId,
        });
      } else if (existingUser.role === "generus" || existingUser.role === "pending") {
          await db.update(users).set({ role: "peserta" }).where(eq(users.id, existingUser.id));
      }
    }

    return NextResponse.json({ success: true, id, nomorUrut: nextNr });
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
    const { id: userId, statusMandiri, catatan } = body;

    if (!userId) return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user || !user.generusId) return NextResponse.json({ error: "User/Profil tidak ditemukan" }, { status: 404 });

    // Cek apakah sudah ada entry di tabel mandiri
    const existingMandiri = await db.query.mandiri.findFirst({
      where: eq(mandiri.generusId, user.generusId)
    });

    if (existingMandiri) {
      await db.update(mandiri)
        .set({ statusMandiri, catatan, updatedAt: sql`(datetime('now'))` })
        .where(eq(mandiri.id, existingMandiri.id));
    } else {
      // Create if missing (backwards compatibility or manual role change elsewhere)
      await db.insert(mandiri).values({
        id: uuidv4(),
        generusId: user.generusId,
        statusMandiri: statusMandiri || "Aktif",
        catatan,
      });
    }

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
    const userId = searchParams.get("id");

    if (!userId) return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

    // Hapus dari daftar mandiri jika ada
    if (user.generusId) {
      await db.delete(mandiri).where(eq(mandiri.generusId, user.generusId));
    }

    // Ubah role user kembali ke generus (melepas dari list mandiri driven-by-users)
    await db.update(users).set({ role: "generus" }).where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mandiri DELETE error:", error);
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}
