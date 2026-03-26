import { getSession } from "@/lib/auth";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

import { db } from "@/lib/db";
import { generus, kegiatan, artikel, users, mandiriKegiatan, mandiri } from "@/lib/schema";
import { eq, and, sql, or, isNull, not, notInArray } from "drizzle-orm";

async function getStats(session: any) {
  try {
    if (!session) return null;
    const isManagementOrPNKB = ["desa", "kelompok", "tim_pnkb"].includes(session.role);
    const desaFilter = (session.role === "desa" || (session.role === "tim_pnkb" && !session.kelompokId)) && session.desaId ? eq(generus.desaId, session.desaId) : undefined;
    const kelompokFilter = (session.role === "kelompok" || (session.role === "tim_pnkb" && session.kelompokId)) && session.kelompokId ? eq(generus.kelompokId, session.kelompokId) : undefined;
    const generusFilter = desaFilter || kelompokFilter;

    const desaFilterKegiatan = (session.role === "desa" || (session.role === "tim_pnkb" && !session.kelompokId)) && session.desaId ? eq(kegiatan.desaId, session.desaId) : undefined;
    const kelompokFilterKegiatan = (session.role === "kelompok" || (session.role === "tim_pnkb" && session.kelompokId)) && session.kelompokId ? eq(kegiatan.kelompokId, session.kelompokId) : undefined;
    const kegiatanFilter = desaFilterKegiatan || kelompokFilterKegiatan;

    const roleExclusion = or(
      isNull(users.role),
      notInArray(users.role, ["tim_pnkb", "pengurus_daerah", "kmm_daerah", "desa", "kelompok", "creator"])
    );

    const finalGenerusFilter = generusFilter ? and(generusFilter, roleExclusion) : roleExclusion as any;

    const [
      generusCount, 
      kegiatanCount, 
      mandiriKegiatanCount,
      artikelCount, 
      beritaCount, 
      userCount, 
      marriedCount, 
      notMarriedCount,
      paudCount,
      tkCount,
      sdCount,
      smpCount,
      smaCount,
      smkCount,
      kuliahCount,
      bekerjaCount,
      mandiriCount
    ] = await Promise.all([
      db.select({ count: sql<number>`count(DISTINCT ${generus.id})` }).from(generus).leftJoin(users, eq(generus.id, users.generusId)).where(finalGenerusFilter),
      db.select({ count: sql<number>`count(*)` }).from(kegiatan).where(kegiatanFilter),
      db.select({ count: sql<number>`count(*)` }).from(mandiriKegiatan),
      db.select({ count: sql<number>`count(*)` }).from(artikel).where(and(eq(artikel.status, "published"), eq(artikel.tipe, "artikel"))),
      db.select({ count: sql<number>`count(*)` }).from(artikel).where(and(eq(artikel.status, "published"), eq(artikel.tipe, "berita"))),
      ["admin", "pengurus_daerah", "kmm_daerah", "admin_romantic_room"].includes(session.role)
        ? db.select({ count: sql<number>`count(*)` }).from(users)
        : Promise.resolve([{ count: 0 }]),
      db.select({ count: sql<number>`count(DISTINCT ${generus.id})` })
        .from(generus)
        .leftJoin(users, eq(generus.id, users.generusId))
        .where(and(finalGenerusFilter, eq(generus.statusNikah, "Menikah"))),
      db.select({ count: sql<number>`count(DISTINCT ${generus.id})` })
        .from(generus)
        .leftJoin(users, eq(generus.id, users.generusId))
        .where(and(finalGenerusFilter, eq(generus.statusNikah, "Belum Menikah"))),
      db.select({ count: sql<number>`count(DISTINCT ${generus.id})` })
        .from(generus)
        .leftJoin(users, eq(generus.id, users.generusId))
        .where(and(finalGenerusFilter, eq(generus.kategoriUsia, "PAUD"))),
      db.select({ count: sql<number>`count(DISTINCT ${generus.id})` })
        .from(generus)
        .leftJoin(users, eq(generus.id, users.generusId))
        .where(and(finalGenerusFilter, eq(generus.kategoriUsia, "TK"))),
      db.select({ count: sql<number>`count(DISTINCT ${generus.id})` })
        .from(generus)
        .leftJoin(users, eq(generus.id, users.generusId))
        .where(and(finalGenerusFilter, eq(generus.kategoriUsia, "SD"))),
      db.select({ count: sql<number>`count(DISTINCT ${generus.id})` })
        .from(generus)
        .leftJoin(users, eq(generus.id, users.generusId))
        .where(and(finalGenerusFilter, eq(generus.kategoriUsia, "SMP"))),
      db.select({ count: sql<number>`count(DISTINCT ${generus.id})` })
        .from(generus)
        .leftJoin(users, eq(generus.id, users.generusId))
        .where(and(finalGenerusFilter, eq(generus.kategoriUsia, "SMA"))),
      db.select({ count: sql<number>`count(DISTINCT ${generus.id})` })
        .from(generus)
        .leftJoin(users, eq(generus.id, users.generusId))
        .where(and(finalGenerusFilter, eq(generus.kategoriUsia, "SMK"))),
      db.select({ count: sql<number>`count(DISTINCT ${generus.id})` })
        .from(generus)
        .leftJoin(users, eq(generus.id, users.generusId))
        .where(and(finalGenerusFilter, eq(generus.kategoriUsia, "Kuliah"))),
      db.select({ count: sql<number>`count(DISTINCT ${generus.id})` })
        .from(generus)
        .leftJoin(users, eq(generus.id, users.generusId))
        .where(and(finalGenerusFilter, eq(generus.kategoriUsia, "Bekerja"))),
      db.select({ count: sql<number>`count(*)` }).from(mandiri),
    ]);

    return {
      generus: Number(generusCount[0].count),
      kegiatan: Number(kegiatanCount[0].count),
      mandiriKegiatan: Number(mandiriKegiatanCount[0].count),
      artikel: Number(artikelCount[0].count),
      berita: Number(beritaCount[0].count),
      users: Number(userCount[0].count),
      married: Number(marriedCount[0].count),
      notMarried: Number(notMarriedCount[0].count),
      paud: Number(paudCount[0].count),
      tk: Number(tkCount[0].count),
      sd: Number(sdCount[0].count),
      smp: Number(smpCount[0].count),
      sma: Number(smaCount[0].count),
      smk: Number(smkCount[0].count),
      kuliah: Number(kuliahCount[0].count),
      bekerja: Number(bekerjaCount[0].count),
      mandiri: Number(mandiriCount[0].count),
    };
  } catch (error) {
    console.error("Dashboard DB fetch error:", error);
    return null;
  }
}

