"use client";

import Topbar from "@/components/Topbar";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  desaId: number | null;
  kelompokId: number | null;
  desaNama: string | null;
  kelompokNama: string | null;
  createdAt: string | null;
}

interface DesaItem { id: number; nama: string; }
interface KelompokItem { id: number; nama: string; desaId: number; }

export default function AdminUsersPage() {
  const [data, setData] = useState<UserItem[]>([]);
  const [desaList, setDesaList] = useState<DesaItem[]>([]);
  const [kelompokList, setKelompokList] = useState<KelompokItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Search and Pagination states
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [userRole, setUserRole] = useState("");
  const limit = 50;

  useEffect(() => {
    setMounted(true);
    fetch("/api/profile").then(r => r.json()).then(d => setUserRole(d.role || ""));
  }, []);

  const fetchStaticData = useCallback(async () => {
    try {
      const [dRes, kRes] = await Promise.all([
        fetch("/api/admin/desa"),
        fetch("/api/admin/kelompok"),
      ]);
      const [dJson, kJson] = await Promise.all([dRes.json(), kRes.json()]);
      setDesaList(Array.isArray(dJson) ? dJson : []);
      setKelompokList(Array.isArray(kJson) ? kJson : []);
    } catch (error) {
      console.error("Failed to fetch static data:", error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const uParams = new URLSearchParams({ 
        search, 
        page: String(page), 
        limit: String(limit) 
      });
      const uRes = await fetch(`/api/admin/users?${uParams}`);
      const uJson = await uRes.json();
      setData(uJson.data || []);
      setTotal(uJson.total || 0);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
    setLoading(false);
  }, [search, page]);

  useEffect(() => {
    fetchStaticData();
  }, [fetchStaticData]);

  useEffect(() => { 
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  if (!mounted) return <div className="loading"><div className="spinner" /></div>;

  const totalPages = Math.ceil(total / limit);

  // Remaining functions...
  const updateUser = async (id: string, updates: Partial<UserItem>) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        Swal.fire({
          icon: 'success', title: 'Diperbarui', text: 'Data user berhasil diupdate',
          toast: true, position: 'top-end', timer: 2000, showConfirmButton: false
        });
        fetchData();
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat update user' });
    }
  };

  const handleDelete = async (id: string) => {
    const res = await Swal.fire({
      title: 'Hapus User?',
      text: "Akun user akan dihapus permanen dari sistem!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });
    
    if (res.isConfirmed) {
      await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'User berhasil dihapus.', timer: 1500, showConfirmButton: false });
      fetchData();
    }
  };

   const roleColors: Record<string, string> = {
    admin: "badge-red", pengurus_daerah: "badge-red", kmm_daerah: "badge-red",
    desa: "badge-blue", kelompok: "badge-green", generus: "badge-purple",
    creator: "badge-orange", pending: "badge-gray", tim_pnkb: "badge-blue",
    admin_romantic_room: "badge-purple", admin_keuangan: "badge-blue",
    admin_kegiatan: "badge-orange",
  };

  return (
    <div>
      <Topbar title="Admin - Kelola User" role={userRole} />
      <div className="page-content">
        <div className="page-header">
          <div className="page-header-left">
            <h2>Kelola User</h2>
            <p>Manage hak akses pengguna sistem</p>
          </div>
          <span className="badge badge-blue">{total} user ditemukan</span>
        </div>

        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="search-bar" style={{ flex: 1, maxWidth: "400px" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                className="form-control"
                placeholder="Cari nama atau email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          <div className="table-wrapper">
            {loading ? (
              <div className="loading"><div className="spinner" /></div>
            ) : data.length === 0 ? (
               <div className="empty-state">
                 <p>Tidak ada user ditemukan.</p>
               </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Desa</th>
                    <th>Kelompok</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((user) => (
                    <tr key={user.id}>
                      <td style={{ fontWeight: 500 }}>{user.name}</td>
                      <td className="text-muted">{user.email}</td>
                      <td>
                        <span className={`badge ${roleColors[user.role] || "badge-gray"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        {["desa", "kelompok", "creator", "generus", "tim_pnkb"].includes(user.role) ? (
                          <select className="form-control" style={{ padding: "4px 8px", fontSize: 12, minWidth: 100 }} value={user.desaId || ""} onChange={(e) => updateUser(user.id, { desaId: Number(e.target.value) })}>
                            <option value="">Pilih Desa</option>
                            {desaList.map(d => <option key={d.id} value={d.id}>{d.nama}</option>)}
                          </select>
                        ) : "-"}
                      </td>
                      <td>
                        {["kelompok", "creator", "generus", "tim_pnkb"].includes(user.role) ? (
                          <select className="form-control" style={{ padding: "4px 8px", fontSize: 12, minWidth: 100 }} value={user.kelompokId || ""} onChange={(e) => updateUser(user.id, { kelompokId: Number(e.target.value) })}>
                            <option value="">Pilih Kelompok</option>
                            {kelompokList.filter(k => !user.desaId || k.desaId === user.desaId).map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                          </select>
                        ) : "-"}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <select className="form-control" style={{ padding: "4px 8px", fontSize: 12, width: "auto" }} value={user.role} onChange={(e) => updateUser(user.id, { role: e.target.value })}>
                            <option value="generus">Generus</option>
                            <option value="creator">Creator/Penulis</option>
                            <option value="kelompok">Pengurus Kelompok</option>
                            <option value="desa">Pengurus Desa</option>
                            <option value="pending">Menunggu (Pending)</option>
                            <option value="admin">Admin Utama</option>
                            <option value="pengurus_daerah">Pengurus Daerah</option>
                            <option value="kmm_daerah">KMM Daerah</option>
                            <option value="tim_pnkb">Tim PNKB</option>
                            <option value="admin_romantic_room">Admin Romantic Room</option>
                            <option value="admin_keuangan">Admin Keuangan</option>
                            <option value="admin_kegiatan">Admin Kegiatan</option>
                          </select>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(user.id)}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <span className="page-info">Halaman {page} dari {totalPages}</span>
              <div className="page-buttons">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >← Prev</button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
