"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import GlobalLoading from "@/components/GlobalLoading";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
    foto?: string;
    generusId?: string | null;
    isInMandiri?: boolean;
  };
}

const navItems = [
  {
    section: "Menu Utama",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "grid" },
    ],
  },
  {
    section: "Usia Mandiri/Nikah",
    roles: ["admin", "pengurus_daerah", "kmm_daerah", "admin_keuangan"],
    items: [
      { href: "/mandiri", label: "Peserta Mandiri", icon: "sparkles" },
      { href: "/mandiri/data", label: "Data Usia Mandiri", icon: "users" },
      { href: "/mandiri/kegiatan", label: "Kegiatan Mandiri", icon: "calendar" },
      { href: "/mandiri/absensi", label: "Absensi Mandiri", icon: "check-square" },
      { href: "/katalog", label: "Katalog Mandiri", icon: "heart" },
      { href: "/mandiri/antrean", label: "Antrean", icon: "grid" },
      { href: "/mandiri/romantic-room", label: "Romantic Room", icon: "heart" },
      { href: "/mandiri/desa", label: "Kelola Desa", icon: "map" },
      { href: "/rab?type=mandiri", label: "RAB Kegiatan Mandiri", icon: "dollar-sign", roles: ["admin", "pengurus_daerah", "admin_keuangan"] },
    ],
  },
  {
    section: "Data & Konten",
    items: [
      { href: "/generus", label: "Data Generus", icon: "users" },
      { href: "/kegiatan", label: "Kegiatan", icon: "calendar" },
      { href: "/absensi", label: "Absensi", icon: "check-square" },
      { href: "/rundown", label: "Rundown Acara", icon: "list", roles: ["admin", "pengurus_daerah", "kmm_daerah", "admin_kegiatan", "admin_romantic_room"] },
      { href: "/artikel", label: "Artikel", icon: "book-open" },
      { href: "/berita", label: "Berita", icon: "file-text" },
      { href: "/rab?type=kegiatan", label: "RAB Kegiatan", icon: "dollar-sign", roles: ["admin", "pengurus_daerah", "admin_keuangan"] },
    ],
  },
  {
    section: "Admin",
    roles: ["admin", "pengurus_daerah", "kmm_daerah", "admin_romantic_room", "admin_kegiatan"],
    items: [
      { href: "/admin/logo", label: "Logo & Tema", icon: "settings", roles: ["admin"] },
      { href: "/admin/users", label: "Kelola User", icon: "user-cog", roles: ["admin", "pengurus_daerah", "kmm_daerah"] },
      { href: "/admin/desa", label: "Kelola Desa", icon: "map", roles: ["admin", "pengurus_daerah", "kmm_daerah"] },
      { href: "/admin/berita", label: "Moderasi Berita", icon: "file-text", roles: ["admin", "pengurus_daerah", "kmm_daerah"] },
      { href: "/admin/artikel", label: "Moderasi Artikel", icon: "book-open", roles: ["admin", "pengurus_daerah", "kmm_daerah"] },
      { href: "/katalog", label: "Katalog Mandiri", icon: "heart", roles: ["admin_romantic_room"] },
      { href: "/mandiri/romantic-room", label: "Romantic Room", icon: "heart", roles: ["admin_romantic_room"] },
    ],
  },
  {
    section: "Menu Pribadi",
    roles: ["admin", "pengurus_daerah", "kmm_daerah", "desa", "kelompok", "admin_kegiatan"],
    items: [
      { href: "/profile", label: "Profil Saya (QR)", icon: "user" },
    ],
  },
];

const userNavs: Record<string, any[]> = {
  generus: [
    {
      section: "Menu Pribadi",
      items: [
        { href: "/profile", label: "Profil Saya (QR)", icon: "user" },
      ],
    },
  ],
  peserta: [
    {
      section: "Usia Mandiri/Nikah",
      items: [
        { href: "/katalog", label: "Katalog Mandiri", icon: "heart" },
        { href: "/mandiri/antrean", label: "Antrean", icon: "grid" },
        { href: "/mandiri/romantic-room", label: "Romantic Room", icon: "heart" },
      ],
    },
    {
      section: "Menu Pribadi",
      items: [
        { href: "/profile", label: "Profil Saya (QR)", icon: "user" },
      ],
    },
  ],
  creator: [
    {
      section: "Menu Utama",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: "grid" },
        { href: "/artikel", label: "Artikel", icon: "book-open" },
        { href: "/berita", label: "Berita", icon: "file-text" },
      ],
    },
    {
      section: "Menu Pribadi",
      items: [
        { href: "/profile", label: "Profil Saya (QR)", icon: "user" },
      ],
    },
  ],
  tim_pnkb: [
    {
      section: "Menu Utama",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: "grid" },
      ],
    },
    {
      section: "Usia Mandiri/Nikah",
      items: [
        { href: "/mandiri/data", label: "Data Usia Mandiri", icon: "users" },
        { href: "/katalog", label: "Katalog Mandiri", icon: "heart" },
        { href: "/mandiri/antrean", label: "Antrean", icon: "grid" },
        { href: "/mandiri/romantic-room", label: "Romantic Room", icon: "heart" },
      ],
    },

    {
      section: "Menu Pribadi",
      items: [
        { href: "/profile", label: "Profil Saya (QR)", icon: "user" },
      ],
    },
  ],
  admin_romantic_room: [
    {
      section: "Menu Utama",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: "grid" },
      ],
    },
    {
      section: "Usia Mandiri/Nikah",
      items: [
        { href: "/mandiri/data", label: "Data Usia Mandiri", icon: "users" },
        { href: "/katalog", label: "Katalog Mandiri", icon: "heart" },
        { href: "/mandiri/antrean", label: "Antrean", icon: "grid" },
        { href: "/mandiri/romantic-room", label: "Romantic Room", icon: "heart" },
      ],
    },
    {
      section: "Data & Konten",
      items: [
        { href: "/rundown", label: "Rundown Acara", icon: "list" },
      ],
    },
    {
      section: "Menu Pribadi",
      items: [
        { href: "/profile", label: "Profil Saya (QR)", icon: "user" },
      ],
    },
  ],
  admin_keuangan: [
    {
      section: "Menu Utama",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: "grid" },
      ],
    },
    {
      section: "Usia Mandiri/Nikah",
      items: [
        { href: "/mandiri/data", label: "Data Usia Mandiri", icon: "users" },
        { href: "/mandiri/kegiatan", label: "Kegiatan Mandiri", icon: "calendar" },
        { href: "/rab?type=mandiri", label: "RAB Kegiatan Mandiri", icon: "dollar-sign" },
      ],
    },
    {
      section: "Data & Konten",
      items: [
        { href: "/kegiatan", label: "Kegiatan", icon: "calendar" },
        { href: "/rab?type=kegiatan", label: "RAB Kegiatan", icon: "dollar-sign" },
        { href: "/generus", label: "Data Generus", icon: "users" },
      ],
    },
    {
      section: "Menu Pribadi",
      items: [
        { href: "/profile", label: "Profil Saya (QR)", icon: "user" },
      ],
    },
  ],
};

