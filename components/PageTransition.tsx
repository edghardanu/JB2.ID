'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function PageTransition() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // When pathname or searchParams changes, we stop the loading bar
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (
        anchor &&
        anchor.href &&
        anchor.href.startsWith(window.location.origin) &&
        !anchor.href.includes('#') &&
        anchor.target !== '_blank' &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        // Only trigger if it's an internal link and not a special click
        // Also check if it's actually changing the page or the same page
        const url = new URL(anchor.href);
        if (url.pathname !== window.location.pathname || url.search !== window.location.search) {
          setLoading(true);
        }
      }
    };

    window.addEventListener('click', handleAnchorClick);
    return () => window.removeEventListener('click', handleAnchorClick);
  }, []);

  if (!loading) return null;

  return (
    <div className="loader-progress-bar" style={{ position: 'fixed', top: 0, left: 0, zIndex: 10001 }} />
  );
}