import Topbar from "@/components/Topbar";

export default async function DashboardPage() {
  const session = await getSession();
  const stats = await getStats(session);

  const isUser = session?.role === "generus" || session?.role === "creator";

  return (
    <div>
      <Topbar 
        title={isUser ? "Dashboard User" : "Dashboard Admin"} 
        role={session?.role || "kelompok"} 
        userName={session?.name}
      />

      <div className="page-content">
        <div className="page-header">
          <div className="page-header-left">
            <h2>Selamat datang, {session?.name}!</h2>
            <p>{isUser ? "Berikut ringkasan profil dan aktivitas Anda" : "Berikut ringkasan data sistem JB2.ID"}</p>
          </div>
        </div>

        {isUser ? (
          <UserDashboard session={session} stats={stats} />
        ) : (
          <AdminDashboard role={session?.role || "kelompok"} stats={stats} />
        )}
      </div>
    </div>
  );
}

function AdminDashboard({ role, stats }: { role: string; stats: any }) {
  return (
    <div>
      {/* Generus & Pendidikan Section */}
      <h3 className="section-title" style={{ marginTop: "1rem", marginBottom: "1rem" }}>Data Generus & Pendidikan</h3>
      <div className="stats-grid" style={{ marginBottom: "2rem" }}>
        {(role === "admin" || role === "pengurus_daerah" || role === "kmm_daerah" || role === "desa" || role === "kelompok" || role === "tim_pnkb" || role === "admin_romantic_room") && (
          <StatCard icon="users" color="blue" label="Total Generus" value={stats?.generus ?? 0} href="/generus" />
        )}
        {(role === "admin" || role === "pengurus_daerah" || role === "kmm_daerah" || role === "desa" || role === "kelompok" || role === "tim_pnkb") && (
          <>
            <StatCard icon="school" color="purple" label="PAUD" value={stats?.paud ?? 0} href="/generus" />
            <StatCard icon="school" color="indigo" label="TK" value={stats?.tk ?? 0} href="/generus" />
            <StatCard icon="book-open" color="cyan" label="SD" value={stats?.sd ?? 0} href="/generus" />
            <StatCard icon="book-open" color="blue" label="SMP" value={stats?.smp ?? 0} href="/generus" />
            <StatCard icon="library" color="orange" label="SMA" value={stats?.sma ?? 0} href="/generus" />
            <StatCard icon="library" color="red" label="SMK" value={stats?.smk ?? 0} href="/generus" />
          </>
        )}
      </div>

      {/* Usia Mandiri/Nikah Section */}
      <h3 className="section-title" style={{ marginTop: "1rem", marginBottom: "1rem" }}>Usia Mandiri / Persiapan Nikah</h3>
      <div className="stats-grid" style={{ marginBottom: "2rem" }}>
        {(role === "admin" || role === "pengurus_daerah" || role === "kmm_daerah" || role === "desa" || role === "kelompok" || role === "tim_pnkb" || role === "admin_romantic_room") && (
          <>
            <StatCard icon="graduation-cap" color="purple" label="Kuliah" value={stats?.kuliah ?? 0} href="/generus" />
            <StatCard icon="briefcase" color="gray" label="Bekerja" value={stats?.bekerja ?? 0} href="/generus" />
            {role !== "admin_romantic_room" && (
              <StatCard icon="heart" color="rose" label="Katalog PDKT" value={stats?.mandiri ?? 0} href="/admin/katalog" />
            )}
            <StatCard icon="heart" color="pink" label="Romantic Room" value="Admin" href="/mandiri/romantic-room" />
          </>
        )}
      </div>

      {/* Database & Metadata Section */}
      <h3 className="section-title" style={{ marginTop: "1rem", marginBottom: "1rem" }}>Aktivitas & Administrasi</h3>
      <div className="stats-grid">
        {(role === "admin" || role === "pengurus_daerah" || role === "kmm_daerah" || role === "desa" || role === "kelompok" || role === "tim_pnkb") && (
          <>
            <StatCard icon="heart" color="red" label="Sudah Menikah" value={stats?.married ?? 0} href="/generus" />
            <StatCard icon="heart-off" color="orange" label="Belum Menikah" value={stats?.notMarried ?? 0} href="/generus" />
            <StatCard icon="calendar" color="green" label="Total Kegiatan" value={stats?.kegiatan ?? 0} href="/kegiatan" />
            <StatCard icon="calendar" color="emerald" label="Kegiatan Mandiri" value={stats?.mandiriKegiatan ?? 0} href="/mandiri/kegiatan" />
          </>
        )}
        {(role === "admin" || role === "pengurus_daerah" || role === "kmm_daerah" || role === "tim_pnkb" || role === "admin_romantic_room") && (
          <>
            <StatCard icon="file-text" color="orange" label="Artikel" value={stats?.artikel ?? 0} href="/admin/artikel" />
            <StatCard icon="file-text" color="red" label="Berita" value={stats?.berita ?? 0} href="/admin/berita" />
            <StatCard icon="user" color="purple" label="Total User" value={stats?.users ?? 0} href="/admin/users" />
          </>
        )}
      </div>

      <div className="responsive-grid-2">
        <QuickActions role={role} />
        <RecentInfo />
      </div>
    </div>
  );
}

