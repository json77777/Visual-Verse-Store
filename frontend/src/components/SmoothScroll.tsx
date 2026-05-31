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

    let cancelled = false;

    // Try to perform a safe resize + scroll after the page has loaded.
    // Some users report the first visit renders late (images/fonts) which
    // can shift layout after Lenis initializes. We wait for `load` and then
    // retry a few times to find the hash target before falling back to top.
    const doResizeAndScroll = () => {
      if (!lenis) return;
      lenis.resize();

      const hash = window.location.hash;

      const tryScrollToHash = (retries = 10, delay = 120) => {
        if (cancelled) return;
        if (!hash) {
          lenis.scrollTo(0, { immediate: true });
          return;
        }

        const id = hash.substring(1);
        const el = document.getElementById(id);

        if (el && (el.offsetHeight > 0 || el.getBoundingClientRect().height > 0)) {
          // Target is present and has layout, scroll to it smoothly
          lenis.scrollTo(el, { immediate: true });
        } else if (retries > 0) {
          // Retry after a short delay to allow images/fonts/layout to settle
          setTimeout(() => tryScrollToHash(retries - 1, delay), delay);
        } else {
          // Give up and ensure we're at the top
          lenis.scrollTo(0, { immediate: true });
        }
      };

      tryScrollToHash();
    };

    if (document.readyState === "complete") {
      // Page already loaded
      doResizeAndScroll();
    } else {
      // Wait for load to ensure images/fonts finished
      const onLoad = () => doResizeAndScroll();
      window.addEventListener("load", onLoad, { once: true });

      // Also kick a resize/scroll shortly after navigation in case load already fired
      const shortTimeout = setTimeout(() => doResizeAndScroll(), 300);

      return () => {
        cancelled = true;
        window.removeEventListener("load", onLoad);
        clearTimeout(shortTimeout);
      };
    }
    
    return () => {
      cancelled = true;
    };
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
