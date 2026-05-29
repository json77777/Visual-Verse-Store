"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ApiFetchError, apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/lib/types";
import { USER_UPDATED_EVENT } from "@/lib/userEvents";

type CurrentUser = {
  _id: string;
  role?: "user" | "admin";
};

export function AdminNavItem({ active }: { active: boolean }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await apiFetch<ApiResponse<CurrentUser>>(
          "/api/v1/users/current-user",
          { cache: "no-store", redirectOn401: false },
        );

        if (!mounted) return;
        setIsAdmin(res.data?.role === "admin");
      } catch (e) {
        if (!mounted) return;
        if (e instanceof ApiFetchError && e.status === 401) {
          setIsAdmin(false);
          return;
        }
        setIsAdmin(false);
      }
    }

    const onUserUpdated = () => void load();

    void load();
    window.addEventListener(USER_UPDATED_EVENT, onUserUpdated);
    return () => {
      mounted = false;
      window.removeEventListener(USER_UPDATED_EVENT, onUserUpdated);
    };
  }, []);

  if (!isAdmin) return null;

  return (
    <Link href="/admin/analytics" className="group relative pb-0.5 transition-colors hover:text-white vv-soft-press">
      <span className={active ? "text-white" : "text-white/60"}>Admin</span>
      <span className={`absolute inset-x-0 -bottom-1 h-0.5 bg-white rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.6)] ${active ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-50"}`} />
    </Link>
  );
}
