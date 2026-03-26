import type { Metadata } from "next";
import "./globals.css";
import PageTransition from "@/components/PageTransition";
import ThemeConfig from "@/components/ThemeConfig";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: {
    template: "%s | JB2.ID",
    default: "JB2.ID - Sistem Manajemen Generus Jakarta Barat 2",
  },
  description: "Sistem Manajemen Generus Jakarta Barat 2, Kegiatan, dan Absensi JB2.ID",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body suppressHydrationWarning>
        <Suspense fallback={null}>
          <ThemeConfig />
          <PageTransition />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
