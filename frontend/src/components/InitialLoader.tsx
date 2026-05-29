"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function InitialLoader() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Check if user has already seen the loader this session
    const hasSeenLoader = sessionStorage.getItem("vv_has_seen_loader");

    if (hasSeenLoader) {
      setShow(false);
    } else {
      // Set the flag and hide loader after 2.5 seconds
      sessionStorage.setItem("vv_has_seen_loader", "true");

      // We lock scrolling while loader is visible
      document.body.style.overflow = "hidden";

      const timer = setTimeout(() => {
        setShow(false);
        document.body.style.overflow = "";
      }, 2000);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    }
  }, []);

  // Avoid hydration mismatch by not rendering anything on server
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#080808]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center gap-10"
          >
            <motion.div
              animate={{ opacity: [1, 0.7, 1], scale: [1, 0.98, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/logo/vvlogo-updated.png"
                alt="Visual Verse Logo"
                width={80}
                height={80}
                priority
                className="drop-shadow-[0_0_30px_rgba(220,38,38,0.5)]"
                style={{ filter: "brightness(0) saturate(100%) invert(26%) sepia(85%) saturate(7403%) hue-rotate(354deg) brightness(101%) contrast(116%)" }}
              />
            </motion.div>

            {/* Sharp, large white loading bar */}
            <div className="w-80 h-[3px] bg-white/10 overflow-hidden relative">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
