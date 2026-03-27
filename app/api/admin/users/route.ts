export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usersOld, desa, kelompok, generus, mandiri } from "@/lib/schema";
import { eq, or, like, sql, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "pengurus_daerah", "kmm_daerah"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    const roleParam = searchParams.get("role");

    const conditions = [];
    if (search) {
      conditions.push(or(
        like(usersOld.name, `%${search}%`),
        like(usersOld.email, `%${search}%`)
      ));
    }
    if (roleParam) {
      conditions.push(eq(usersOld.role, roleParam as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const isAll = searchParams.get("all") === "true";

    // EXPORT MODE: High Speed
    if (isAll) {
      const data = await db
        .select({
          id: usersOld.id,
          name: usersOld.name,
          email: usersOld.email,
          desaNama: desa.nama,
          kelompokNama: kelompok.nama,
        })
        .from(usersOld)
        .leftJoin(desa, eq(usersOld.desaId, desa.id))
        .leftJoin(kelompok, eq(usersOld.kelompokId, kelompok.id))
        .where(whereClause)
        .orderBy(usersOld.name);

      if (searchParams.get("format") === "csv") {
        const csvHeader = "Nama Lengkap,Desa,Kelompok,Email,Password Default\n";
        const csvRows = data.map(u => 
          `"${u.name.replace(/"/g, '""')}","${(u.desaNama || "-").replace(/"/g, '""')}","${(u.kelompokNama || "-").replace(/"/g, '""')}","${u.email.replace(/"/g, '""')}","generusjb2"`
        ).join("\n");

        const filename = `Data_User_Admin_${Date.now()}.csv`;
        return new Response(csvHeader + csvRows, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      }

      return NextResponse.json({ data, total: data.length, page: 1, limit: data.length }, {
        headers: { "Cache-Control": "private, max-age=60" }
      });
    }

    // LIST MODE: Paginated (Optimized Parallel Execution)
    const dataQuery = db
      .select({
        id: usersOld.id,
        name: usersOld.name,
        email: usersOld.email,
        role: usersOld.role,
        desaId: usersOld.desaId,
        kelompokId: usersOld.kelompokId,
        createdAt: usersOld.createdAt,
        generusNomorUnik: generus.nomorUnik,
        isMandiri: sql<number>`CASE WHEN ${mandiri.id} IS NOT NULL THEN 1 ELSE 0 END`,
        mandiriStatus: mandiri.statusMandiri,
        mandiriNomorUrut: mandiri.nomorUrut
      })
      .from(usersOld)
      .leftJoin(generus, eq(usersOld.generusId, generus.id))
      .leftJoin(mandiri, eq(generus.id, mandiri.generusId))
      .where(whereClause)
      .orderBy(usersOld.name)
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(usersOld)
      .where(whereClause);

    const [data, countResult] = await Promise.all([dataQuery, countQuery]);
    
    const total = Number(countResult[0]?.count || 0);

    return NextResponse.json({ data, total, page, limit }, {
      headers: { "Cache-Control": "private, s-maxage=30, stale-while-revalidate=60" }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "pengurus_daerah", "kmm_daerah"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id, role, desaId, kelompokId } = await request.json();
    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

    const user = await db.query.usersOld.findFirst({ where: eq(usersOld.id, id) });
    if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

    let generusId = user.generusId;

    const needsGenerusProfile = ["generus", "peserta", "creator"].includes(role);
    if (needsGenerusProfile && !generusId) {
      generusId = uuidv4();
      const prefix = role === "creator" ? "C" : role === "peserta" ? "P" : "G";
      const nomorUnik = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
      
      let finalDesaId = desaId ? Number(desaId) : user.desaId;
      let finalKelompokId = kelompokId ? Number(kelompokId) : user.kelompokId;

      if (!finalDesaId || !finalKelompokId) {
        const firstDesa = await db.query.desa.findFirst();
        if (firstDesa) {
          finalDesaId = finalDesaId || firstDesa.id;
          const firstKelompok = await db.query.kelompok.findFirst({
            where: eq(kelompok.desaId, firstDesa.id)
          });
          if (firstKelompok) finalKelompokId = finalKelompokId || firstKelompok.id;
        }
      }

      await db.insert(generus).values({
        id: generusId,
        nomorUnik,
        nama: user.name,
        jenisKelamin: "L", // Default, user can update later
        kategoriUsia: "SMA", // Default
        desaId: finalDesaId || 1, // Final fallback to 1 as last resort
        kelompokId: finalKelompokId || 1,
        createdBy: session.userId,
      });
    }

    await db.update(usersOld).set({ 
      role: role || user.role, 
      desaId: desaId ? Number(desaId) : user.desaId, 
      kelompokId: kelompokId ? Number(kelompokId) : user.kelompokId, 
      generusId 
    }).where(eq(usersOld.id, id));
    
    // Sinkronkan ke generus jika user memiliki generusId
    if (generusId) {
      const updateData: any = { nama: user.name };
      const gDesaId = desaId ? Number(desaId) : user.desaId;
      const gKelompokId = kelompokId ? Number(kelompokId) : user.kelompokId;
      
      if (gDesaId) updateData.desaId = gDesaId;
      if (gKelompokId) updateData.kelompokId = gKelompokId;

      await db
        .update(generus)
        .set(updateData)
        .where(eq(generus.id, generusId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal mengupdate data" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "pengurus_daerah", "kmm_daerah"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });
    await db.delete(usersOld).where(eq(usersOld.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}
