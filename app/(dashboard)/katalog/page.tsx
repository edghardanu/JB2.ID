"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { GenerusItem } from "@/lib/types";
import Link from "next/link";
import { Sparkles, Search, User, MapPin, Phone, GraduationCap, Briefcase, Heart, Globe, Calendar, Lock, Star, MessageCircle, UtilityPole as Utensils, Music, Share2, ClipboardList, Download, Eye, EyeOff } from "lucide-react";

export default function GenerusKatalogPage() {
  const [data, setData] = useState<GenerusItem[]>([]);
  const [myProfile, setMyProfile] = useState<GenerusItem | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authorizedChecked, setAuthorizedChecked] = useState(false);
  const [latestActivity, setLatestActivity] = useState<any>(null);
  const [selections, setSelections] = useState<any[]>([]);
  const [myQueues, setMyQueues] = useState<any[]>([]);
  const limit = 12;
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    if (!isAuthorized) return;
    setLoading(true);
    try {
      const isAdminRole = ["admin", "pengurus_daerah", "tim_pnkb", "admin_romantic_room", "kmm_daerah"].includes(myProfile?.role || "");
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search,
        jenisKelamin: gender,
        status: status,
        mandiriOnly: "true",
        ...(isAdminRole ? { all: "true" } : {})
      });
      const res = await fetch(`/api/generus?${params}`, { cache: "no-store" });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal mengambil data dari server");
      }

      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);

      // Fetch my selections
      if (myProfile?.id) {
        const selRes = await fetch(`/api/mandiri/pilih`);
        if (selRes.ok) {
          const selJson = await selRes.json();
          setSelections(selJson);
        }

        const qRes = await fetch(`/api/mandiri/antrean`);
        if (qRes.ok) {
          const qJson = await qRes.json();
          setMyQueues(qJson.filter((q: any) => q.generusId === myProfile.id));
        }
      }
    } catch (e: any) {
      console.error("fetchData error:", e);
      Swal.fire("Error", e.message || "Terjadi kesalahan sambungan", "error");
    } finally {
      setLoading(false);
    }
  }, [isAuthorized, search, page, gender, status]);

  // Initial Profile Load
  useEffect(() => {
    async function init() {
      try {
        const profileRes = await fetch("/api/profile", { cache: "no-store" });
        if (!profileRes.ok) throw new Error("Gagal mengambil profil");
        const profileJson = await profileRes.json();
        setMyProfile(profileJson);
        setIsAuthorized(!!profileJson.isInPdkt || ["generus", "tim_pnkb", "admin", "kmm_daerah", "pengurus_daerah", "admin_romantic_room"].includes(profileJson.role));
        
        // Fetch activity info
        const activityRes = await fetch("/api/mandiri/kegiatan?limit=1", { cache: "no-store" });
        if (activityRes.ok) {
          const activities = await activityRes.json();
          if (activities.length > 0) setLatestActivity(activities[0]);
        }
      } catch (e) {
        console.error("Init error:", e);
      } finally {
        setAuthorizedChecked(true);
      }
    }
    init();
  }, []);


  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handlePilih = async (targetId: string) => {
    if (!myProfile?.id) {
      Swal.fire("Info", "Akun Anda tidak terhubung dengan profil Generus", "info");
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: "Pilih Peserta?",
      text: "Anda akan memilih peserta ini untuk melakukan pertemuan PDKT. Maksimal 3 pilihan.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Pilih",
      cancelButtonText: "Batal"
    });

    if (!isConfirmed) return;

    try {
      const res = await fetch("/api/mandiri/pilih", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      await Swal.fire({
        title: "Berhasil!",
        text: "Peserta berhasil dipilih. Mari beralih ke Romantic Room.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });
      
      router.push("/mandiri/romantic-room");
    } catch (err: any) {
      Swal.fire("Gagal", err.message, "error");
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (!mounted) return null;

  if (loading && !authorizedChecked) {
    return (
      <div className="auth-fallback">
        <div className="spinner-pdkt"></div>
        <style jsx>{`
          .auth-fallback { min-height: 80vh; display: flex; align-items: center; justify-content: center; }
          .spinner-pdkt { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (authorizedChecked && !isAuthorized) {
    return (
      <div className="auth-fallback">
        <div className="auth-card-pdkt">
          <div className="lock-icon-wrapper">
            <Lock size={32} />
          </div>
          <h2>Akses Terbatas</h2>
          <p>Halaman ini hanya dapat diakses oleh pengguna yang sudah terdaftar dalam <b>Daftar Peserta Mandiri</b>.</p>
          
          <Link href="/dashboard" className="btn-pdkt-primary text-center pt-3 inline-block no-underline">
            Kembali ke Dashboard
          </Link>
        </div>
        <style jsx>{`
          .auth-fallback {
            min-height: 80vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f0f9ff;
          }
          .auth-card-pdkt {
            background: white;
            padding: 40px;
            border-radius: 32px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.05);
            text-align: center;
            max-width: 400px;
            border: 1px solid #eff6ff;
            position: relative;
            z-index: 10;
          }
          .lock-icon-wrapper {
            width: 64px;
            height: 64px;
            background: #fef2f2;
            color: #ef4444;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
          }
          .auth-card-pdkt h2 { font-size: 24px; font-weight: 800; margin-bottom: 12px; color: #111827; }
          .auth-card-pdkt p { color: #6b7280; margin-bottom: 24px; font-size: 15px; line-height: 1.6; }
          .btn-pdkt-primary {
            width: 100%;
            height: 50px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 16px;
            font-weight: 700;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 10px 20px rgba(37, 99, 235, 0.15);
          }
          .btn-pdkt-primary:hover { background: #1d4ed8; transform: scale(1.02); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="pdkt-admin-wrapper">
      <div className="pdkt-background no-print">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="pdkt-content">
        <header className="pdkt-header">
          <div className="badge-pdkt">
            <Sparkles size={14} style={{ marginRight: 6 }} />
            DATA PESERTA {gender === 'P' ? 'PEREMPUAN' : gender === 'L' ? 'LAKI-LAKI' : ''}
          </div>
          <h1>
            PESERTA <span>MANDIRI</span>
          </h1>
          <p className="subtitle">{latestActivity?.judul || "Tidak ada kegiatan"}</p>
        </header>

        <div className="explorer-toolbar no-print">
          <div className="search-box-fancy">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              className="search-input-fancy"
              placeholder="Cari nama, nomor unik, desa, atau kelompok..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            {loading && <div className="loading-spinner-small"></div>}
          </div>

          <div className="filter-groups-pdkt">
            <div className="filter-pills-fancy">
              <button className={`filter-pill ${gender === "all" ? "active" : ""}`} onClick={() => { setGender("all"); setPage(1); }}>Semua JK</button>
              <button className={`filter-pill ${gender === "L" ? "active" : ""}`} onClick={() => { setGender("L"); setPage(1); }}>Laki-Laki</button>
              <button className={`filter-pill ${gender === "P" ? "active" : ""}`} onClick={() => { setGender("P"); setPage(1); }}>Perempuan</button>
            </div>
            <div className="filter-pills-fancy">
              <button className={`filter-pill ${status === "all" ? "active" : ""}`} onClick={() => { setStatus("all"); setPage(1); }}>Semua Status</button>
              <button className={`filter-pill ${status === "peserta" ? "active" : ""}`} onClick={() => { setStatus("peserta"); setPage(1); }}>Peserta</button>
              <button className={`filter-pill ${status === "panitia" ? "active" : ""}`} onClick={() => { setStatus("panitia"); setPage(1); }}>Panitia</button>
            </div>
          </div>

          <div className="explorer-actions">
            <div className="stat-pill">
              <User size={14} />
              <span>Total: <b>{total}</b> Generus</span>
            </div>
            <button className="export-btn-pdkt" onClick={() => window.print()}>
              <Download size={14} />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {myProfile && !search && page === 1 && (
          <div className="my-profile-section no-print">
            <div className="section-title-label">
              <Sparkles size={16} />
              <span>Profil Saya</span>
            </div>
            <div className={`pdkt-card-compact my-highlight gender-${myProfile.jenisKelamin?.toLowerCase()}`}>
              <div className="card-header-compact">
                <div className="profile-top-compact">
                  <div className="card-avatar-compact">
                    {myProfile.foto ? (
                      <img src={myProfile.foto} alt={myProfile.nama} />
                    ) : (
                      <div className="initials-compact">{myProfile.nama.charAt(0)}</div>
                    )}
                    <div className="category-pill-abs">
                      {["admin", "tim_pnkb", "admin_romantic_room", "kmm_daerah", "pengurus_daerah"].includes(myProfile.role || "") ? "Panitia" : myProfile.kategoriUsia}
                    </div>
                  </div>
                  <div className="profile-info-compact">
                    <h3 className="name-compact">{myProfile.nama}</h3>
                    <div className="id-compact">ID: {myProfile.nomorUnik}</div>
                    <div className="loc-compact">
                      <MapPin size={10} />
                      <span>{myProfile.mandiriDesaNama || myProfile.desaNama} &bull; {myProfile.mandiriKelompokNama || myProfile.kelompokNama}</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                       <div style={{ background: "#eff6ff", color: "#1e40af", padding: "6px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: "900", display: "flex", alignItems: "center", gap: "6px", border: "1.5px solid #dbeafe" }}>
                          <User size={14} strokeWidth={3} />
                          <span style={{ opacity: 0.7, marginRight: "2px" }}>Umur:</span>
                          {(() => {
                            if (!myProfile.tanggalLahir) return "-";
                            const birthDate = new Date(myProfile.tanggalLahir);
                            if (isNaN(birthDate.getTime())) return "-";
                            const today = new Date();
                            let age = today.getFullYear() - birthDate.getFullYear();
                            const m = today.getMonth() - birthDate.getMonth();
                            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
                            return age + " Tahun";
                          })()}
                       </div>
                       {myProfile.instagram && (
                         <div style={{ background: "#fdf2f8", color: "#be185d", padding: "6px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: "900", display: "flex", alignItems: "center", gap: "6px", border: "1.5px solid #fce7f3" }}>
                            <Globe size={14} strokeWidth={3} />
                            <span style={{ opacity: 0.7, marginRight: "2px" }}>Instagram:</span>
                            <a 
                              href={`https://instagram.com/${myProfile.instagram}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: "inherit", textDecoration: "none" }}
                            >
                              @{myProfile.instagram}
                            </a>
                         </div>
                       )}
                    </div>
                  </div>
                  {/* QR Code for Printing */}
                  <div className="qr-print-only">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${myProfile.nomorUnik}`}
                      alt="QR Code"
                    />
                  </div>
                  <div className="badge-logged-in">Data Anda</div>
                </div>
              </div>
              <div className="card-body-compact">
                <div className="info-grid-compact">
                  <div className="info-bit">
                    <Calendar size={11} className="bit-icon" />
                    <div><span className="bit-label">TTL</span><p className="bit-value">{myProfile.tempatLahir || "-"}, {myProfile.tanggalLahir || "-"}</p></div>
                  </div>
                  <div className="info-bit">
                    <Globe size={11} className="bit-icon" />
                    <div><span className="bit-label">Suku</span><p className="bit-value">{myProfile.suku || "-"}</p></div>
                  </div>
                  <div className="info-bit">
                    <Heart size={11} className="bit-icon text-pink-500" />
                    <div><span className="bit-label">Status</span><p className="bit-value">{myProfile.statusNikah || "Belum Menikah"}</p></div>
                  </div>
                  <div className="info-bit">
                    <Phone size={11} className="bit-icon" />
                    <div><span className="bit-label">Kontak</span><p className="bit-value">{myProfile.noTelp || "-"}</p></div>
                  </div>
                </div>
                <div className="card-actions-compact">
                  <Link href={`/katalog/${myProfile.id}`} className="btn-detail-pdkt">
                    <ClipboardList size={14} />
                    <span>Detail Profil Saya</span>
                  </Link>
                </div>
              </div>
            </div>
            <div className="list-separator">
              <div className="line"></div>
              <span>Daftar Seluruh Peserta Mandiri</span>
              <div className="line"></div>
            </div>
          </div>
        )}

        {loading && data.length === 0 ? (
          <div className="pdkt-loading-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton-card-compact"></div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="empty-state-pdkt">
            <User size={64} strokeWidth={1} />
            <h3>Tidak ada data ditemukan</h3>
            <p>Coba gunakan kata kunci pencarian lain untuk menemukan generus.</p>
          </div>
        ) : (
          <div className="pdkt-grid-compact">
            {data.map((item) => (
              <div key={item.id} className={`pdkt-card-compact gender-${item.jenisKelamin?.toLowerCase()}`}>
                <div className="card-header-compact">
                  <div className="profile-top-compact">
                    <div className="card-avatar-compact">
                      {item.foto ? (
                        <img src={item.foto} alt={item.nama} />
                      ) : (
                        <div className="initials-compact">{item.nama.charAt(0)}</div>
                      )}
                      <div className="category-pill-abs">
                        {["admin", "tim_pnkb", "admin_romantic_room", "kmm_daerah", "pengurus_daerah"].includes(item.role || "") ? "Panitia" : item.kategoriUsia}
                      </div>
                    </div>
                    <div className="profile-info-compact">
                      <h3 className="name-compact">{item.nama}</h3>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <div className="id-compact">ID: {item.nomorUnik}</div>
                        {item.nomorUrut && (
                          <div className="id-compact" style={{ color: "var(--primary)", background: "var(--primary-light)", padding: "0 4px", borderRadius: "4px" }}>
                            #{item.nomorUrut}
                          </div>
                        )}
                      </div>
                      <div className="loc-compact">
                        <MapPin size={10} />
                        <span>{item.mandiriDesaNama || item.desaNama} &bull; {item.mandiriKelompokNama || item.kelompokNama}</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
                        {["admin", "admin_romantic_room", "tim_pnkb", "pengurus_daerah"].includes(myProfile?.role || "") && (
                           <div style={{ background: "#eff6ff", color: "#1e40af", padding: "4px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "900", display: "flex", alignItems: "center", gap: "4px", border: "1.5px solid #dbeafe" }}>
                              <User size={12} strokeWidth={3} />
                              <span style={{ opacity: 0.7, marginRight: "1px" }}>Umur:</span>
                              {(() => {
                                if (!item.tanggalLahir) return "-";
                                const birthDate = new Date(item.tanggalLahir);
                                if (isNaN(birthDate.getTime())) return "-";
                                const today = new Date();
                                let age = today.getFullYear() - birthDate.getFullYear();
                                const m = today.getMonth() - birthDate.getMonth();
                                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
                                return age + " Thn";
                              })()}
                           </div>
                        )}
                        {["admin", "admin_romantic_room", "tim_pnkb", "pengurus_daerah"].includes(myProfile?.role || "") && item.instagram && (
                           <div style={{ background: "#fdf2f8", color: "#be185d", padding: "4px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "900", display: "flex", alignItems: "center", gap: "4px", border: "1.5px solid #fce7f3" }}>
                              <Globe size={12} strokeWidth={3} />
                              <span style={{ opacity: 0.7, marginRight: "1px" }}>IG:</span>
                              <a 
                                href={`https://instagram.com/${item.instagram}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ color: "inherit", textDecoration: "none" }}
                              >
                                @{item.instagram}
                              </a>
                           </div>
                        )}
                      </div>
                    </div>
                    {/* QR Code for Printing */}
                    <div className="qr-print-only">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${item.nomorUnik}`}
                        alt="QR Code"
                      />
                    </div>
                  </div>
                </div>

                <div className="card-body-compact">
                  <div className="info-grid-compact">
                    <div className="info-bit">
                      <Calendar size={11} className="bit-icon" />
                      <div>
                        <span className="bit-label">TTL</span>
                        <p className="bit-value truncate-compact">{item.tempatLahir || "-"}, {item.tanggalLahir || "-"}</p>
                      </div>
                    </div>
                    {["admin", "generus", "admin_romantic_room", "tim_pnkb", "pengurus_daerah"].includes(myProfile?.role || "") && (
                      <div className="info-bit">
                        <User size={11} className="bit-icon" />
                        <div>
                          <span className="bit-label">Umur</span>
                          <p className="bit-value">
                            {(() => {
                              if (!item.tanggalLahir) return "-";
                              const birthDate = new Date(item.tanggalLahir);
                              if (isNaN(birthDate.getTime())) return "-";
                              const today = new Date();
                              let age = today.getFullYear() - birthDate.getFullYear();
                              const m = today.getMonth() - birthDate.getMonth();
                              if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                age--;
                              }
                              return age + " Tahun";
                            })()}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="info-bit">
                      <Heart size={11} className="bit-icon text-pink-500" />
                      <div>
                        <span className="bit-label">Status</span>
                        <p className="bit-value">{item.statusNikah || "Belum Menikah"}</p>
                      </div>
                    </div>
                    <div className="info-bit">
                      <Globe size={11} className="bit-icon" />
                      <div>
                        <span className="bit-label">Suku</span>
                        <p className="bit-value">{item.suku || "-"}</p>
                      </div>
                    </div>
                    {["admin", "kmm_daerah", "admin_romantic_room", "tim_pnkb", "pengurus_daerah"].includes(myProfile?.role || "") && (
                      <div className="info-bit">
                        <Phone size={11} className="bit-icon" />
                        <div>
                          <span className="bit-label">Kontak</span>
                          <p className="bit-value">{item.noTelp || "-"}</p>
                        </div>
                      </div>
                    )}
                    {["admin", "generus", "admin_romantic_room", "tim_pnkb", "pengurus_daerah"].includes(myProfile?.role || "") && item.instagram && (
                      <div className="info-bit">
                        <Globe size={11} className="bit-icon" stroke="#e1306c" />
                        <div>
                          <span className="bit-label">Instagram</span>
                          <p className="bit-value">
                            <a 
                              href={`https://instagram.com/${item.instagram}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: "inherit", textDecoration: "none" }}
                            >
                              @{item.instagram}
                            </a>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="divider-compact" />

                  <div className="info-grid-compact">
                    <div className="info-bit">
                      <GraduationCap size={11} className="bit-icon" />
                      <div>
                        <span className="bit-label">Pendidikan</span>
                        <p className="bit-value">{item.pendidikan || "-"}</p>
                      </div>
                    </div>
                    <div className="info-bit">
                      <Briefcase size={11} className="bit-icon" />
                      <div>
                        <span className="bit-label">Pekerjaan</span>
                        <p className="bit-value">{item.pekerjaan || "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="passion-section-compact">
                    <div className="passion-item-compact">
                      <Music size={12} />
                      <span className="bit-value truncate-compact"><b>Hobi:</b> {item.hobi || "-"}</span>
                    </div>
                    <div className="passion-item-compact">
                      <Utensils size={12} />
                      <span className="bit-value truncate-compact"><b>Makan/Minuman:</b> {item.makananMinumanFavorit || "-"}</span>
                    </div>
                  </div>

                  {["admin", "kmm_daerah", "admin_romantic_room", "tim_pnkb", "pengurus_daerah"].includes(myProfile?.role || "") && (
                    <div className="address-box-compact">
                      <span className="bit-label">Alamat:</span>
                      <p className="addr-text-compact">{item.alamat || "Alamat belum diisi."}</p>
                    </div>
                  )}

                  <div className="card-actions-compact" style={{ gap: '10px' }}>
                    <Link href={`/katalog/${item.id}`} className="btn-detail-pdkt" style={{ flex: 1 }}>
                      <ClipboardList size={14} />
                      <span>Detail</span>
                    </Link>
                    {item.id !== myProfile?.generusId && (
                      <button 
                        className={`btn-pilih-pdkt ${selections.some(s => s.penerimaId === item.id) ? 'selected' : ''}`}
                        onClick={() => handlePilih(item.id)}
                        disabled={selections.some(s => s.penerimaId === item.id) || loading}
                      >
                        {selections.some(s => s.penerimaId === item.id) ? (
                          <> <Star size={14} fill="currentColor" /> Selected</>
                        ) : (
                          <> <Heart size={14} /> Pilih</>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="card-footer-compact">
                  <span>Terdaftar: {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : "-"}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination-pdkt no-print">
            <button
              className="page-nav-btn"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </button>
            <div className="page-indicator">
              Halaman <b>{page}</b> dari {totalPages}
            </div>
            <button
              className="page-nav-btn"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Berikutnya
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .pdkt-admin-wrapper { 
          min-height: 100vh; 
          background: #f8fafc; 
          position: relative; 
          overflow: hidden; 
          font-family: 'Inter', sans-serif; 
          padding: 30px 20px; 
        }
        .pdkt-background { position: absolute; inset: 0; z-index: 0; }
        .blob { position: absolute; filter: blur(100px); opacity: 0.2; border-radius: 50%; }
        .blob-1 { width: 500px; height: 500px; background: #3b82f6; top: -100px; right: -100px; }
        .blob-2 { width: 400px; height: 400px; background: #60a5fa; bottom: -50px; left: -50px; }
        
        .pdkt-content { max-width: 1400px; margin: 0 auto; position: relative; z-index: 10; }
        .pdkt-header { text-align: center; margin-bottom: 30px; }
        .badge-pdkt { display: inline-flex; align-items: center; background: #eff6ff; color: #2563eb; padding: 5px 12px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px; }
        .pdkt-header h1 { font-size: 32px; font-weight: 900; color: #1e293b; margin-bottom: 5px; }
        .pdkt-header h1 span { color: #3b82f6; }
        .subtitle { color: #64748b; font-size: 14px; }

        .explorer-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 25px;
        }

        @media (max-width: 900px) {
          .explorer-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 15px;
          }
          .filter-groups-pdkt { width: 100%; }
          .filter-pills-fancy { width: 100%; display: grid; grid-template-columns: 1fr 1fr 1fr; }
          .filter-pill { text-align: center; }
          .search-box-fancy {
            max-width: none !important;
          }
          .explorer-actions {
            justify-content: space-between;
          }
        }

        @media (max-width: 640px) {
          .pdkt-header h1 { font-size: 24px; }
          .subtitle { font-size: 13px; }
          .stat-pill span { display: none; } /* Hide text on mobile pills */
          .export-btn-pdkt span { display: none; } /* Hide button text on mobile */
          .export-btn-pdkt { padding: 8px 12px; }
          .pdkt-admin-wrapper { padding: 20px 12px; }
          .pdkt-grid-compact {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        .search-box-fancy {
          flex: 1;
          max-width: 450px;
          position: relative;
          background: white;
          border-radius: 12px;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }
        .search-input-fancy { 
          border: none; outline: none; width: 100%; font-size: 14px; color: #1e293b; background: transparent;
        }

        .filter-groups-pdkt {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .filter-pills-fancy {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 10px;
          gap: 2px;
          border: 1px solid #e2e8f0;
        }
        .filter-pill {
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          background: transparent;
          color: #64748b;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .filter-pill:hover { color: #1e293b; background: rgba(0,0,0,0.03); }
        .filter-pill.active {
          background: white;
          color: #2563eb;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .explorer-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .export-btn-pdkt {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #1e293b;
          color: white;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.3s;
        }
        .export-btn-pdkt:hover { background: #111827; transform: translateY(-2px); }

        .stat-pill {
          background: white;
          color: #1e293b;
          padding: 8px 14px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid #e2e8f0;
        }

        .pdkt-grid-compact {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
          gap: 20px;
        }

        .pdkt-card-compact {
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
          border: 1px solid #f1f5f9;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }
        .pdkt-card-compact:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
          border-color: #3b82f633;
        }

        .card-header-compact {
          padding: 18px;
          background: #fbfcfe;
          border-bottom: 1px solid #f1f5f9;
        }
        .profile-top-compact {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .card-avatar-compact {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          overflow: hidden;
          background: #f1f5f9;
          position: relative;
          flex-shrink: 0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .card-avatar-compact img { width: 100%; height: 100%; object-fit: cover; }
        .initials-compact {
          width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #3b82f6, #60a5fa); color: white; font-size: 24px; font-weight: 800;
        }
        .gender-p .initials-compact { background: linear-gradient(135deg, #f472b6, #fb923c); }

        .category-pill-abs {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: rgba(255,255,255,0.95); padding: 1px 0; text-align: center;
          font-size: 8px; font-weight: 800; text-transform: uppercase; color: #64748b;
        }

        .name-compact { font-size: 16px; font-weight: 800; color: #1e293b; margin-bottom: 2px; line-height: 1.2; }
        .id-compact { font-size: 10px; font-weight: 700; color: #94a3b8; font-family: monospace; }
        .loc-compact { display: flex; align-items: center; gap: 4px; color: #64748b; font-size: 11px; font-weight: 500; margin-top: 4px; }

        .card-body-compact { padding: 18px; flex: 1; }
        .info-grid-compact { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .info-bit { display: flex; gap: 8px; align-items: flex-start; }
        .bit-icon { color: #3b82f6; opacity: 0.7; margin-top: 2px; flex-shrink: 0; }
        .gender-p .bit-icon { color: #ec4899; }
        .bit-label { display: block; font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 1px; }
        .bit-value { font-size: 11px; font-weight: 600; color: #334155; line-height: 1.2; }
        .truncate-compact { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .divider-compact { height: 1px; background: #f1f5f9; margin: 12px 0; }

        .passion-section-compact {
          background: #f8fafc; border-radius: 12px; padding: 10px;
          display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;
        }
        .passion-item-compact { display: flex; align-items: center; gap: 8px; color: #3b82f6; }
        .gender-p .passion-item-compact { color: #ec4899; }
        .passion-item-compact .bit-value { color: #475569; }
        
        .card-actions-compact {
          margin-top: 15px;
          display: flex;
          justify-content: flex-end;
        }
        
        .btn-detail-pdkt {
          background: #eff6ff;
          color: #2563eb;
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s;
          text-decoration: none;
        }
        
        .btn-detail-pdkt:hover {
          background: #2563eb;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
        }

        .btn-pilih-pdkt {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #fdf2f8;
          color: #db2777;
          border: 1px solid #fce7f3;
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-pilih-pdkt:hover:not(:disabled) {
          background: #db2777;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(219, 39, 119, 0.15);
        }
        .btn-pilih-pdkt.selected {
          background: #10b981;
          color: white;
          border-color: #059669;
          cursor: default;
        }
        .btn-pilih-pdkt:disabled { opacity: 0.7; cursor: not-allowed; }
        
        .gender-p .btn-detail-pdkt { background: #fff1f2; color: #ec4899; }
        .gender-p .btn-detail-pdkt:hover { background: #ec4899; color: white; }

        .address-box-compact { border-top: 1px dashed #e2e8f0; padding-top: 10px; }
        .addr-text-compact { font-size: 11px; color: #64748b; font-style: italic; line-height: 1.4; margin-top: 2px; }

        .card-footer-compact { padding: 10px 18px; background: #fcfdfe; color: #cbd5e1; font-size: 9px; font-weight: 600; text-align: right; }

        .pagination-pdkt { display: flex; align-items: center; justify-content: center; gap: 15px; padding: 30px 0; }
        .page-nav-btn { background: white; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; color: #475569; transition: all 0.2s; }
        .page-nav-btn:hover:not(:disabled) { border-color: #3b82f6; color: #3b82f6; }
        .page-indicator { color: #64748b; font-size: 13px; }

        .skeleton-card-compact { height: 350px; background: white; border-radius: 24px; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

          @media print {
            @page { size: landscape; margin: 0; }
            body, html { visibility: hidden; height: auto !important; background: white !important; }
            .pdkt-admin-wrapper, .pdkt-content { 
              visibility: visible !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              display: block !important;
              padding: 10mm !important;
            }
            .no-print, .pdkt-background, .pdkt-footer, .pdkt-background-blob { display: none !important; visibility: hidden !important; }
          .pdkt-grid-compact { 
             display: grid !important; 
             grid-template-columns: repeat(4, 1fr) !important;
             gap: 12px !important; 
          }
          .pdkt-card-compact { 
             break-inside: avoid !important; 
             page-break-inside: avoid !important;
             border: 0.5px solid #2563eb !important;
             background: #3b82f6 !important; /* Solid blue background */
             padding: 15px !important;
             border-radius: 12px !important;
             display: flex !important;
             flex-direction: column !important;
             align-items: center !important;
             text-align: center !important;
             min-height: 220px !important; /* Taller for Portrait style */
          }
          .pdkt-card-compact:hover { transform: none !important; box-shadow: none !important; }
          .card-header-compact { padding: 0 !important; border: none !important; background: transparent !important; width: 100% !important; }
          .profile-top-compact { flex-direction: column !important; align-items: center !important; gap: 8px !important; width: 100% !important; }
          .badge-logged-in, .id-compact { display: none !important; }
          
          .name-compact { font-size: 13px !important; font-weight: 800 !important; margin-bottom: 6px !important; color: white !important; line-height: 1.2 !important; height: auto !important; }
          .loc-compact { justify-content: center !important; font-size: 10px !important; color: rgba(255,255,255,0.9) !important; font-weight: 600 !important; margin-top: auto !important; padding-top: 10px !important; border-top: 1px dashed rgba(255,255,255,0.3) !important; width: 100% !important; }
          
          .qr-print-only { display: block !important; margin: 15px 0 !important; background: white !important; padding: 5px !important; border-radius: 8px !important; }
          .qr-print-only img { width: 75px !important; height: 75px !important; margin: 0 auto !important; }

          .info-grid-compact, .passion-section-compact, .address-box-compact, .divider-compact, .card-footer-compact, .card-actions-compact, .pagination-pdkt { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }

        .qr-print-only { display: none; }

        .my-profile-section { margin-bottom: 40px; }
        .section-title-label { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 800; color: #2563eb; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1.5px; }
        .my-highlight { border: 2px solid #2563eb !important; background: linear-gradient(135deg, white, #eff6ff) !important; max-width: 450px; }
        .gender-p .my-highlight { border-color: #ec4899 !important; background: linear-gradient(135deg, white, #fff1f2) !important; }
        .gender-p .section-title-label { color: #ec4899; }
        .badge-logged-in { position: absolute; top: 18px; right: 18px; background: #2563eb; color: white; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
        .gender-p .badge-logged-in { background: #ec4899; }
        
        .list-separator { display: flex; align-items: center; gap: 20px; margin: 50px 0 30px; opacity: 0.5; }
        .list-separator .line { flex: 1; height: 1px; background: #e2e8f0; }
        .list-separator span { font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 2px; }
      `}</style>
    </div>
  );
}