function UserDashboard({ session, stats }: { session: any; stats: any }) {
  return (
    <div className={(session?.role === "creator" || session?.role === "generus") ? "responsive-grid-2" : ""}>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Kartu Anggota</span>
        </div>
        <div className="card-body">
             <div className="profile-hero" style={{ marginBottom: 0, paddingBottom: 0 }}>
               <div className="profile-avatar-large" style={{ width: 64, height: 64, fontSize: 24 }}>
                 {(session?.name || "U").charAt(0).toUpperCase()}
               </div>
               <div className="profile-hero-info">
                 <h3 style={{ margin: 0, fontSize: 18 }}>{session?.name || "User"}</h3>
                 <div className="text-muted" style={{ fontSize: 13 }}>{session?.email || "-"}</div>
                 <div className="badge badge-blue" style={{ marginTop: 8 }}>{session?.role || "-"}</div>
               </div>
             </div>
             <div style={{ marginTop: 24 }}>
                <a href="/profile" className="btn btn-primary btn-full">Buka Profil & Barcode QR</a>
             </div>
        </div>
      </div>
      
      {(session?.role === "creator" || session?.role === "generus") && (
        <div className="card">
           <div className="card-header">
             <span className="card-title">Ringkasan Aktivitas</span>
           </div>
           <div className="card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {session?.role !== "creator" && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", backgroundColor: "var(--bg)", borderRadius: "8px" }}>
                        <span className="text-sm font-semibold">Total Kegiatan</span>
                        <span className="badge badge-green font-bold">{stats?.kegiatan ?? 0}</span>
                    </div>
                  )}
                  {session?.role === "creator" && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", backgroundColor: "var(--bg)", borderRadius: "8px" }}>
                          <span className="text-sm font-semibold">Artikel Tayang</span>
                          <span className="badge badge-orange font-bold">{stats?.artikel ?? 0}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", backgroundColor: "var(--bg)", borderRadius: "8px" }}>
                          <span className="text-sm font-semibold">Berita Tayang</span>
                          <span className="badge badge-red font-bold">{stats?.berita ?? 0}</span>
                      </div>
                    </>
                  )}
              </div>
              {session.role === "creator" && (
                <div style={{ marginTop: 20 }}>
                     <a href="/artikel/tulis" className="btn btn-secondary btn-full">✏️ Tulis Artikel Baru</a>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, color, label, href, value }: {
  icon: string;
  color: string;
  label: string;
  href: string;
  value: number | string;
}) {
  const iconSvgs: Record<string, React.ReactNode> = {
    users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    "file-text": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
    user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    heart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
    "heart-off": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 2l20 20M19.5 13.5L21 12l-1.06-1.06a5.5 5.5 0 0 0-7.78-7.78l-1.06 1.06M9 3.13a5.5 5.5 0 0 0-5.83 5.48c0 .32.03.63.08.93l1.06 1.06L12 21.23l2.5-2.5" /></svg>,
    school: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>,
    "book-open": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>,
    library: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m16 6 4 14M12 6v14M8 8v12M4 4v16" /></svg>,
    "graduation-cap": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>,
    briefcase: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
  };

  return (
    <a href={href} className="stat-card" style={{ textDecoration: "none", display: "flex" }}>
      <div className={`stat-icon ${color}`}>{iconSvgs[icon]}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </a>
  );
}

