"use client";

import Link from "next/link";
import { useState } from "react";

export default function HomeNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="wrap">
        <div className="navbar-inner">
          <button 
            className="landing-hamburger" 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Menu"
          >
            {isOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            )}
          </button>

          <div className={`nav-links ${isOpen ? "active" : ""}`}>
            <Link href="/" className="nav-link nav-link-active" onClick={() => setIsOpen(false)}>Beranda</Link>
            <Link href="/#artikel" className="nav-link" onClick={() => setIsOpen(false)}>Artikel</Link>
            <Link href="/#berita" className="nav-link" onClick={() => setIsOpen(false)}>Berita</Link>
            <div className="nav-item">
              <Link href="/anggota" className="nav-link nav-dropdown-trigger" style={{ display: 'flex', alignItems: 'center' }}>
                Organisasi
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: 6 }}><path d="m6 9 6 6 6-6" /></svg>
              </Link>
              <div className="nav-dropdown">
                <Link href="/anggota" className="nav-dropdown-link" onClick={() => setIsOpen(false)}>Profil Anggota</Link>
                <Link href="/kegiatan" className="nav-dropdown-link" onClick={() => setIsOpen(false)}>Kegiatan</Link>
              </div>
            </div>
            <Link href="/login" className="nav-link" onClick={() => setIsOpen(false)}>Masuk</Link>
            <Link href="/register" className="nav-link" onClick={() => setIsOpen(false)}>Daftar</Link>
          </div>
          <div className="nav-search">
            <svg width="14" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input type="text" placeholder="Cari di Web ini..." />
          </div>
        </div>
      </div>

    </nav>
  );
}
