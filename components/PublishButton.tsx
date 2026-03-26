"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PublishButton({ id, tipe }: { id: string; tipe: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const endpoint = tipe === "berita" ? `/api/berita/${id}` : `/api/artikel/${id}`;

  const handlePublish = async () => {
    setLoading(true);
    try {
      await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <style jsx>{`
        .btn-success { background: #16a34a; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 700; transition: background 0.2s; }
        .btn-success:hover { background: #15803d; }
        .btn-danger { background: #dc2626; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 700; transition: background 0.2s; }
        .btn-danger:hover { background: #b91c1c; }
        .flex { display: flex; }
        .gap-2 { gap: 8px; }
      `}</style>
      <button className="btn-success" onClick={handlePublish} disabled={loading}>
        {loading ? "..." : "✓ Setujui"}
      </button>
      <button className="btn-danger" onClick={handleReject} disabled={loading}>
        {loading ? "..." : "✕ Tolak"}
      </button>
    </div>
  );
}
