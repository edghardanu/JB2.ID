"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";

interface Desa { id: number; nama: string; kota: string; }
interface Kelompok { id: number; nama: string; }

export default function MandiriDaftarPage() {
  const [form, setForm] = useState({
    nama: "",
    jenisKelamin: "L",
    kategoriUsia: "Kuliah",
    tempatLahir: "",
    tanggalLahir: "",
    alamat: "",
    noTelp: "",
    pendidikan: "",
    pekerjaan: "",
    statusNikah: "Belum Menikah",
    hobi: "",
    makananMinumanFavorit: "",
    suku: "",
    foto: "",
    mandiriDesaId: "",
    mandiriKelompokId: "",
  });

  const [desaList, setDesaList] = useState<Desa[]>([]);
  const [filteredDesaList, setFilteredDesaList] = useState<Desa[]>([]);
  const [kotaList, setKotaList] = useState<string[]>([]);
  const [selectedKota, setSelectedKota] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [deadline, setDeadline] = useState<string>("");
  const [isPastDeadline, setIsPastDeadline] = useState(false);
  const [regTitle, setRegTitle] = useState("");
  const [regDesc, setRegDesc] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleLogoUpdate = () => {
        setSiteLogo((window as any).__SITE_LOGO__ || null);
      };
      handleLogoUpdate();
      window.addEventListener('site-logo-updated', handleLogoUpdate);
      return () => window.removeEventListener('site-logo-updated', handleLogoUpdate);
    }
  }, []);

  useEffect(() => {
    // Fetch Settings (Deadline, Title & Description)
    fetch("/api/public/mandiri/settings?key=mandiri_registration_deadline")
      .then(r => r.json())
      .then(d => {
        if (d.value) {
            setDeadline(d.value);
            if (d.isPast) {
                setIsPastDeadline(true);
            }
        }
      });

    fetch("/api/public/mandiri/settings?key=mandiri_registration_title")
      .then(r => r.json())
      .then(d => {
        if (d.value) setRegTitle(d.value);
      });

    fetch("/api/public/mandiri/settings?key=mandiri_registration_description")
      .then(r => r.json())
      .then(d => {
        if (d.value) setRegDesc(d.value);
      });

    fetch("/api/public/mandiri/desa")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
            setDesaList(data);
            const cities = Array.from(new Set(data.map((d: any) => d.kota))).sort() as string[];
            setKotaList(cities);
        }
      });
  }, []);

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
        if (part.match(urlRegex)) {
            return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "underline" }}>{part}</a>;
        }
        return part;
    });
  };

  useEffect(() => {
    if (selectedKota) {
      setFilteredDesaList(desaList.filter((d) => d.kota === selectedKota));
    } else {
      setFilteredDesaList([]);
    }
    setForm(prev => ({ ...prev, mandiriDesaId: "", mandiriKelompokId: "" }));
  }, [selectedKota, desaList]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!form.nama || !form.jenisKelamin || !form.kategoriUsia || !form.mandiriDesaId || !form.tempatLahir || !form.tanggalLahir || !form.noTelp || !form.pendidikan || !form.pekerjaan || !form.hobi || !form.makananMinumanFavorit || !form.foto) {
        Swal.fire({ icon: "warning", title: "Data Belum Lengkap", text: "Mohon isi semua data wajib dan upload foto Anda." });
        setLoading(false);
        return;
      }

      const res = await fetch("/api/public/mandiri/registrasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mendaftar");
      setSuccess(true);
      setResult(data);
      Swal.fire({ icon: "success", title: "Berhasil!", text: "Data Anda telah tercatat." });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: "500px", textAlign: "center" }}>
          <div style={{ fontSize: "60px", marginBottom: "20px" }}>✅</div>
          <h2 style={{ marginBottom: "10px" }}>Pendaftaran Berhasil!</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
            Data Anda telah berhasil disimpan sebagai Peserta Mandiri.
          </p>
          <div style={{ background: "var(--bg)", padding: "20px", borderRadius: "10px", marginBottom: "24px" }}>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Nomor Unik Anda:</p>
            <h3 style={{ fontSize: "24px", color: "var(--primary)", letterSpacing: "2px" }}>{result?.nomorUnik}</h3>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
              Silakan simpan nomor unik ini untuk keperluan absensi dan kegiatan mendatang.
          </p>
          <button className="btn btn-primary btn-full" onClick={() => window.location.reload()}>
            Kembali ke Form
          </button>
        </div>
      </div>
    );
  }

  if (isPastDeadline) {
      return (
        <div className="auth-page">
          <div className="auth-card" style={{ maxWidth: "500px", textAlign: "center" }}>
            <div style={{ fontSize: "60px", marginBottom: "20px" }}>⌛</div>
            <h2 style={{ marginBottom: "10px" }}>Pendaftaran Ditutup</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
              Mohon maaf, batas waktu pendaftaran mandiri telah berakhir pada <b>{new Date(deadline).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</b>.
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Silakan hubungi pengurus setempat untuk informasi lebih lanjut.
            </p>
          </div>
        </div>
      );
  }

  return (
    <div className="auth-page" style={{ padding: "40px 20px" }}>
        <div className="auth-card" style={{ maxWidth: "600px" }}>
        <div className="auth-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
          {siteLogo && (
            <img src={siteLogo} alt="Logo" style={{ width: "40px", height: "40px", objectFit: "contain" }} />
          )}
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ margin: 0, lineHeight: 1 }}>JB2.ID</h1>
            <p style={{ margin: 0, fontSize: '11px' }}>Sistem Manajemen Mandiri JB2</p>
          </div>
        </div>
                <p style={{ fontWeight: "600", fontSize: "1.2rem", marginBottom: "4px" }}>
                    {regTitle || "Formulir Pendaftaran Peserta Mandiri / Persiapan Nikah"}
                </p>
                {regDesc && (
                    <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "12px", lineHeight: "1.5" }}>
                        {renderTextWithLinks(regDesc)}
                    </p>
                )}
                {deadline && (
                    <div style={{ 
                        marginTop: 12, padding: "8px 12px", borderRadius: 8, 
                        background: "#fff7ed", color: "#c2410c", fontSize: 12,
                        border: "1px solid #ffedd5"
                    }}>
                        Batas waktu pengisian: <b>{new Date(deadline).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</b>
                    </div>
                )}
            
            <form onSubmit={handleSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div className="form-group" style={{ textAlign: "center" }}>
                        <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#f1f5f9", margin: "0 auto 10px", overflow: "hidden", border: "2px solid #e2e8f0" }}>
                            {form.foto ? <img src={form.foto} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ fontSize: "40px", marginTop: "20px" }}>👤</div>}
                        </div>
                        <label className="btn btn-sm btn-secondary" style={{ cursor: "pointer", marginBottom: "8px" }}>
                            {uploading ? "..." : "Upload Foto Profil"}
                            <input type="file" hidden accept="image/*" disabled={uploading} onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploading(true);
                                const fd = new FormData(); fd.append("file", file);
                                try {
                                    const res = await fetch("/api/upload", { method: "POST", body: fd });
                                    const json = await res.json();
                                    if (json.url) setForm({ ...form, foto: json.url });
                                } catch (err) {} finally { setUploading(false); }
                            }} />
                        </label>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 auto", maxWidth: "250px" }}>
                            Kirim foto yang terbaik & terbaru, foto bebas, dan muka tampak jelas (tidak tertutup masker)
                        </p>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Nama Lengkap <span className="required">*</span></label>
                        <input name="nama" className="form-control" value={form.nama} onChange={handleChange} required placeholder="Masukkan nama lengkap" />
                        <p style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "4px" }}>
                            Contoh Format Penulisan: Raka Gladhi Pratama (Tanpa disingkat dan huruf kapital pada setiap awal kata)
                        </p>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Jenis Kelamin <span className="required">*</span></label>
                            <select name="jenisKelamin" className="form-control" value={form.jenisKelamin} onChange={handleChange} required>
                                <option value="L">Laki-laki</option>
                                <option value="P">Perempuan</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Kategori Usia <span className="required">*</span></label>
                            <select name="kategoriUsia" className="form-control" value={form.kategoriUsia} onChange={handleChange} required>
                                <option value="Kuliah">Kuliah</option>
                                <option value="Bekerja">Bekerja</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Kota Tempat Lahir <span className="required">*</span></label>
                            <input name="tempatLahir" className="form-control" value={form.tempatLahir} onChange={handleChange} required placeholder="Kota kelahiran" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tanggal Lahir <span className="required">*</span></label>
                            <input name="tanggalLahir" type="date" className="form-control" value={form.tanggalLahir} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Kota / Daerah <span className="required">*</span></label>
                            <select className="form-control" value={selectedKota} onChange={(e) => setSelectedKota(e.target.value)} required>
                                <option value="">Pilih Kota/Daerah</option>
                                {kotaList.map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Desa <span className="required">*</span></label>
                            <select name="mandiriDesaId" className="form-control" value={form.mandiriDesaId} onChange={handleChange} required disabled={!selectedKota}>
                                <option value="">Pilih Desa</option>
                                {filteredDesaList.map(d => <option key={d.id} value={d.id}>{d.nama}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">No. Telepon / WhatsApp <span className="required">*</span></label>
                            <input name="noTelp" className="form-control" value={form.noTelp} onChange={handleChange} required placeholder="08xx-xxxx-xxxx" />
                            <p style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.3" }}>
                                Nomor ini tidak akan disebarluaskan, hanya digunakan untuk keperluan kordinasi antara panitia dengan peserta.
                            </p>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Pendidikan Terakhir <span className="required">*</span></label>
                            <input name="pendidikan" className="form-control" value={form.pendidikan} onChange={handleChange} required placeholder="S1/SMA/dll" />
                            <p style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "4px" }}>
                                Contoh Penulisan: S1 - Psikologi atau SMA - IPA
                            </p>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Pekerjaan <span className="required">*</span></label>
                            <input name="pekerjaan" className="form-control" value={form.pekerjaan} onChange={handleChange} required placeholder="Pekerjaan saat ini" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Suku <span className="required">*</span></label>
                            <input name="suku" className="form-control" value={form.suku} onChange={handleChange} required placeholder="Betawi / Jawa / dll" />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Hobi <span className="required">*</span></label>
                            <input name="hobi" className="form-control" value={form.hobi} onChange={handleChange} required placeholder="Hobi anda" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Favorit Makanan/Minuman <span className="required">*</span></label>
                            <input name="makananMinumanFavorit" className="form-control" value={form.makananMinumanFavorit} onChange={handleChange} required placeholder="Sate / Jus / dll" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Alamat Lengkap</label>
                        <textarea name="alamat" className="form-control" value={form.alamat} onChange={handleChange} placeholder="Alamat saat ini (opsional)" />
                    </div>

                    <div className="form-group" style={{ padding: "15px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                            <input 
                                type="checkbox" 
                                id="agree-check"
                                style={{ transform: "scale(1.2)", marginTop: "3px" }} 
                                checked={agreed} 
                                onChange={(e) => setAgreed(e.target.checked)} 
                                required
                            />
                            <label htmlFor="agree-check" style={{ fontSize: "12.5px", cursor: "pointer", fontWeight: "600" }}>
                                Saya menyatakan Setuju & Sanggup:
                            </label>
                        </div>
                        <ol style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "10px", paddingLeft: "35px", marginBottom: 0, lineHeight: "1.6" }}>
                            <li>Sanggup mengikuti seluruh rangkaian acara dan menaati aturannya.</li>
                            <li>Menyetujui penyebarluasan data diri kepada Tim PNKB dan Peserta PDKT 2.0 untuk keperluan acara.</li>
                        </ol>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || !agreed}>
                        {loading ? "Memproses..." : "Kirim Pendaftaran"}
                    </button>
                    
                    <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
                        Dengan mengeklik tombol di atas, Anda menyatakan bahwa data yang diberikan adalah benar.
                    </p>
                </div>
            </form>
        </div>
    </div>
  );
}
