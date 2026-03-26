"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import NewsTicker from "./NewsTicker";

const DigitalClock = dynamic(() => import("@/components/DigitalClock"), { ssr: false });

export default function HomeHeader({ session }: { session: any }) {
  const [mounted, setMounted] = useState(false);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const handleLogoUpdate = () => {
      setSiteLogo((window as any).__SITE_LOGO__ || null);
    };
    handleLogoUpdate();
    window.addEventListener('site-logo-updated', handleLogoUpdate);
    return () => window.removeEventListener('site-logo-updated', handleLogoUpdate);
  }, []);

  // Return a baseline skeleton on server to match initial client render
  // Crucially, this skeleton MUST be identical to the first render on browser.
  return (
    <div suppressHydrationWarning>
      {/* ═══ TOPBAR ═══ */}
      <div className="topbar">
        <div className="wrap">
          <div className="topbar-inner" style={{ gap: '30px' }}>
            <DigitalClock />
            <div className="topbar-auth">
              {session ? (
                <Link href="/dashboard" className="tb-btn tb-btn-dashboard">⚡ Dashboard</Link>
              ) : (
                <>
                  <Link href="/login" className="tb-btn tb-btn-ghost">Masuk</Link>
                  <Link href="/register" className="tb-btn tb-btn-fill">Daftar</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MASTHEAD ═══ */}
      <div className="masthead">
        <div className="wrap">
          <div className="masthead-inner">
            <div className="masthead-brand" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {siteLogo && (
                <img src={siteLogo} alt="Logo" style={{ width: "50px", height: "50px", objectFit: "contain" }} />
              )}
              <div>
                <div className="masthead-title">JB2.ID</div>
                <div className="masthead-sub">Berita & Informasi Generasi Penerus PC LDII Jakarta Barat 2</div>
              </div>
            </div>

            <div className="masthead-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <DigitalClock className="masthead-edition" />
              <div className="masthead-cta" style={{ gap: '12px' }}>
                {session ? (
                  <Link href="/dashboard" className="ms-btn ms-btn-dash">Dashboard →</Link>
                ) : (
                  <>
                    <Link href="/login" className="ms-btn ms-btn-border">Masuk</Link>
                    <Link href="/register" className="ms-btn ms-btn-fill">Daftar Gratis</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
