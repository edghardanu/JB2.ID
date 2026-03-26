"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PublishButton({ id, tipe }: { id: string; tipe: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const endpoint = tipe === "berita" ? `/api/berita/${id}` : `/api/artikel/${id}`;

  const handlePublish = async () => {
    setLoading(true);
    await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    });
    router.refresh();
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="flex gap-2">
      <button className="btn btn-sm btn-success" onClick={handlePublish} disabled={loading}>
        ✓ Publish
      </button>
      <button className="btn btn-sm btn-danger" onClick={handleReject} disabled={loading}>
        ✕ Tolak
      </button>
    </div>
  );
}
