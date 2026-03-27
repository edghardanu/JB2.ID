"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Heart, MessageSquare, User, Phone, MapPin, ClipboardList, CheckCircle, Star, Download, Sparkles, Send, Timer, Globe } from "lucide-react";
import { GenerusItem } from "@/lib/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function RomanticRoomPage() {
    const [selections, setSelections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [myProfile, setMyProfile] = useState<any>(null);
    const [activeSelection, setActiveSelection] = useState<any>(null);
    const [showSurvey, setShowSurvey] = useState(false);
    const [allActivities, setAllActivities] = useState<any[]>([]);

    const [form, setForm] = useState({
        namaPnkb: "",
        noHpPnkb: "",
        tanggapan: "Baik",
        rekomendasi: "Lanjut"
    });

    const isAdmin = ["admin", "kmm_daerah", "admin_romantic_room", "pengurus_daerah", "tim_pnkb"].includes(myProfile?.role || "");

    const fetchData = async () => {
        setLoading(true);
        try {
            const profRes = await fetch("/api/profile");
            const profJson = await profRes.json();
            setMyProfile(profJson);

            const isUserAdmin = ["admin", "kmm_daerah", "admin_romantic_room", "pengurus_daerah", "tim_pnkb"].includes(profJson.role);

            if (isUserAdmin) {
                const allRes = await fetch("/api/mandiri/pilih?all=true");
                const allJson = await allRes.json();
                setAllActivities(Array.isArray(allJson) ? allJson : []);
            } else {
                const selRes = await fetch("/api/mandiri/pilih");
                const selJson = await selRes.json();
                if (Array.isArray(selJson)) {
                    setSelections(selJson);
                    
                    const active = selJson.find((s: any) => s.status !== "Selesai" && s.status !== "Ditolak");
                    if (active) {
                        const targetRes = await fetch(`/api/generus/${active.penerimaId}`);
                        const targetJson = await targetRes.json();
                        setActiveSelection({ ...active, target: targetJson });
                    }
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmitSurvey = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/mandiri/kuisioner", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pemilihanId: activeSelection?.id,
                    ...form
                })
            });
            if (!res.ok) throw new Error("Gagal menyimpan kuisioner");
            Swal.fire("Berhasil", "Kuisioner berhasil disimpan. Terima kasih atas tanggapan Anda.", "success");
            setShowSurvey(false);
            fetchData();
        } catch (err: any) {
            Swal.fire("Error", err.message, "error");
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(22);
        doc.setTextColor(244, 63, 94); // Rose 500
        doc.text("Laporan Pertemuan PDKT", 105, 20, { align: "center" });
        
        doc.setFontSize(12);
        doc.setTextColor(100, 116, 139);
        doc.text("Katalog Mandiri - Romantic Room", 105, 28, { align: "center" });
        
        // Data Table
        const tableData = [
            ["1. Nama PNKB", form.namaPnkb || "-"],
            ["2. No. HP PNKB", form.noHpPnkb || "-"],
            ["3. Nama Lengkap Peserta", myProfile?.nama || "-"],
            ["4. No. Peserta", myProfile?.nomorUnik || "-"],
            ["5. Daerah Peserta", `${myProfile?.desaNama} / ${myProfile?.kelompokNama}`],
            ["6. Lawan Bicara Peserta", activeSelection?.target?.nama || "-"],
            ["7. No. Lawan Bicara", activeSelection?.target?.nomorUnik || "-"],
            ["8. Tanggapan Lawan Bicara", form.tanggapan],
            ["9. Hasil Pertemuan", form.rekomendasi]
        ];

        autoTable(doc, {
            startY: 40,
            head: [['Kriteria', 'Keterangan']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [244, 63, 94] },
            styles: { fontSize: 11, cellPadding: 5 }
        });

        // Footer
        const finalY = (doc as any).lastAutoTable.finalY + 20;
        doc.setFontSize(10);
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, finalY);
        doc.text("Tanda Tangan PNKB", 150, finalY + 10);
        doc.text("___________________", 150, finalY + 30);

        doc.save(`Kuisioner_PDKT_${myProfile?.nama || 'Peserta'}.pdf`);
    };

    if (loading) return <div className="room-loading">Membuka Romantic Room...</div>;

    if (isAdmin) {
        return (
            <div className="romantic-container admin-mode">
                 <header className="room-header">
                    <h1>Admin <span>Romantic</span> Log</h1>
                    <p>Memantau seluruh aktivitas pemilihan peserta</p>
                </header>

                <div className="admin-log-card">
                    <div className="log-summary">
                        <span>Total Aktivitas: <b>{allActivities.length}</b></span>
                    </div>
                    {allActivities.length === 0 ? (
                        <div className="empty-log">Belum ada aktivitas pemilihan.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Waktu</th>
                                        <th>Pilih (Siapa)</th>
                                        <th>Target (Memilih Siapa)</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allActivities.map((act) => (
                                        <tr key={act.id}>
                                            <td>{new Date(act.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                                            <td>
                                                <div className="user-cell">
                                                    <span className="user-name">{act.pengirimNama}</span>
                                                    <span className="user-no">{act.pengirimNo}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="user-cell">
                                                    <span className="user-target-name">{act.penerimaNama}</span>
                                                    <span className="user-no">{act.penerimaNo}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge-pilih ${act.status.toLowerCase()}`}>{act.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <style jsx>{`
                    .admin-mode { max-width: 1000px; }
                    .admin-log-card { background: white; border-radius: 20px; padding: 30px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                    .log-summary { margin-bottom: 20px; font-size: 14px; color: #64748b; }
                    .admin-table { width: 100%; border-collapse: collapse; }
                    .admin-table th { text-align: left; padding: 12px 16px; border-bottom: 2px solid #f1f5f9; color: #475569; font-size: 13px; font-weight: 700; text-transform: uppercase; }
                    .admin-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
                    .user-cell { display: flex; flex-direction: column; }
                    .user-name { font-weight: 700; color: #1e293b; }
                    .user-target-name { font-weight: 700; color: #f43f5e; }
                    .user-no { font-size: 12px; color: #94a3b8; }
                    .badge-pilih { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
                    .badge-pilih.menunggu { background: #fffbeb; color: #b45309; }
                    .badge-pilih.diterima { background: #f0fdf4; color: #15803d; }
                    .badge-pilih.selesai { background: #eff6ff; color: #1d4ed8; }
                    .badge-pilih.ditolak { background: #fef2f2; color: #b91c1c; }
                    .empty-log { text-align: center; padding: 40px; color: #94a3b8; font-style: italic; }
                `}</style>
            </div>
        );
    }

    if (!activeSelection) {
        return (
            <div className="empty-room">
                <Heart size={64} style={{ color: '#fda4af', marginBottom: 20 }} />
                <h2>Belum Ada Pertemuan Aktif</h2>
                <p>Silakan lakukan pemilihan peserta di Katalog PDKT terlebih dahulu.</p>
            </div>
        );
    }

    const { target } = activeSelection;

    return (
        <div className="romantic-container">
            <header className="room-header">
                <h1>Romantic <span>Room</span> <Sparkles size={24} color="#f43f5e" /></h1>
                <p>Ruang interaksi dan evaluasi pertemuan Anda</p>
            </header>

            <div className="room-card">
                <div className="partner-section">
                    <div className="partner-avatar">
                        {target.foto ? <img src={target.foto} alt={target.nama} /> : <div className="avatar-placeholder">?</div>}
                    </div>
                    <div className="partner-info">
                        <h2>{target.nama}</h2>
                        <p className="partner-tagline">Peserta Pilihan Anda</p>
                        <div className="partner-meta" style={{ flexWrap: "wrap", marginTop: "12px", gap: "10px" }}>
                            <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: "8px", fontSize: "12px" }}>
                                <MapPin size={12} /> {target.desaNama} / {target.kelompokNama}
                            </span>
                            {["admin", "admin_romantic_room", "tim_pnkb", "pengurus_daerah"].includes(myProfile?.role || "") && (
                                <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: "8px", fontSize: "12px" }}>
                                    <User size={12} />
                                    {(() => {
                                        if (!target.tanggalLahir) return "-";
                                        const birthDate = new Date(target.tanggalLahir);
                                        if (isNaN(birthDate.getTime())) return "-";
                                        const today = new Date();
                                        let age = today.getFullYear() - birthDate.getFullYear();
                                        const m = today.getMonth() - birthDate.getMonth();
                                        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
                                        return age + " Thn";
                                    })()}
                                </span>
                            )}
                            {["admin", "admin_romantic_room", "tim_pnkb", "pengurus_daerah"].includes(myProfile?.role || "") && target.instagram && (
                                <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: "8px", fontSize: "12px" }}>
                                    <Globe size={12} /> @{target.instagram}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="room-content">
                    {!showSurvey ? (
                        <div className="welcome-chat">
                            <div className="chat-bubble">
                                <p>Halo! Anda telah memilih <b>{target.nama}</b>. Pertemuan ini adalah langkah awal Anda. Setelah sesi bicara selesai, mohon luangkan waktu untuk mengisi kuisioner di bawah ini.</p>
                            </div>
                            <button className="btn-start-survey" onClick={() => setShowSurvey(true)}>
                                <ClipboardList size={20} />
                                Isi Kuisioner Pertemuan
                            </button>
                        </div>
                    ) : (
                        <form className="survey-form" onSubmit={handleSubmitSurvey}>
                            <h3 className="form-title">Kuisioner Pertemuan</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Nama PNKB</label>
                                    <input value={form.namaPnkb} onChange={e => setForm({...form, namaPnkb: e.target.value})} placeholder="Nama pendamping..." />
                                </div>
                                <div className="form-group">
                                    <label>No. HP PNKB</label>
                                    <input value={form.noHpPnkb} onChange={e => setForm({...form, noHpPnkb: e.target.value})} placeholder="08xxxx" />
                                </div>
                                <div className="form-group span-2">
                                    <label>Informasi Peserta</label>
                                    <div className="readonly-info grid-info">
                                        <div><b>3. Nama Lengkap:</b> {myProfile?.nama}</div>
                                        <div><b>4. No. Peserta:</b> {myProfile?.nomorUnik}</div>
                                        <div><b>5. Daerah:</b> {myProfile?.desaNama} / {myProfile?.kelompokNama}</div>
                                        <div><b>6. Lawan Bicara:</b> {target.nama}</div>
                                        <div><b>7. No. Lawan:</b> {target.nomorUnik}</div>
                                    </div>
                                </div>
                                <div className="form-group span-2">
                                    <label>8. Bagaiman tanggapanmu dengan lawan bicaramu?</label>
                                    <div className="tanggapan-options">
                                        {["Baik", "Humble", "Pendiam", "Penyabar", "Friendly"].map(opt => (
                                            <button 
                                                key={opt}
                                                type="button" 
                                                className={form.tanggapan === opt ? "active" : ""} 
                                                onClick={() => setForm({...form, tanggapan: opt})}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                        <input 
                                            placeholder="Lainnya..." 
                                            className="tanggapan-custom"
                                            value={["Baik", "Humble", "Pendiam", "Penyabar", "Friendly"].includes(form.tanggapan) ? "" : form.tanggapan}
                                            onChange={e => setForm({...form, tanggapan: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="form-group span-2">
                                    <label>9. Hasil Pertemuan</label>
                                    <div className="radio-group-pdkt">
                                        <button type="button" className={form.rekomendasi === "Lanjut" ? "active" : ""} onClick={() => setForm({...form, rekomendasi: "Lanjut"})}>Lanjut</button>
                                        <button type="button" className={form.rekomendasi === "Ragu-Ragu" ? "active" : ""} onClick={() => setForm({...form, rekomendasi: "Ragu-Ragu"})}>Ragu-Ragu</button>
                                        <button type="button" className={form.rekomendasi === "Tidak Lanjut" ? "active" : ""} onClick={() => setForm({...form, rekomendasi: "Tidak Lanjut"})}>Tidak Lanjut</button>
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-cancel-room" onClick={() => setShowSurvey(false)}>Batal</button>
                                <button type="button" className="btn-pdf-room" onClick={handleExportPDF}>
                                    <Download size={18} /> Unduh PDF
                                </button>
                                <button type="submit" className="btn-submit-room">
                                    <Send size={18} /> Simpan & Selesai
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <style jsx>{`
                .romantic-container { padding: 40px 20px; max-width: 800px; margin: 0 auto; min-height: 100vh; }
                .room-header { margin-bottom: 40px; text-align: center; }
                .room-header h1 { font-size: 36px; font-weight: 900; color: #1e293b; display: flex; align-items: center; justify-content: center; gap: 12px; }
                .room-header h1 span { color: #f43f5e; }
                .room-header p { color: #64748b; margin-top: 10px; font-size: 15px; }

                .room-card { 
                    background: white; border-radius: 30px; overflow: hidden; 
                    box-shadow: 0 25px 50px -12px rgba(244, 63, 94, 0.15);
                    border: 1px solid #fecdd3;
                }
                .partner-section { 
                    background: linear-gradient(135deg, #fb7185 0%, #f43f5e 100%); 
                    padding: 40px; display: flex; align-items: center; gap: 30px; color: white;
                }
                .partner-avatar { 
                    width: 100px; height: 100px; border-radius: 50%; overflow: hidden; 
                    border: 4px solid rgba(255,255,255,0.3); background: white;
                }
                .partner-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .avatar-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: 800; color: #fb7185; }

                .partner-info h2 { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
                .partner-tagline { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; opacity: 0.9; margin-bottom: 12px; }
                .partner-meta { display: flex; gap: 20px; font-size: 14px; font-weight: 600; opacity: 0.95; }
                .partner-meta span { display: flex; align-items: center; gap: 6px; }

                .room-content { padding: 40px; }
                .welcome-chat { text-align: center; }
                .chat-bubble { background: #fef2f2; padding: 24px; border-radius: 20px; color: #9f1239; font-size: 15px; line-height: 1.6; margin-bottom: 30px; border: 1px dashed #fda4af; }
                
                .btn-start-survey {
                    display: inline-flex; align-items: center; gap: 10px;
                    background: #f43f5e; color: white; border: none;
                    padding: 16px 32px; border-radius: 16px; font-weight: 800;
                    cursor: pointer; transition: all 0.3s;
                    box-shadow: 0 10px 15px -3px rgba(244, 63, 94, 0.3);
                }
                .btn-start-survey:hover { background: #e11d48; transform: scale(1.05); }

                .survey-form { animation: slideUp 0.4s ease-out; }
                .form-title { font-size: 20px; font-weight: 800; color: #1e293b; margin-bottom: 24px; border-left: 4px solid #f43f5e; padding-left: 14px; }
                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                .form-group label { display: block; font-size: 13px; font-weight: 700; color: #64748b; margin-bottom: 8px; }
                .form-group input, .form-group select { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 14px; outline: none; transition: border-color 0.2s; }
                .form-group input:focus { border-color: #f43f5e; }
                .span-2 { grid-column: span 2; }
                
                .readonly-info { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9; font-size: 14px; color: #475569; }
                .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }

                .radio-group-pdkt { display: flex; gap: 10px; }
                .radio-group-pdkt button { flex: 1; padding: 12px; border-radius: 12px; border: 2px solid #f1f5f9; background: white; color: #64748b; font-weight: 700; cursor: pointer; transition: all 0.2s; }
                .radio-group-pdkt button.active { border-color: #f43f5e; background: #fff1f2; color: #f43f5e; }

                .tanggapan-options { display: flex; flex-wrap: wrap; gap: 8px; }
                .tanggapan-options button { padding: 8px 16px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; cursor: pointer; font-size: 13px; transition: all 0.2s; }
                .tanggapan-options button.active { background: #f43f5e; color: white; border-color: #f43f5e; }
                .tanggapan-custom { flex: 1; min-width: 150px; padding: 8px 16px; border-radius: 10px; border: 1px solid #e2e8f0; outline: none; font-size: 13px; }
                .tanggapan-custom:focus { border-color: #f43f5e; }

                .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 40px; }
                .btn-submit-room { background: #f43f5e; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; }
                .btn-pdf-room { background: white; color: #1e293b; border: 1px solid #e2e8f0; padding: 12px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; }
                .btn-cancel-room { background: transparent; color: #64748b; border: none; font-weight: 700; cursor: pointer; padding: 0 10px; }

                .empty-room { text-align: center; padding: 100px 40px; background: white; border-radius: 30px; border: 2px dashed #fecdd3; }
                .room-loading { text-align: center; padding: 100px; font-size: 18px; color: #f43f5e; font-weight: 700; }

                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

                @media print {
                    :global(.sidebar), :global(.navbar), .antrean-header, .btn-start-survey, .form-actions, .partner-avatar, button { display: none !important; }
                    .romantic-container { padding: 0; max-width: 100%; border: none; }
                    .room-card { border: none; box-shadow: none; width: 100%; }
                    .partner-section { background: white; color: black; border-bottom: 2px solid #000; padding: 20px 0; }
                    .partner-info h2 { color: black; font-size: 24pt; }
                    .partner-meta { color: #333; }
                    .readonly-info { border: none; padding: 0; font-size: 12pt; }
                    .form-title { font-size: 18pt; margin: 30px 0 20px; }
                    .form-grid { display: block; }
                    .form-group { margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                    .form-group label { font-size: 10pt; color: #666; }
                    .radio-group-pdkt button:not(.active) { display: none; }
                    .radio-group-pdkt button.active { border: none; background: none; color: black; padding: 0; font-size: 14pt; }
                    input, select { border: none; font-size: 12pt; padding: 0; }
                }
            `}</style>
        </div>
    );
}

