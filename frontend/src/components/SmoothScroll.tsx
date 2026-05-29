"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

function LenisRefresh() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lenis = useLenis();

  // 1. Handle route changes and initial load hashes
  useEffect(() => {
    if (!lenis) return;
    
    const timeoutId = setTimeout(() => {
      lenis.resize();
      
      const hash = window.location.hash;
      if (hash) {
        const el = document.getElementById(hash.substring(1));
        if (el) {
          lenis.scrollTo(el, { immediate: false });
          return;
        }
      }
      
      lenis.scrollTo(0, { immediate: true });
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [pathname, searchParams, lenis]);

  // 2. Intercept clicks on hash links to trigger Lenis smooth scroll
  useEffect(() => {
    if (!lenis) return;

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (target && target.hash && target.origin === window.location.origin) {
        // If clicking a hash link for the current page
        if (target.pathname === pathname) {
          e.preventDefault();
          const el = document.getElementById(target.hash.substring(1));
          if (el) {
            lenis.scrollTo(el);
            window.history.pushState(null, "", target.hash);
          }
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [lenis, pathname]);

  return null;
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      <LenisRefresh />
      {children}
    </ReactLenis>
  );
}
