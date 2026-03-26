"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, User } from "lucide-react";

interface Article {
  id: string;
  judul: string;
  ringkasan: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  authorName: string | null;
}

interface AutoCarouselProps {
  articles: Article[];
  autoPlayInterval?: number;
}

export function AutoCarousel({ articles, autoPlayInterval = 6000 }: AutoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mounted, setMounted] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === articles.length - 1 ? 0 : prev + 1));
  }, [articles.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? articles.length - 1 : prev - 1));
  };

  useEffect(() => {
    setMounted(true);
    if (isPaused || articles.length <= 1) return;
    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, articles.length, autoPlayInterval]);

  if (!mounted || !articles || articles.length === 0) {
    return (
      <div className="hero-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 450, background: '#1e293b', borderRadius: '12px', opacity: 0.8 }}>
        <div style={{ opacity: 0.2, fontSize: 80, animation: 'pulse 2s infinite' }}>🕌</div>
        <style jsx>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.2; }
            50% { transform: scale(1.1); opacity: 0.3; }
            100% { transform: scale(1); opacity: 0.2; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className="carousel-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <style jsx>{`
        .carousel-container {
          position: relative;
          width: 100%;
          height: 500px;
          overflow: hidden;
          background: #000;
          border-radius: 12px;
        }
        @media (max-width: 768px) {
          .carousel-container {
            height: 650px;
          }
        }
        .carousel-slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1;
        }
        .carousel-slide.active {
          opacity: 1;
          z-index: 2;
        }
        .hero-main {
          display: flex;
          height: 100%;
          width: 100%;
          background: #000;
          text-decoration: none;
        }
        .hero-main-img-wrap {
          width: 55%;
          height: 100%;
          position: relative;
          overflow: hidden;
        }
        .hero-main-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 8s ease-out;
        }
        .active .hero-main-img {
          transform: scale(1.1);
        }
        .hero-main-content {
          width: 45%;
          height: 100%;
          background: linear-gradient(135deg, #111827, #0f172a);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 40px 60px;
          color: white;
          text-align: left;
        }
        .hero-cat-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--primary);
          color: white;
          font-size: 11px;
          font-weight: 800;
          padding: 5px 14px;
          border-radius: 100px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 24px;
          width: fit-content;
        }
        .hero-main-title {
          font-family: var(--serif);
          font-size: 36px;
          font-weight: 900;
          color: white;
          line-height: 1.15;
          margin-bottom: 20px;
        }
        .hero-main-desc {
          font-size: 16px;
          color: rgba(255,255,255,0.6);
          margin-bottom: 32px;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .hero-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          background: #fff;
          color: #111827;
          font-weight: 700;
          font-size: 14px;
          border-radius: 8px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          width: fit-content;
        }
        .hero-cta:hover {
          background: var(--primary);
          color: #fff;
          transform: translateX(5px);
        }

        .carousel-nav {
          position: absolute;
          bottom: 40px;
          right: 40px;
          display: flex;
          gap: 15px;
          z-index: 20;
        }
        .nav-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
        }
        .nav-btn:hover {
          background: var(--primary);
          border-color: var(--primary);
          transform: scale(1.1);
        }
        .carousel-dots {
          position: absolute;
          bottom: 20px;
          left: 55%;
          padding-left: 60px;
          display: flex;
          gap: 10px;
          z-index: 20;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          cursor: pointer;
          transition: all 0.4s;
        }
        .dot.active {
          background: var(--primary);
          transform: scale(1.2);
        }

        @media (max-width: 1024px) {
          .hero-main-content { padding: 30px; }
          .hero-main-title { font-size: 28px; }
        }
        @media (max-width: 768px) {
          .hero-main { flex-direction: column; }
          .hero-main-img-wrap { width: 100%; height: 320px; }
          .hero-main-content { width: 100%; height: auto; padding: 40px 24px; flex: 1; }
          .hero-main-title { font-size: 24px; }
          .carousel-nav { bottom: 20px; right: 20px; }
          .carousel-dots { left: 0; padding-left: 24px; bottom: 20px; }
        }
      `}</style>

      {articles.map((article, index) => (
        <div
          key={article.id}
          className={`carousel-slide ${index === currentIndex ? "active" : ""}`}
        >
          <Link href={`/artikel/${article.id}`} className="hero-main">
            <div className="hero-main-img-wrap">
              {article.coverImage
                ? <img src={article.coverImage} alt={article.judul} className="hero-main-img" />
                : <div style={{ background: '#1a3a28', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 80, opacity: 0.2 }}>🕌</div>
              }
            </div>

            <div className="hero-main-content">
              <div className="hero-cat-pill">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }}></span>
                {(article as any).tipe?.toUpperCase() || "SOROTAN"}
              </div>

              <h1 className="hero-main-title">{article.judul}</h1>
              <p className="hero-main-desc">{article.ringkasan || "Klik untuk membaca selengkapnya mengenai informasi penting ini."}</p>

              <div className="hero-cta">
                Baca Selengkapnya
                <ChevronRight size={18} />
              </div>
            </div>
          </Link>
        </div>
      ))}

      {articles.length > 1 && (
        <>
          <div className="carousel-nav">
            <button className="nav-btn" onClick={prevSlide} aria-label="Previous slide">
              <ChevronLeft size={24} />
            </button>
            <button className="nav-btn" onClick={nextSlide} aria-label="Next slide">
              <ChevronRight size={24} />
            </button>
          </div>
          <div className="carousel-dots">
            {articles.map((_, i) => (
              <div
                key={i}
                className={`dot ${i === currentIndex ? "active" : ""}`}
                onClick={() => setCurrentIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
