import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/register", "/api/auth/login", "/api/auth/register", "/api/auth/desa", "/api/auth/kelompok", "/api/auth/reset-password", "/api/settings"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow public artikel and berita page
  if (pathname === "/" || pathname.startsWith("/artikel") || pathname.startsWith("/berita")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyToken(token);

  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth-token");
    return response;
  }

  // Admin-only routes
  if (pathname.startsWith("/admin") && !["admin", "pengurus_daerah", "kmm_daerah", "admin_romantic_room", "tim_pnkb", "admin_keuangan", "admin_kegiatan"].includes(payload.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Generus & Creator restriction
  if ((payload.role === "generus" || payload.role === "creator") && 
      !pathname.startsWith("/dashboard") && 
      !pathname.startsWith("/profile") && 
      !pathname.startsWith("/katalog") && 
      !pathname.startsWith("/mandiri") &&
      !pathname.startsWith("/api/profile") && 
      !pathname.startsWith("/api/mandiri") &&
      !pathname.startsWith("/api/auth/logout") &&
      !pathname.startsWith("/api/generus") &&
      !pathname.startsWith("/rab") &&
      !pathname.startsWith("/api/rab") &&
      !pathname.startsWith("/rundown") &&
      !pathname.startsWith("/api/rundown") &&
      !PUBLIC_PATHS.some(p => pathname.startsWith(p)) &&
      pathname !== "/" && !pathname.startsWith("/artikel") && !pathname.startsWith("/berita") && !pathname.startsWith("/api/berita") && !pathname.startsWith("/api/artikel") && !pathname.startsWith("/api/upload")) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  // Pending-only restriction
  if (payload.role === "pending" && 
      !pathname.startsWith("/pending") &&
      !pathname.startsWith("/api/auth/logout") &&
      !PUBLIC_PATHS.some(p => pathname.startsWith(p)) &&
      pathname !== "/" && !pathname.startsWith("/artikel") && !pathname.startsWith("/berita")) {
    return NextResponse.redirect(new URL("/pending", request.url));
  }

  // Admin Romantic Room / Tim PNKB / Admin Keuangan / Creator / Admin Kegiatan restriction
  if (["admin_romantic_room", "tim_pnkb", "admin_keuangan", "creator", "admin_kegiatan"].includes(payload.role) && 
      !pathname.startsWith("/dashboard") &&
      !pathname.startsWith("/mandiri") &&
      !pathname.startsWith("/admin/katalog") &&
      !pathname.startsWith("/admin/anggaran") &&
      !pathname.startsWith("/api/mandiri") &&
      !pathname.startsWith("/api/generus") &&
      !pathname.startsWith("/api/profile") &&
      !pathname.startsWith("/profile") &&
      !pathname.startsWith("/generus") &&
      !pathname.startsWith("/kegiatan") &&
      !pathname.startsWith("/rab") &&
      !pathname.startsWith("/api/rab") &&
      !pathname.startsWith("/rundown") &&
      !pathname.startsWith("/api/rundown") &&
      !pathname.startsWith("/api/kegiatan") &&
      !pathname.startsWith("/api/berita") &&
      !pathname.startsWith("/api/artikel") &&
      !pathname.startsWith("/api/upload") &&
      !pathname.startsWith("/api/auth/logout") &&
      !PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Security Headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: *; connect-src 'self';");
  
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
