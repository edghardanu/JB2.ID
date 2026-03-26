"use client";

import { useEffect, useState } from "react";

interface TopbarProps {
  title: string;
  role?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function Topbar({ title, role, className = "", children }: TopbarProps) {
  const [siteLogo, setSiteLogo] = useState<string | null>(null);

  useEffect(() => {
    // Initial logo fetch if already in window
    if (typeof window !== 'undefined') {
      const handleLogoUpdate = () => {
        setSiteLogo((window as any).__SITE_LOGO__ || null);
      };
      handleLogoUpdate();
      window.addEventListener('site-logo-updated', handleLogoUpdate);
      return () => window.removeEventListener('site-logo-updated', handleLogoUpdate);
    }
  }, []);

  const roleLabel: Record<string, string> = {
    admin: "Administrator",
    pengurus_daerah: "Pengurus Daerah",
    kmm_daerah: "KMM Daerah",
    desa: "Pengurus Desa",
    kelompok: "Pengurus Kelompok",
    generus: "Generus",
    creator: "Creator/Penulis",
    pending: "Pending",
    tim_pnkb: "Tim PNKB",
    admin_romantic_room: "Admin Romantic Room",
    admin_keuangan: "Admin Keuangan",
    admin_kegiatan: "Admin Kegiatan",
  };

  const roleColor: Record<string, string> = {
    admin: "badge-red",
    pengurus_daerah: "badge-red", 
    kmm_daerah: "badge-red",
    desa: "badge-blue",
    kelompok: "badge-green",
    generus: "badge-purple",
    creator: "badge-orange",
    pending: "badge-gray",
    tim_pnkb: "badge-blue",
    admin_romantic_room: "badge-purple",
    admin_keuangan: "badge-blue",
    admin_kegiatan: "badge-orange",
  };

  return (
    <div className={`topbar ${className}`}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {siteLogo && (
          <img 
            src={siteLogo} 
            alt="Logo" 
            style={{ width: "28px", height: "28px", objectFit: "contain" }} 
          />
        )}
        <span className="topbar-title">{title}</span>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {children && (
          <div className="topbar-actions" style={{ display: "flex", gap: "12px" }}>
            {children}
          </div>
        )}
        {role && roleLabel[role] && (
          <span className={`badge ${roleColor[role] || "badge-blue"}`} style={{ whiteSpace: "nowrap" }}>
            {roleLabel[role]}
          </span>
        )}
      </div>
    </div>
  );
}
