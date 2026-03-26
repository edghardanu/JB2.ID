"use client";

import { useState, useRef } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

interface ImportModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function ImportModal({ onClose, onSaved }: ImportModalProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
       setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          
          if (!data || data.length === 0) {
            setLoading(false);
            return Swal.fire("Error", "File Excel Anda terlihat kosong.", "error");
          }

          const res = await fetch("/api/generus/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: data }),
          });

          const json = await res.json();
          setLoading(false);

          if (json.success) {
            Swal.fire({
              title: "Import Massal Selesai",
              html: `<p style="font-size: 14px;">${json.message}</p>
                     ${json.details?.failed > 0 ? `
                        <div style="margin-top: 15px; text-align: left; background: #fff5f5; padding: 10px; border-radius: 8px; border: 1px solid #feb2b2; max-height: 150px; overflow-y: auto;">
                          <p style="font-weight: 700; color: #c53030; margin-bottom: 5px;">Detail Error (${json.details.failed} baris):</p>
                          <ul style="font-size: 11px; color: #c53030; padding-left: 15px;">
                            ${json.details.errors.map((e: string) => `<li>${e}</li>`).join("")}
                          </ul>
                        </div>
                     ` : ""}`,
              icon: json.details?.failed > 0 ? "warning" : "success",
              confirmButtonText: "Selesai",
              confirmButtonColor: "#3b82f6"
            }).then(() => {
              onSaved();
            });
          } else {
            Swal.fire("Gagal", json.error || "Terjadi kesalahan sistem.", "error");
          }
        } catch (err: any) {
          setLoading(false);
          Swal.fire("Format Error", "Gagal membaca format file Excel. Pastikan file valid.", "error");
        }
      };
      reader.readAsBinaryString(file);
    } catch (e: any) {
      setLoading(false);
      Swal.fire("Error", e.message, "error");
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        "Nama": "Ahmad",
        "Jenis Kelamin": "Laki-laki",
        "Kategori Usia": "SMA",
        "Tempat Lahir": "Jakarta",
        "Tanggal Lahir": "2008-05-20",
        "Alamat": "Komlek Meruya Ilir",
        "No Telp": "081234567890",
        "Desa": "Desa Sukamaju",
        "Kelompok": "Kelompok A - Desa Sukamaju"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Generus");
    XLSX.writeFile(wb, "Template_Import_Massal.xlsx");
  };

  return (
    <div className="modal-overlay" style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div className="modal" style={{ borderRadius: "24px", maxWidth: "450px" }}>
        <div className="modal-header" style={{ padding: "24px 30px", borderBottom: "none" }}>
          <h3 className="modal-title" style={{ fontSize: "20px", fontWeight: 800 }}>Bulk Import Data</h3>
          <button className="modal-close" onClick={onClose} style={{ fontSize: "28px", top: "20px" }}>&times;</button>
        </div>
        <div className="modal-body" style={{ padding: "0 30px 30px" }}>
            <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "16px", marginBottom: "24px", border: "1px solid #e2e8f0" }}>
               <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: 1.6 }}>
                  Gunakan kolom <b>Desa</b> dan <b>Kelompok</b> untuk sinkronisasi otomatis. Sistem akan membuat data wilayah baru jika belum terdaftar.
               </p>
               <button onClick={downloadTemplate} className="btn btn-sm btn-secondary" style={{ marginTop: "12px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: 600 }}>
                 📥 Download Template
               </button>
            </div>

            <div 
              className="file-drop-zone"
              style={{
                border: "2px dashed #cbd5e1",
                padding: "40px 20px",
                borderRadius: "20px",
                textAlign: "center",
                transition: "all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)",
                backgroundColor: file ? "#eff6ff" : "transparent",
                borderColor: file ? "#3b82f6" : "#cbd5e1",
                cursor: "pointer"
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: "none" }} 
                accept=".xlsx, .xls"
                onChange={handleFileChange}
              />
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>{file ? "📄" : "☁️"}</div>
              <p style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>{file ? file.name : "Pilih File .xlsx atau .xls"}</p>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px" }}>Maksimal file 5MB</p>
            </div>

            {file && !loading && (
               <button 
                  className="btn btn-primary btn-full" 
                  onClick={handleImport}
                  style={{ marginTop: "24px", padding: "16px", borderRadius: "14px", fontWeight: 700, fontSize: "16px", background: "#3b82f6", boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
               >
                 🚀 Impor Data Sekarang
               </button>
            )}

            {loading && (
               <div style={{ marginTop: "24px", textAlign: "center" }}>
                  <div className="spinner" style={{ margin: "0 auto 12px", width: "40px", height: "40px", borderTopColor: "#3b82f6" }}></div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#3b82f6" }}>Sedang Memproses...</p>
               </div>
            )}
        </div>
      </div>
    </div>
  );
}