function QuickActions({ role }: { role: string }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Aksi Cepat</span>
      </div>
      <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {role !== "creator" && role !== "generus" && (
          <>
            <a href="/generus" className="btn btn-primary btn-full">
              📂 Kelola Generus
            </a>
            {role !== "tim_pnkb" && (
              <>
                <a href="/kegiatan" className="btn btn-secondary btn-full">
                  📅 Kelola Kegiatan
                </a>
                <a href="/absensi" className="btn btn-secondary btn-full">
                  📷 Scan Absensi QR
                </a>
              </>
            )}
          </>
        )}
        {(role === "admin" || role === "pengurus_daerah" || role === "kmm_daerah" || role === "admin_romantic_room") && (
          <>
            {role !== "admin_romantic_room" && (
              <a href="/admin/katalog" className="btn btn-secondary btn-full">
                ❤️ Katalog PDKT
              </a>
            )}
            <a href="/mandiri/romantic-room" className="btn btn-secondary btn-full">
              💖 Admin Romantic Room
            </a>
          </>
        )}
        {(role === "admin" || role === "pengurus_daerah" || role === "kmm_daerah" || role === "creator") && (
          <a href="/artikel/tulis" className="btn btn-secondary btn-full">
            ✏️ Tulis Artikel Berita
          </a>
        )}
        {(role === "creator" || role === "generus") && (
          <a href="/profile" className="btn btn-primary btn-full">
            👤 Lihat Profil Saya
          </a>
        )}
      </div>
    </div>
  );
}

function RecentInfo() {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Informasi Sistem</span>
      </div>
      <div className="card-body">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            { label: "Kategori Usia", value: "PAUD, TK, SD, SMP, SMA, Kuliah, Bekerja" },
            { label: "Fitur QR Code", value: "Aktif - setiap generus memiliki QR unik" },
            { label: "Absensi", value: "Scan QR atau cari manual" },
            { label: "Artikel", value: "Submit artikel, admin yang mempublish" },
          ].map((info) => (
            <div key={info.label} style={{ borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
              <div className="text-sm font-semibold">{info.label}</div>
              <div className="text-sm text-muted" style={{ marginTop: "2px" }}>{info.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