const icons: Record<string, React.ReactNode> = {
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  "check-square": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  "file-text": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  "user-cog": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4" />
      <circle cx="19" cy="19" r="2" />
      <path d="M19 15v2M19 21v2M15 19h2M21 19h2" />
    </svg>
  ),
  map: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  "edit-3": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  "book-open": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a4 4 0 0 0-4-4H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a4 4 0 0 1 4-4h6z" />
    </svg>
  ),
  sparkles: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="m5 3 1 1" />
      <path d="m19 17 1 1" />
      <path d="M19 3l1 1" />
      <path d="m5 17 1 1" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  "dollar-sign": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
};

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [siteLogo, setSiteLogo] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname, setIsOpen]);

  useEffect(() => {
    const handleLogoUpdate = () => {
      setSiteLogo((window as any).__SITE_LOGO__ || null);
    };
    handleLogoUpdate();
    window.addEventListener('site-logo-updated', handleLogoUpdate);
    return () => window.removeEventListener('site-logo-updated', handleLogoUpdate);
  }, []);

  if (!mounted) return <aside className="sidebar loading"></aside>;

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Konfirmasi Keluar',
      text: `Apakah Anda yakin ingin keluar dari ${user.name}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Keluar!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    }
  };

  const initials = (user?.name || "??")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {loggingOut && <GlobalLoading />}
      <button
        className={`mobile-menu-btn ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        )}
      </button>

      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-logo" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {siteLogo && (
            <img src={siteLogo} alt="Logo" className="sidebar-logo-img" />
          )}
          <div>
            <h1>JB2.ID</h1>
            <p style={{ fontSize: "9px" }}>Sistem Manajemen Generus JB2</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {(userNavs[user.role] || navItems).map((section) => {
            if (section.roles && !section.roles.includes(user.role)) return null;
            if (section.role && section.role !== user.role) return null;

            // Filter items based on access
            const visibleItems = section.items.filter((item: any) => {
              const isPanitia = ["admin", "pengurus_daerah", "kmm_daerah", "tim_pnkb", "admin_romantic_room", "admin_keuangan", "admin_kegiatan"].includes(user.role);
              
              // Hide Mandiri items if not in Mandiri and not a committee member
              const isMandiriItem = item.href.startsWith("/mandiri") || 
                                   item.label.includes("Mandiri") || 
                                   item.label === "Antrean" || 
                                   item.label === "Romantic Room" ||
                                   item.href === "/katalog";
                                   
              if (isMandiriItem && !user.isInMandiri && !isPanitia) return false;
              
              if (item.roles && !item.roles.includes(user.role)) return false;
              return true;
            });

            // If no items are visible, don't show the section at all
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.section} className="sidebar-section">
                <div className="sidebar-section-label">{section.section}</div>
                {visibleItems.map((item: any) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${pathname.startsWith(item.href) && (item.href !== "/dashboard" || pathname === "/dashboard") ? "active" : ""}`}
                  >
                    {icons[item.icon]}
                    {item.label}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user.foto ? (
                <img src={user.foto} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                initials
              )}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">
                {user.role === "admin" ? "Administrator" :
                  user.role === "pengurus_daerah" ? "Pengurus Daerah" :
                    user.role === "kmm_daerah" ? "KMM Daerah" :
                      user.role === "desa" ? "Pengurus Desa" :
                        user.role === "kelompok" ? "Pengurus Kelompok" :
                          user.role === "tim_pnkb" ? "Tim PNKB" :
                            user.role === "admin_romantic_room" ? "Admin Romantic Room" :
                              user.role === "admin_keuangan" ? "Admin Keuangan" :
                                user.role === "admin_kegiatan" ? "Admin Kegiatan" :
                                  user.role}
              </div>
            </div>
          </div>
          <button
            className="sidebar-link"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{ width: "100%", background: "none", border: "none", cursor: "pointer" }}
          >
            {icons.logout}
            {loggingOut ? "Keluar..." : "Keluar"}
          </button>
        </div>
      </aside>
    </>
  );
}
