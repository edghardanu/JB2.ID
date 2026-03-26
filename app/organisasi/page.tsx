import { db } from "@/lib/db";
import { users, generus, kegiatan } from "@/lib/schema";
import { eq, desc, inArray } from "drizzle-orm";
import Link from "next/link";
import { getSession } from "@/lib/auth";

import HomeHeader from "@/components/HomeHeader";

async function getKegiatan(limit = 20) {
  try {
    return await db.select().from(kegiatan).orderBy(desc(kegiatan.tanggal)).limit(limit);
  } catch {
    return [];
  }
}

async function getMembers(limit = 24) {
  try {
    return await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        foto: generus.foto,
      })
      .from(users)
      .leftJoin(generus, eq(users.generusId, generus.id))
      .where(inArray(users.role, ["admin", "desa", "kelompok", "creator"]))
      .orderBy(desc(users.createdAt))
      .limit(limit);
  } catch {
    return [];
  }
}

function formatDateShort(dateStr: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function OrganisasiPage() {
  const session = await getSession();
  const allKegiatan = await getKegiatan();
  const allMembers = await getMembers();

  return (
    <>
      <style>{`
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          font-family: 'Inter', sans-serif;
          color: #111827;
          background: #f8fafc;
          line-height: 1.6;
        }
        a { text-decoration: none; color: inherit; }
        
        :root {
          --primary:  #2563eb;
          --primary-dk: #1d4ed8;
          --primary-lt: #eff6ff;
          --secondary: #64748b;
          --success:  #16a34a;
          --success-dk: #15803d;
          --success-lt: #dcfce7;
          --danger:   #dc2626;
          --navy:     #1e293b;
          --slate:    #334155;
          --gray:     #64748b;
          --gray-lt:  #94a3b8;
          --border:   #e2e8f0;
          --white:    #ffffff;
          --serif:    'Merriweather', Georgia, serif;
        }

        .wrap { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

        .navbar {
          background: var(--primary-dk);
          position: sticky; top: 0; z-index: 100;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .navbar-inner {
          display: flex; align-items: center; justify-content: space-between;
          height: 52px;
        }
        .nav-links { display: flex; }
        .nav-link {
          display: block; padding: 12px 15px;
          font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.75);
          letter-spacing: 0.2px; transition: all 0.18s;
        }
        .nav-link:hover { color: white; }

        .page-hero {
          background: linear-gradient(135deg, var(--navy) 0%, var(--slate) 100%);
          padding: 80px 0;
          color: white;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .page-hero-title {
          font-family: var(--serif);
          font-size: 42px; font-weight: 900;
          margin-bottom: 16px; position: relative;
        }
        .page-hero-sub {
          font-size: 18px; color: rgba(255,255,255,0.7);
          max-width: 700px; margin: 0 auto; position: relative;
        }

        .section { padding: 80px 0; border-bottom: 1px solid var(--border); }
        .section:last-child { border-bottom: none; }
        .section:nth-child(even) { background: white; }

        .sect-hd {
          margin-bottom: 40px; text-align: center;
        }
        .sect-hd-title {
          font-family: var(--serif); font-size: 32px; font-weight: 900;
          color: var(--navy); margin-bottom: 12px;
          display: inline-block; position: relative; padding-bottom: 12px;
        }
        .sect-hd-title::after {
          content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
          width: 60px; height: 4px; background: var(--primary); border-radius: 2px;
        }

        .keg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 30px; }
        .keg-card {
          background: white; border: 1px solid var(--border); border-radius: 16px;
          padding: 30px; transition: all 0.3s ease;
          display: flex; flex-direction: column;
        }
        .keg-card:hover { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(0,0,0,0.08); border-color: var(--primary); }
        .keg-date {
          display: inline-block; padding: 6px 12px; background: var(--primary-lt);
          color: var(--primary); font-size: 11px; font-weight: 800; border-radius: 8px;
          margin-bottom: 16px; text-transform: uppercase;
        }
        .keg-title { font-family: var(--serif); font-size: 22px; font-weight: 800; color: var(--navy); margin-bottom: 12px; }
        .keg-desc { font-size: 14px; color: var(--gray); margin-bottom: 20px; line-height: 1.6; flex: 1; }
        .keg-loc { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--gray-lt); font-weight: 600; }

        .mem-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 24px; }
        .mem-card {
          background: #f8fafc; border: 1px solid var(--border); border-radius: 20px;
          padding: 32px 20px; text-align: center; transition: all 0.3s;
        }
        .mem-card:hover { background: white; border-color: var(--primary); transform: scale(1.02); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .mem-avatar {
          width: 90px; height: 90px; border-radius: 50%; background: white;
          margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;
          font-size: 32px; font-weight: 800; color: var(--gray-lt);
          border: 4px solid var(--primary-lt); box-shadow: 0 4px 10px rgba(0,0,0,0.1); overflow: hidden;
        }
        .mem-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .mem-name { font-size: 16px; font-weight: 700; color: var(--navy); margin-bottom: 6px; }
        .mem-role { font-size: 11px; color: var(--primary); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }

        .empty {
          text-align: center; padding: 60px; color: var(--gray-lt);
          background: white; border-radius: 20px; border: 2px dashed var(--border);
        }

        .footer { background: var(--navy); color: white; padding: 60px 0 30px; }
        .footer-inner { display: flex; justify-content: space-between; align-items: center; }
        .footer-logo { font-family: var(--serif); font-size: 24px; font-weight: 900; }
        .footer-copy { font-size: 13px; color: rgba(255,255,255,0.5); }

        @media (max-width: 768px) {
          .page-hero-title { font-size: 32px; }
          .keg-grid, .mem-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <HomeHeader session={session} />

      <nav className="navbar">
        <div className="wrap">
          <div className="navbar-inner">
            <div className="nav-links">
              <Link href="/" className="nav-link">Beranda</Link>
              <Link href="/organisasi" className="nav-link" style={{ color: 'white' }}>Organisasi</Link>
            </div>
          </div>
        </div>
      </nav>

      <header className="page-hero">
        <div className="wrap">
          <h1 className="page-hero-title">Informasi Organisasi</h1>
          <p className="page-hero-sub">
            Mengenal lebih dekat struktur kepengurusan dan agenda kegiatan kami.
          </p>
        </div>
      </header>

      <main>
        <section id="kegiatan" className="section">
          <div className="wrap">
            <div className="sect-hd">
              <h2 className="sect-hd-title">Agenda Kegiatan</h2>
            </div>
            {allKegiatan.length > 0 ? (
              <div className="keg-grid">
                {allKegiatan.map((k) => (
                  <div key={k.id} className="keg-card">
                    <span className="keg-date">{formatDateShort(k.tanggal)}</span>
                    <h3 className="keg-title">{k.judul}</h3>
                    <p className="keg-desc">{k.deskripsi || "Tidak ada deskripsi tersedia."}</p>
                    <div className="keg-loc">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      {k.lokasi || "Lokasi belum ditentukan"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">
                <p>Belum ada jadwal kegiatan yang dipublikasikan.</p>
              </div>
            )}
          </div>
        </section>

        <section id="profile" className="section">
          <div className="wrap">
            <div className="sect-hd">
              <h2 className="sect-hd-title">Profil Anggota</h2>
            </div>
            {allMembers.length > 0 ? (
              <div className="mem-grid">
                {allMembers.map((m) => (
                  <div key={m.id} className="mem-card">
                    <div className="mem-avatar">
                      {m.foto
                        ? <img src={m.foto} alt={m.name} />
                        : (m.name.split(' ').map((n: any) => n[0]).slice(0, 2).join('').toUpperCase() || "?")
                      }
                    </div>
                    <div className="mem-name">{m.name}</div>
                    <div className="mem-role">
                      {m.role === 'admin' && 'Admin Utama'}
                      {m.role === 'desa' && 'Pengurus Desa'}
                      {m.role === 'kelompok' && 'Pengurus Kelompok'}
                      {m.role === 'creator' && 'Kontributor'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">
                <p>Data kepengurusan sedang dalam proses pembaharuan.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap">
          <div className="footer-inner">
            <div className="footer-logo">JB2.ID</div>
            <div className="footer-copy">© 2026 JB2.ID</div>
          </div>
        </div>
      </footer>
    </>
  );
}
