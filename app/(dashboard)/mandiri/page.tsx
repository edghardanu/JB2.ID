"use client";

import Topbar from "@/components/Topbar";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { GenerusItem } from "@/lib/types";
import GenerusModal from "../generus/GenerusModal";

interface MandiriItem {
  id: string;
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
  const [availableGenerus, setAvailableGenerus] = useState<GenerusItem[]>([]);
  const [searchG, setSearchG] = useState("");
  const [loadingG, setLoadingG] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [deadline, setDeadline] = useState("");
  const [regTitle, setRegTitle] = useState("");
  const [regDesc, setRegDesc] = useState("");
  const [isPastDeadline, setIsPastDeadline] = useState(false);

  const limit = 20;

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(d => setUserRole(d.role || ""));
    
    // Fetch individual settings
    const fetchSettings = async () => {
        const [d1, d2, d3] = await Promise.all([
            fetch("/api/mandiri/settings?key=mandiri_registration_deadline").then(r => r.json()),
            fetch("/api/mandiri/settings?key=mandiri_registration_title").then(r => r.json()),
            fetch("/api/mandiri/settings?key=mandiri_registration_description").then(r => r.json())
        ]);
        setDeadline(d1.value || "");
        setIsPastDeadline(!!d1.isPast);
        setRegTitle(d2.value || "");
        setRegDesc(d3.value || "");
    };
    fetchSettings();
  }, []);

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

  const fetchAvailableGenerus = useCallback(async () => {
    setLoadingG(true);
    try {
      const params = new URLSearchParams({ search: searchG, limit: "15" });
      const res = await fetch(`/api/generus?${params}`);
      const json = await res.json();
      setAvailableGenerus(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingG(false);
    }
  }, [searchG]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(fetchAvailableGenerus, 300);
    return () => clearTimeout(timer);
  }, [fetchAvailableGenerus]);

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

  const onDragStart = (e: React.DragEvent, id: string) => {
    console.log("Drag Start:", id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.dropEffect = "copy";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    console.log("On Drop:", id);
    if (id) handleAdd(id);
  };

  const allowDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div>
      <Topbar title={regTitle || "Usia Mandiri / Persiapan Nikah"} role={userRole} />
      
      <div className="page-content">
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

        <div className="responsive-grid-2" style={{ gridTemplateColumns: "1fr 3fr", gap: "20px" }}>
          {/* Sisi Kiri: Daftar Generus Tersedia (Drag) */}
          <div className="card" style={{ maxHeight: "calc(100vh - 200px)", display: "flex", flexDirection: "column" }}>
            <div className="card-header">
              <span className="card-title">Data Generus</span>
            </div>
            <div className="card-body" style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              <div className="search-bar" style={{ marginBottom: "12px" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                <input type="text" className="form-control" placeholder="Cari..." value={searchG} onChange={(e) => setSearchG(e.target.value)} />
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {loadingG ? (
                  <div className="text-center font-muted">Memuat...</div>
                ) : availableGenerus.length === 0 ? (
                  <div className="text-center font-muted">Tidak ditemukan</div>
                ) : availableGenerus.map(g => (
                  <div 
                    key={g.id} 
                    draggable 
                    onDragStart={(e) => onDragStart(e, g.id)}
                    style={{
                      padding: "8px 12px",
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      cursor: "grab",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}
                  >
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#e2e8f0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
                        {g.foto ? <img src={g.foto} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : g.nama.charAt(0)}
                    </div>
                    <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {g.nama}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-muted text-xs" style={{ marginTop: "12px", textAlign: "center" }}>Tarik nama ke tabel di kanan ➔</p>
            </div>
          </div>

          {/* Sisi Kanan: Daftar Peserta Mandiri */}
          <div 
            className="card" 
            onDrop={onDrop} 
            onDragOver={allowDrop}
            style={{ minHeight: "300px" }}
          >
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
                  <p>Belum ada peserta. Tarik generus ke sini untuk menambahkan.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
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
