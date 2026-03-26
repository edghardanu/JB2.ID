"use client";

import { useState, useEffect } from "react";

interface Props {
  showDate?: boolean;
  showTime?: boolean;
  className?: string;
}

export default function DigitalClock({ showDate = true, showTime = true, className }: Props) {
  const [dateTime, setDateTime] = useState<{ date: string; time: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      const now = new Date();

      const dateStr = now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });

      const timeStr = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }) + " WIB";

      setDateTime({ date: dateStr, time: timeStr });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div 
      className={className || "topbar-date"} 
      style={{ display: 'flex', alignItems: 'center' }}
    >
      {!dateTime ? (
        <span>Memuat waktu...</span>
      ) : (
        <>
          {showDate && <span style={{ marginRight: 12 }} suppressHydrationWarning>{dateTime.date}</span>}
          {showTime && (
            <span className="digital-clock" style={{ display: 'inline-flex', alignItems: 'center' }} suppressHydrationWarning>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {dateTime.time}
            </span>
          )}
        </>
      )}
    </div>
  );
}
