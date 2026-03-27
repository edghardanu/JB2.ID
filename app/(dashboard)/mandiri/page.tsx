"use client";

import Topbar from "@/components/Topbar";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { GenerusItem } from "@/lib/types";
import GenerusModal from "../generus/GenerusModal";

interface MandiriItem {
  id: string;
  nomorUrut?: number;
  statusMandiri: string;
  catatan: string;
  generusId: string;
  nomorUnik: string;
  nama: string;
  jenisKelamin: string;
  kategoriUsia: string;
  desaNama: string;
  kelompokNama: string;
  noTelp: string;
  foto: string;
  createdAt: string;
}

export default function MandiriPage() {
  const [data, setData] = useState<MandiriItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [deadline, setDeadline] = useState("");
  const [regTitle, setRegTitle] = useState("");
  const [regDesc, setRegDesc] = useState("");
  const [isPastDeadline, setIsPastDeadline] = useState(false);

  // SIDEBAR & DRAG-DROP STATES
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [generusList, setGenerusList] = useState<GenerusItem[]>([]);
  const [generusSearch, setGenerusSearch] = useState("");
  const [generusLoading, setGenerusLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const limit = 20;

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(d => setUserRole(d.role || ""));
    
    // Fetch individual settings
    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings");
            const s = await res.json();
            const deadlv = s.mandiri_registration_deadline || "";
            setDeadline(deadlv);
            setIsPastDeadline(deadlv ? new Date() > new Date(deadlv) : false);
            setRegTitle(s.mandiri_registration_title || "");
            setRegDesc(s.mandiri_registration_description || "");
        } catch (e) {
            console.error("Failed to fetch unified settings:", e);
        }
    };
    fetchSettings();
  }, []);

  const fetchUnregisteredGenerus = useCallback(async () => {
    setGenerusLoading(true);
    try {
      const params = new URLSearchParams({ search: generusSearch, notInMandiri: "true", limit: "15" });
      const res = await fetch(`/api/generus?${params}`);
      const json = await res.json();
      setGenerusList(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerusLoading(false);
    }
  }, [generusSearch]);

  useEffect(() => {
    if (sidebarOpen) fetchUnregisteredGenerus();
  }, [sidebarOpen, fetchUnregisteredGenerus]);

  const handleSettings = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Pengaturan Pendaftaran",
      html: `
        <div style="text-align: left">
          <label class="form-label">Nama Kegiatan / Judul Form</label>
          <input id="swal-title" class="form-control" value="${regTitle}" placeholder="Contoh: Pra-Nikah Daerah 2024" style="margin-bottom: 12px">
          <label class="form-label">Deskripsi Kegiatan</label>
          <textarea id="swal-desc" class="form-control" rows="3" placeholder="Contoh: Diikuti oleh seluruh usia mandiri..." style="margin-bottom: 12px">${regDesc}</textarea>
          <label class="form-label">Batas Waktu (Deadline)</label>
          <input id="swal-deadline" type="datetime-local" class="form-control" value="${deadline ? new Date(deadline).toISOString().slice(0, 16) : ""}">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Simpan",
      preConfirm: () => {
        return {
          title: (document.getElementById("swal-title") as HTMLInputElement).value,
          desc: (document.getElementById("swal-desc") as HTMLTextAreaElement).value,
          deadline: (document.getElementById("swal-deadline") as HTMLInputElement).value,
        };
      },
      footer: "Nama & deskripsi akan muncul di form publik"
    });

    if (formValues) {
      try {
        await Promise.all([
            fetch("/api/mandiri/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: "mandiri_registration_title", value: formValues.title }),
            }),
            fetch("/api/mandiri/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: "mandiri_registration_description", value: formValues.desc }),
            }),
            fetch("/api/mandiri/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: "mandiri_registration_deadline", value: formValues.deadline }),
            })
        ]);
        setRegTitle(formValues.title);
        setRegDesc(formValues.desc);
        setDeadline(formValues.deadline);
        Swal.fire({ icon: "success", title: "Berhasil disimpan", timer: 1000, showConfirmButton: false });
      } catch (e: any) {
        Swal.fire({ icon: "error", title: "Error", text: e.message });
      }
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, page: String(page), limit: String(limit) });
      const res = await fetch(`/api/mandiri?${params}`);
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, page]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async (generusId: string) => {
    if (isPastDeadline) {
      Swal.fire({ icon: "warning", title: "Pendaftaran Ditutup", text: "Batas waktu pendaftaran telah berakhir. Tidak dapat menambah peserta baru secara manual." });
      return;
    }
    try {
      const res = await fetch("/api/mandiri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generusId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      
      Swal.fire({ icon: "success", title: "Berhasil", text: "Berhasil menambahkan ke daftar mandiri", timer: 1500, showConfirmButton: false });
      fetchData();
      if (sidebarOpen) fetchUnregisteredGenerus();
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "Gagal", text: e.message });
    }
  };

  const handleUpdate = async (item: MandiriItem) => {
    const { value: formValues } = await Swal.fire({
      title: "Update Status Mandiri",
      html: `
        <div style="text-align: left">
          <label class="form-label">Status</label>
          <select id="swal-status" class="form-control" style="margin-bottom: 12px">
            <option value="Aktif" ${item.statusMandiri === "Aktif" ? "selected" : ""}>Aktif</option>
            <option value="Selesai" ${item.statusMandiri === "Selesai" ? "selected" : ""}>Selesai</option>
            <option value="Batal" ${item.statusMandiri === "Batal" ? "selected" : ""}>Batal</option>
          </select>
          <label class="form-label">Catatan</label>
          <textarea id="swal-catatan" class="form-control">${item.catatan || ""}</textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        return {
          statusMandiri: (document.getElementById("swal-status") as HTMLSelectElement).value,
          catatan: (document.getElementById("swal-catatan") as HTMLTextAreaElement).value,
        };
      },
    });

    if (formValues) {
      try {
        const res = await fetch("/api/mandiri", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, ...formValues }),
        });
        if (!res.ok) throw new Error("Gagal update");
        Swal.fire({ icon: "success", title: "Berhasil", timer: 1000, showConfirmButton: false });
        fetchData();
      } catch (e: any) {
        Swal.fire({ icon: "error", title: "Error", text: e.message });
      }
    }
  };

  const handleDelete = async (id: string) => {
    const res = await Swal.fire({
      title: "Hapus dari Daftar?",
      text: "Akun generus tetap ada, hanya dihapus dari list mandiri/nikah.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus!",
    });

    if (res.isConfirmed) {
      await fetch(`/api/mandiri?id=${id}`, { method: "DELETE" });
      Swal.fire({ icon: "success", title: "Terhapus!", timer: 1500, showConfirmButton: false });
      fetchData();
    }
  };


  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        <Topbar title={regTitle || "Usia Mandiri / Persiapan Nikah"} role={userRole} />
        
        <div className="page-content" 
             onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
             onDragLeave={() => setIsDragOver(false)}
             onDrop={(e) => {
               e.preventDefault();
               setIsDragOver(false);
               const gid = e.dataTransfer.getData("generusId");
               if (gid) handleAdd(gid);
             }}>
          
          {isDragOver && (
            <div style={{
              position: "fixed", top: 64, left: 0, right: sidebarOpen ? 300 : 0, bottom: 0,
              background: "rgba(34, 197, 94, 0.1)", border: "4px dashed #22c55e",
              zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "none", transition: "all 0.2s"
            }}>
              <div style={{ background: "#fff", padding: "20px 40px", borderRadius: "20px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", color: "#166534", fontWeight: "700", display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "24px" }}>➕</span> Lepaskan untuk Tambah Peserta
              </div>
            </div>
          )}

          {isPastDeadline && (
          <div style={{
            background: "#fff7ed", border: "1px solid #ffedd5", borderRadius: "12px", 
            padding: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px",
            color: "#c2410c"
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 24, height: 24 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
                <h4 style={{ margin: 0, fontWeight: "700" }}>Pendaftaran Ditutup</h4>
                <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>
                    Batas waktu pendaftaran mandiri telah berakhir. Fungsi penambahan peserta telah dikunci secara otomatis.
                </p>
            </div>
          </div>
        )}
        <div className="page-header">
          <div className="page-header-left">
            <h2>{regTitle || "Pengelolaan Peserta Mandiri"}</h2>
            <p>Kelola data generus yang memasuki usia mandiri / persiapan nikah</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              className={`btn ${deadline ? 'btn-success' : 'btn-secondary'}`} 
              onClick={handleSettings}
              title={deadline ? `Deadline: ${new Date(deadline).toLocaleString()}` : "Pengaturan Pendaftaran"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16 }}>
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {deadline ? "Update Pengaturan" : "Atur Pendaftaran"}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                const url = `${window.location.origin}/mandiri/daftar`;
                navigator.clipboard.writeText(url);
                Swal.fire({ icon: "success", title: "Link Disalin!", text: "Link pendaftaran mandiri berhasil disalin ke clipboard.", timer: 1500, showConfirmButton: false });
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16 }}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              Bagikan Link
            </button>
            <button 
              className={`btn ${sidebarOpen ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16 }}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Integrasi Data
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                if (isPastDeadline) {
                  Swal.fire({ icon: "warning", title: "Pendaftaran Ditutup", text: "Batas waktu pendaftaran telah berakhir." });
                } else {
                  setShowModal(true);
                }
              }}
              disabled={isPastDeadline}
              style={isPastDeadline ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16 }}>
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Tambah Peserta Baru
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ justifyContent: "space-between" }}>
            <span className="card-title">Daftar Peserta Mandiri ({total})</span>
            <div className="search-bar" style={{ maxWidth: "250px" }}>
              <input type="text" className="form-control" placeholder="Cari di list ini..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="table-wrapper">
            {loading && data.length === 0 ? (
              <div className="loading"><div className="spinner" /></div>
            ) : data.length === 0 ? (
              <div className="empty-state" style={{ padding: "40px" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, opacity: 0.3 }}><path d="M12 2v20M2 12h20" /></svg>
                <p>Belum ada peserta mandiri yang terdaftar.</p>
              </div>
            ) : (
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "50px" }}>No.</th>
                      <th>Foto</th>
                      <th>No. Unik</th>
                      <th>Nama</th>
                      <th>JK</th>
                      <th>Kategori</th>
                      <th>Desa / Kelompok</th>
                      <th>Status Mandiri</th>
                      <th>Catatan</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item) => (
                      <tr key={item.id}>
                        <td>
                           <span style={{ fontWeight: "700", color: "var(--primary)" }}>#{item.nomorUrut}</span>
                        </td>
                        <td>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f1f5f9", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                            {item.foto ? <img src={item.foto} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : item.nama.charAt(0)}
                          </div>
                        </td>
                        <td><span style={{ fontSize: 11, fontFamily: "monospace" }}>{item.nomorUnik}</span></td>
                        <td style={{ fontWeight: 500 }}>{item.nama}</td>
                        <td>{item.jenisKelamin}</td>
                        <td>{item.kategoriUsia}</td>
                        <td style={{ fontSize: 12, opacity: 0.8 }}>
                          {item.desaNama}<br/>{item.kelompokNama}
                        </td>
                        <td>
                          <span className={`badge ${item.statusMandiri === "Aktif" ? "badge-blue" : "badge-gray"}`}>
                            {item.statusMandiri}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, maxWidth: "150px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                           {item.catatan || "-"}
                        </td>
                        <td>
                          <div className="flex gap-2">
                             <button className="btn btn-sm btn-secondary" onClick={() => handleUpdate(item)}>Edit</button>
                             <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>Hapus</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
        </div>
        </div>
      </div>

      {/* RECRUITMENT SIDEBAR */}
      <div style={{ 
        width: sidebarOpen ? "320px" : "0px", 
        background: "#fff", 
        borderLeft: "1px solid #e2e8f0",
        transition: "all 0.3s ease",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative"
      }}>
          <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9" }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Pencarian Data</h3>
                <button className="btn-icon" onClick={() => setSidebarOpen(false)}>×</button>
             </div>
             <div className="search-bar">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Cari nama generus..." 
                  value={generusSearch}
                  onChange={(e) => setGenerusSearch(e.target.value)}
                />
             </div>
             <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "12px" }}>
                💡 Drag foto atau nama peserta ke area tabel untuk menambahkan.
             </p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
             {generusLoading ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Mencari...</div>
             ) : generusList.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                   Peserta tidak ditemukan atau sudah terdaftar di Mandiri.
                </div>
             ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                   {generusList.map(item => (
                      <div 
                        key={item.id}
                        draggable="true"
                        onDragStart={(e) => {
                          e.dataTransfer.setData("generusId", item.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        style={{
                          padding: "12px", border: "1px solid #f1f5f9", borderRadius: "12px",
                          display: "flex", alignItems: "center", gap: "12px", cursor: "grab",
                          background: "#fff", transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary)"}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = "#f1f5f9"}
                      >
                         <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f8fafc", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                            {item.foto ? <img src={item.foto} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ textAlign: 'center', lineHeight: '40px' }}>{item.nama[0]}</div>}
                         </div>
                         <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: "600", fontSize: "13.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.nama}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{item.nomorUnik} • {item.jenisKelamin}</div>
                         </div>
                         <button 
                            className="btn-icon" 
                            style={{ color: "var(--primary)" }}
                            onClick={() => handleAdd(item.id)}
                            title="Tambah manual"
                         >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14 }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                         </button>
                      </div>
                   ))}
                </div>
             )}
          </div>
      </div>

      <style jsx>{`
        .btn-icon {
          background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px;
          display: flex; alignItems: center; justifyContent: center;
        }
        .btn-icon:hover { background: #f1f5f9; }
        .badge-blue { background: #eff6ff; color: #1d4ed8; }
        .badge-gray { background: #f1f5f9; color: #475569; }
      `}</style>

      {showModal && (
        <GenerusModal
          item={null}
          onClose={() => setShowModal(false)}
          onSaved={(newG) => {
            setShowModal(false);
            if (newG?.id) handleAdd(newG.id);
          }}
          isMandiri={true}
        />
      )}
    </div>
  );
}
