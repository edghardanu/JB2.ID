"use client";

import Topbar from "@/components/Topbar";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { User, Clock, CheckCircle, XCircle, Play, PlusCircle, LayoutGrid, CalendarDays, Timer, Sparkles } from "lucide-react";

export default function AntreanPage() {
    const [antrean, setAntrean] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [myProfile, setMyProfile] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/mandiri/antrean");
            const json = await res.json();
            if (Array.isArray(json)) {
                setAntrean(json);
            } else {
                setAntrean([]);
                if (json.error) console.error("Antrean error:", json.error);
            }

            const profRes = await fetch("/api/profile");
            const profJson = await profRes.json();
            setMyProfile(profJson);
        } catch (err) {
            console.error("fetchData error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDaftar = async () => {
        const { isConfirmed } = await Swal.fire({
            title: "Daftar Antrean?",
            text: "Anda akan masuk ke dalam daftar antrean untuk melakukan pemilihan peserta lain.",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3b82f6",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Ya, Daftar",
            cancelButtonText: "Batal"
        });

        if (!isConfirmed) return;

        try {
            const res = await fetch("/api/mandiri/antrean", { method: "POST" });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);

            Swal.fire("Berhasil", "Anda sudah terdaftar dalam antrean.", "success");
            fetchData();
        } catch (err: any) {
            Swal.fire("Gagal", err.message, "error");
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch("/api/mandiri/antrean", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status })
            });
            if (!res.ok) throw new Error("Gagal update status");
            fetchData();
        } catch (err: any) {
            Swal.fire("Error", err.message, "error");
        }
    };

    const isAdmin = ["admin", "kmm_daerah"].includes(myProfile?.role || "");
    const myAntrean = Array.isArray(antrean) ? antrean.find(a => a.generusId === myProfile?.id && (a.status === "Menunggu" || a.status === "Diproses")) : null;

    return (
        <div className="antrean-container">
            <Topbar title="Antrean PDKT" role={myProfile?.role} className="antrean-topbar">
                {!isAdmin && myProfile?.role === "generus" && !myAntrean && (
                    <button className="btn btn-primary" onClick={handleDaftar}>
                        <PlusCircle size={20} />
                        Daftar Antrean
                    </button>
                )}
            </Topbar>

            {loading ? (
                <div className="loading-state">
                    <Timer className="spin" />
                    <span>Memuat data antrean...</span>
                </div>
            ) : antrean.length === 0 ? (
                <div className="empty-state">
                    <LayoutGrid size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                    <p>Belum ada antrean saat ini.</p>
                </div>
            ) : (
                <div className="antrean-grid">
                    {antrean.map((item, idx) => (
                        <div key={item.id} className={`antrean-card status-${item.status.toLowerCase()}`}>
                            <div className="card-number">#{antrean.length - idx}</div>
                            <div className="card-info">
                                <h3>{item.nama}</h3>
                                <p className="nomor-unik">{item.nomorUnik} • {item.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                                <div className="location">
                                    <span>{item.desa} / {item.kelompok}</span>
                                </div>
                            </div>
                            <div className="card-status-box">
                                <div className={`badge-status ${item.status.toLowerCase()}`}>
                                    {item.status === "Menunggu" && <Clock size={14} />}
                                    {item.status === "Diproses" && <Play size={14} />}
                                    {item.status === "Selesai" && <CheckCircle size={14} />}
                                    {item.status === "Batal" && <XCircle size={14} />}
                                    {item.status}
                                </div>
                                <span className="time-stamp">
                                    <Clock size={10} style={{ marginRight: 4 }} />
                                    {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "-"}
                                </span>
                            </div>

                            {isAdmin && item.status === "Menunggu" && (
                                <div className="card-actions">
                                    <button className="action-btn process" title="Mulai Proses" onClick={() => handleUpdateStatus(item.id, "Diproses")}>
                                        <Play size={16} fill="currentColor" />
                                    </button>
                                    <button className="action-btn cancel" title="Batalkan" onClick={() => handleUpdateStatus(item.id, "Batal")}>
                                        <XCircle size={16} fill="currentColor" />
                                    </button>
                                </div>
                            )}
                            {isAdmin && item.status === "Diproses" && (
                                <div className="card-actions">
                                    <button className="action-btn done" title="Selesai" onClick={() => handleUpdateStatus(item.id, "Selesai")}>
                                        <CheckCircle size={16} fill="currentColor" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!isAdmin && myProfile?.role === "generus" && (
                <div className="antrean-instruction">
                    <div className="instr-card">
                        <Sparkles size={24} color="#3b82f6" />
                        <div>
                            <h4>Langkah Selanjutnya</h4>
                            <p>Setelah Anda mendaftar antrean, Admin akan memproses status Anda menjadi <b>"Diproses"</b>. Setelah status berubah, Anda dapat melakukan pemilihan peserta di menu <b>Katalog Mandiri</b>.</p>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .antrean-topbar { margin-bottom: 30px; }
                .antrean-instruction { margin-top: 40px; padding-top: 40px; border-top: 1px solid #f1f5f9; }
                .title-section h1 { font-size: 32px; color: #1e293b; font-weight: 800; letter-spacing: -0.5px; }
                .title-section h1 span { color: #3b82f6; }
                .title-section p { color: #64748b; font-size: 14px; margin-top: 6px; }

                .btn-daftar-antrean {
                    display: flex; align-items: center; gap: 10px;
                    background: #3b82f6; color: white; border: none;
                    padding: 14px 28px; border-radius: 14px; font-weight: 700;
                    cursor: pointer; transition: all 0.3s;
                    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
                }
                .btn-daftar-antrean:hover { background: #2563eb; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4); }

                .antrean-grid { display: flex; flex-direction: column; gap: 20px; }

                .antrean-card {
                    background: white; border-radius: 20px; padding: 24px 30px;
                    display: flex; align-items: center; gap: 30px;
                    border: 1px solid #e2e8f0; position: relative;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
                }
                .antrean-card:hover { transform: translateY(-4px); box-shadow: 0 12px 20px -5px rgba(0,0,0,0.08); border-color: #cbd5e1; }

                .card-number {
                    font-size: 28px; font-weight: 900; color: #e2e8f0; min-width: 60px;
                    font-family: monospace;
                }
                .card-info { flex: 1; }
                .card-info h3 { font-size: 20px; color: #1e293b; font-weight: 800; margin-bottom: 6px; }
                .nomor-unik { font-size: 14px; color: #64748b; font-weight: 600; }
                .location { margin-top: 10px; font-size: 13px; color: #94a3b8; display: flex; align-items: center; gap: 6px; }

                .card-status-box { text-align: right; min-width: 140px; }
                .badge-status {
                    display: inline-flex; align-items: center; gap: 6px;
                    padding: 8px 16px; border-radius: 99px; font-size: 12px; font-weight: 800;
                    margin-bottom: 8px; letter-spacing: 0.5px;
                }
                .badge-status.menunggu { background: #fffbeb; color: #b45309; }
                .badge-status.diproses { background: #eff6ff; color: #1d4ed8; }
                .badge-status.selesai { background: #f0fdf4; color: #15803d; }
                .badge-status.batal { background: #fef2f2; color: #b91c1c; }

                .time-stamp { display: flex; align-items: center; justify-content: flex-end; font-size: 12px; color: #94a3b8; font-weight: 600; }

                .card-actions { display: flex; gap: 10px; margin-left: 20px; padding-left: 24px; border-left: 1px solid #f1f5f9; }
                .action-btn {
                    width: 44px; height: 44px; border-radius: 12px; border: none;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.2s;
                }
                .action-btn.process { background: #eff6ff; color: #3b82f6; }
                .action-btn.process:hover { background: #3b82f6; color: white; }
                .action-btn.cancel { background: #fef2f2; color: #ef4444; }
                .action-btn.cancel:hover { background: #ef4444; color: white; }
                .action-btn.done { background: #f0fdf4; color: #10b981; }
                .action-btn.done:hover { background: #10b981; color: white; }

                .status-selesai { opacity: 0.7; transform: scale(0.98); }
                .status-selesai:hover { transform: scale(0.98); }
                .status-batal { opacity: 0.5; background: #f8fafc; filter: grayscale(1); }

                .loading-state, .empty-state {
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    padding: 80px 40px; color: #64748b; font-weight: 600;
                    background: white; border-radius: 24px; border: 2px dashed #e2e8f0;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin { animation: spin 2s linear infinite; margin-bottom: 20px; }
            `}</style>
        </div>
    );
}
