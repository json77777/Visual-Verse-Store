"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

export function CornerElements() {
  const [time, setTime] = useState("");
  const [ownerNote, setOwnerNote] = useState("");
  const [noteTimestamp, setNoteTimestamp] = useState<string | null>(null);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isUnread, setIsUnread] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setTime(`${hours}:${minutes}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 0. Track Unique Visitor
    const trackVisitor = async () => {
      try {
        if (sessionStorage.getItem("vv_visit_tracked")) return;

        let visitorId = localStorage.getItem("vv_visitor_id");
        if (!visitorId) {
          visitorId = crypto.randomUUID();
          localStorage.setItem("vv_visitor_id", visitorId);
        }

        await apiFetch("/api/v1/settings/track-visit", {
          method: "POST",
          body: { visitorId }
        });
        
        sessionStorage.setItem("vv_visit_tracked", "true");
      } catch (err) {
        // ignore
      }
    };
    trackVisitor();

    // 1. Initial fetch to get the current state
    apiFetch<ApiResponse<{value: string, updatedAt: string} | null>>(`/api/v1/settings/owner_note?t=${Date.now()}`)
      .then((data) => {
        if (data?.success && data.data) {
          const noteText = data.data.value;
          setOwnerNote(noteText);
          setNoteTimestamp(data.data.updatedAt);
          
          const lastReadNote = localStorage.getItem("lastReadOwnerNote");
          if (lastReadNote !== noteText) {
            setIsUnread(true);
          }
        } else {
          setOwnerNote("Welcome to Visual Verse!");
        }
      })
      .catch(() => setOwnerNote("Welcome to Visual Verse!"));

    // 2. Open real-time SSE connection for instant zero-latency updates
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      if (eventSource) {
        eventSource.close();
      }
      
      eventSource = new EventSource(`${baseUrl}/api/v1/settings/stream`, { withCredentials: true });

      eventSource.onmessage = (event) => {
        if (event.data === "connected") return;
        
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "presence") {
            window.dispatchEvent(new CustomEvent("user-presence", { detail: data }));
            return;
          }

          if (data.type === "visitor_count") {
            window.dispatchEvent(new CustomEvent("visitor-count", { detail: data }));
            return;
          }

          if (data && data.value) {
            const noteText = data.value;
            setOwnerNote(noteText);
            setNoteTimestamp(data.updatedAt);
            
            const lastReadNote = localStorage.getItem("lastReadOwnerNote");
            if (lastReadNote !== noteText) {
              setIsUnread(true);
            }
          }
        } catch (err) {
          // ignore parse errors
        }
      };
    };

    connectSSE();

    const handleAuthChange = () => {
      connectSSE();
    };

    window.addEventListener("vv:user-updated", handleAuthChange as EventListener);

    return () => {
      window.removeEventListener("vv:user-updated", handleAuthChange as EventListener);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsNoteOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleNote = () => {
    if (!isNoteOpen && isUnread) {
      // Mark as read when opening
      setIsUnread(false);
      localStorage.setItem("lastReadOwnerNote", ownerNote);
    }
    setIsNoteOpen(!isNoteOpen);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Top Left Time */}
      <div className="absolute top-6 left-4 md:left-6 xl:left-0 h-[58px] xl:w-[calc(50vw-512px)] hidden min-[1194px]:flex items-center justify-start xl:justify-center text-white font-syne text-[16px] font-bold tracking-[0.1em]">
        <span className="hidden min-[1440px]:inline">IN&nbsp;</span>
        {time}
      </div>

      {/* Top Right Owner's Note */}
      <div className="absolute bottom-6 right-6 min-[1194px]:bottom-auto min-[1194px]:top-6 min-[1194px]:right-0 min-[1194px]:w-[calc(50vw-512px)] flex flex-col items-end xl:items-center justify-start pointer-events-auto min-[1194px]:pr-8 xl:pr-0" ref={popoverRef}>
        <button 
          onClick={handleToggleNote}
          className="h-12 w-12 min-[1194px]:h-[58px] min-[1194px]:w-auto bg-[#111] min-[1194px]:bg-transparent border border-white/10 min-[1194px]:border-transparent rounded-full min-[1194px]:rounded-none flex items-center justify-center gap-2 text-white font-syne text-[16px] font-bold tracking-[-0.02em] hover:text-white/80 transition-colors cursor-pointer shadow-lg min-[1194px]:shadow-none"
        >
          <div className="relative flex items-center justify-center">
            <Image 
              src="/icons/speech-bubble.png" 
              alt="Message" 
              width={16} 
              height={16} 
              className="invert"
            />
            {isUnread && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] border border-[#080808]"></span>
            )}
          </div>
          <span className="hidden min-[1440px]:inline">Owner's Note!</span>
        </button>

        <AnimatePresence>
          {isNoteOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute bottom-[60px] min-[1194px]:bottom-auto min-[1194px]:top-[58px] right-0 min-[1194px]:right-8 xl:right-auto xl:-translate-x-[calc(50%-16px)] xl:left-1/2 w-80 p-5 mt-2 rounded-xl border border-white/10 bg-[#0A0A0A]/95 backdrop-blur-[40px] shadow-[0_10px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(255,255,255,0.03)] ring-1 ring-white/[0.05] z-50 text-left origin-bottom-right min-[1194px]:origin-top-right xl:origin-top"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                  <span className="text-[10px] font-dm-sans font-bold uppercase tracking-widest text-white/50">From the Admin</span>
                </div>
                {noteTimestamp && (
                  <span className="text-[9px] font-dm-sans text-white/30 uppercase tracking-widest">
                    {new Date(noteTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
              <p className="font-dm-sans text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                {ownerNote}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
