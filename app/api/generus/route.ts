export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generus, desa, kelompok, usersOld, mandiri, mandiriDesa, mandiriKelompok } from "@/lib/schema";
import { eq, and, or, like, sql, not, isNull, isNotNull, ne, inArray, notInArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

function generateNomorUnik() {
  const prefix = "GNR";
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${num}`;
}

function buildWhereClause(
  session: Awaited<ReturnType<typeof getSession>>, 
  search?: string, 
  ignoreRoleRestriction?: boolean,
  statusNikah?: string,
  desaId?: string,
  kelompokId?: string,
  jenisKelamin?: string,
  status?: string,
  kategoriUsia?: string,
  notInMandiri?: boolean,
  isGenerus?: boolean
) {
  const conditions: any[] = [];
  
  if (isGenerus) {
    conditions.push(eq(generus.isGenerus, 1));
  }
  
  if (notInMandiri) {
    conditions.push(isNull(mandiri.id));
  }

  // 1. Role-based restrictions
  if (!ignoreRoleRestriction) {
    if ((session?.role === "desa" || (session?.role === "tim_pnkb" && !session.kelompokId)) && session.desaId) {
      conditions.push(eq(generus.desaId, session.desaId));
    } else if ((session?.role === "kelompok" || (session?.role === "tim_pnkb" && session.kelompokId)) && session.kelompokId) {
      conditions.push(eq(generus.kelompokId, session.kelompokId));
    }
  }

  // 2. Explicit User Filters
  if (desaId) {
    conditions.push(eq(generus.desaId, Number(desaId)));
  }
  if (kelompokId) {
    conditions.push(eq(generus.kelompokId, Number(kelompokId)));
  }

  // 3. Other filters
  if (statusNikah && statusNikah !== "all") {
    conditions.push(eq(generus.statusNikah, statusNikah as any));
  }

  if (kategoriUsia && kategoriUsia !== "all") {
    conditions.push(eq(generus.kategoriUsia, kategoriUsia as any));
  }

  if (search) {
    const isGnrCode = /^GNR\d+$/i.test(search.trim());
    if (isGnrCode) {
      // Exact match for codes is much faster
      conditions.push(eq(generus.nomorUnik, search.trim().toUpperCase()));
    } else {
      conditions.push(
        or(
          like(generus.nama, `%${search}%`),
          like(generus.nomorUnik, `%${search}%`),
          like(desa.nama, `%${search}%`),
          like(kelompok.nama, `%${search}%`)
        )
      );
    }
  }

  if (jenisKelamin && (jenisKelamin === "L" || jenisKelamin === "P")) {
    conditions.push(eq(generus.jenisKelamin, jenisKelamin as "L" | "P"));
  }

  if (status === "panitia") {
    conditions.push(not(or(isNull(usersOld.role), eq(usersOld.role, "generus"))!));
  } else if (status === "peserta") {
    conditions.push(or(isNull(usersOld.role), eq(usersOld.role, "generus")));
  } else if (status === "all" && isGenerus) {
     // If we are in the main Data Generus view (isGenerus=1), we can skip the role check join 
     // for the 'all' view to maximize performance. The isGenerus flag is our source of truth here.
  }

  return (conditions.length > 0 ? and(...conditions) : undefined) as any;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const statusNikah = searchParams.get("statusNikah") || "all";
    const desaId = searchParams.get("desaId") || "";
    const kelompokId = searchParams.get("kelompokId") || "";
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "10");
    const all = searchParams.get("all") === "true";
    const mandiriOnly = searchParams.get("mandiriOnly") === "true";
    let notInMandiri = searchParams.get("notInMandiri") === "true";
    let filterIsGenerus = false;

    if (!all && !mandiriOnly) {
      filterIsGenerus = true;
    }

    const jenisKelamin = searchParams.get("jenisKelamin") || "all";
    const status = searchParams.get("status") || "all";
    const kategoriUsia = searchParams.get("kategoriUsia") || "all";
    const offset = (page - 1) * limit;

    const finalWhere = buildWhereClause(
      session, search, all, statusNikah, desaId, kelompokId, 
      jenisKelamin, status, kategoriUsia, notInMandiri, filterIsGenerus
    );

    const isExport = all === true;

    if (isExport) {
      let query = db
        .select({
          id: generus.id,
          nomorUnik: generus.nomorUnik,
          nama: generus.nama,
          email: usersOld.email,
          desaNama: desa.nama,
          kelompokNama: kelompok.nama,
          foto: generus.foto,
          instagram: generus.instagram,
          tanggalLahir: generus.tanggalLahir,
          tempatLahir: generus.tempatLahir,
          kategoriUsia: generus.kategoriUsia,
          jenisKelamin: generus.jenisKelamin,
          nomorUrut: mandiri.nomorUrut,
          mandiriDesaNama: mandiriDesa.nama,
          mandiriKelompokNama: mandiriKelompok.nama,
        })
        .from(generus)
        .leftJoin(usersOld, eq(generus.id, usersOld.generusId))
        .leftJoin(desa, eq(generus.desaId, desa.id))
        .leftJoin(kelompok, eq(generus.kelompokId, kelompok.id))
        .leftJoin(mandiriDesa, eq(generus.mandiriDesaId, mandiriDesa.id))
        .leftJoin(mandiriKelompok, eq(generus.mandiriKelompokId, mandiriKelompok.id));

      if (mandiriOnly) {
        query = (query as any).innerJoin(mandiri, eq(generus.id, mandiri.generusId));
      } else {
        query = (query as any).leftJoin(mandiri, eq(generus.id, mandiri.generusId));
      }

      const data = await query.where(finalWhere).orderBy(generus.nama);

      return NextResponse.json(
        { data, total: data.length, page: 1, limit: data.length },
        { headers: { "Cache-Control": "private, max-age=60" } }
      );
    }

    const canSeePrivateData = ["admin", "kmm_daerah", "admin_romantic_room", "pengurus_daerah", "tim_pnkb"].includes(session.role);

    // NORMAL PAGINATED QUERY (OPTIMIZED: JOIN ONLY NECESSARY TABLES)
    const dataQuerySelect = {
        id: generus.id,
        nomorUnik: generus.nomorUnik,
        nama: generus.nama,
        jenisKelamin: generus.jenisKelamin,
        kategoriUsia: generus.kategoriUsia,
        statusNikah: generus.statusNikah,
        suku: generus.suku,
        foto: generus.foto,
        desaNama: desa.nama,
        kelompokNama: kelompok.nama,
        desaId: generus.desaId,
        kelompokId: generus.kelompokId,
        role: usersOld.role,
        email: usersOld.email,
        createdAt: generus.createdAt,
        noTelp: canSeePrivateData ? generus.noTelp : sql`NULL`,
    };

    let dataQuery = db
      .select(dataQuerySelect)
      .from(generus)
      .leftJoin(desa, eq(generus.desaId, desa.id))
      .leftJoin(kelompok, eq(generus.kelompokId, kelompok.id))
      .leftJoin(usersOld, eq(generus.id, usersOld.generusId));

    if (mandiriOnly) {
      dataQuery = (dataQuery as any).innerJoin(mandiri, eq(generus.id, mandiri.generusId));
    }

    // Optimized Count Query: Avoid unnecessary joins for simple counts
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(generus);

    // Only join usersOld if status filtering is happening and it's not simply 'all'
    if (status !== "all" || search) {
      countQuery.leftJoin(usersOld, eq(generus.id, usersOld.generusId));
    }

    if (search) {
      countQuery.leftJoin(desa, eq(generus.desaId, desa.id));
      countQuery.leftJoin(kelompok, eq(generus.kelompokId, kelompok.id));
    }

    if (mandiriOnly) {
      countQuery.innerJoin(mandiri, eq(generus.id, mandiri.generusId));
    }

    const [data, countResult] = await Promise.all([
      dataQuery
        .where(finalWhere)
        .orderBy(generus.nama)
        .limit(limit)
        .offset(offset),
      countQuery.where(finalWhere),
    ]);

    return NextResponse.json(
      { data, total: Number(countResult[0]?.count || 0), page, limit },
      { headers: { "Cache-Control": "private, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (error: any) {
    console.error("Generus GET error details:", error);
    return NextResponse.json({ error: "Gagal mengambil data dari server" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { 
      nama, tempatLahir, tanggalLahir, jenisKelamin, kategoriUsia, alamat, noTelp, 
      pendidikan, pekerjaan, statusNikah, desaId, kelompokId, 
      mandiriDesaId, mandiriKelompokId,
      hobi, makananMinumanFavorit, suku, foto 
    } = body;

    if (!nama || !jenisKelamin || !kategoriUsia || (!desaId && !mandiriDesaId)) {
      return NextResponse.json({ error: "Nama dan Wilayah wajib diisi" }, { status: 400 });
    }

    // Duplicate Check
    const duplicateConditions = [];
    if (nama && tanggalLahir) {
      duplicateConditions.push(and(eq(generus.nama, nama), eq(generus.tanggalLahir, tanggalLahir)));
    }
    if (noTelp) {
      duplicateConditions.push(eq(generus.noTelp, noTelp));
    }

    const duplicate = duplicateConditions.length > 0 
      ? await db.query.generus.findFirst({ where: or(...duplicateConditions) })
      : null;

    if (duplicate) {
        return NextResponse.json({ 
            error: `Data dengan Nama "${nama}" atau Nomor HP "${noTelp}" sudah terdaftar sebelumnya.` 
        }, { status: 400 });
    }

    // Access control
    if ((session.role === "kelompok") && session.kelompokId && session.kelompokId !== Number(kelompokId)) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
    }
    if ((session.role === "desa") && session.desaId && !session.kelompokId && session.desaId !== Number(desaId)) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
    }

    let nomorUnik = generateNomorUnik();
    // Ensure unique
    let existing = await db.query.generus.findFirst({ where: eq(generus.nomorUnik, nomorUnik) });
    while (existing) {
      nomorUnik = generateNomorUnik();
      existing = await db.query.generus.findFirst({ where: eq(generus.nomorUnik, nomorUnik) });
    }

    const id = uuidv4();
    await db.insert(generus).values({
      id,
      nomorUnik,
      nama,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      kategoriUsia,
      alamat,
      noTelp,
      pendidikan,
      pekerjaan,
      statusNikah: statusNikah || "Belum Menikah",
      desaId: desaId ? Number(desaId) : null,
      kelompokId: kelompokId ? Number(kelompokId) : null,
      mandiriDesaId: mandiriDesaId ? Number(mandiriDesaId) : null,
      mandiriKelompokId: mandiriKelompokId ? Number(mandiriKelompokId) : null,
      hobi,
      makananMinumanFavorit,
      suku,
      foto,
      createdBy: session.userId,
      isGenerus: 1,
    });

    // AUTO-CREATE USER ACCOUNT for Generus role (in usersOld)
    const { email: customEmail, password: customPassword } = body;
    let finalEmail = customEmail ? customEmail.toLowerCase() : `${nomorUnik.toLowerCase()}@jb2.id`;
    const finalPassword = customPassword || nomorUnik;
    
    // Check email uniqueness in usersOld
    const existingEmail = await db.query.usersOld.findFirst({ where: eq(usersOld.email, finalEmail) });
    if (existingEmail) {
        finalEmail = `${uuidv4().substring(0, 4)}_${finalEmail}`;
    }

    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(finalPassword, 10);

    await db.insert(usersOld).values({
        id: uuidv4(),
        name: nama,
        email: finalEmail,
        passwordHash, 
        role: "generus",
        generusId: id,
        desaId: desaId ? Number(desaId) : null,
        kelompokId: kelompokId ? Number(kelompokId) : null,
    });

    return NextResponse.json({ success: true, id, nomorUnik });
  } catch (error) {
    console.error("Generus POST error:", error);
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}
