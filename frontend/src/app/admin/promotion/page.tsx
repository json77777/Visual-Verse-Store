"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

import { AdminShell } from "@/components/admin/AdminShell";

type AdminUser = {
  _id: string;
  fullName?: string;
  username?: string;
  email?: string;
  avatar?: string;
  role?: "user" | "admin";
  isOnline?: boolean;
};

type UsersPayload = {
  users: AdminUser[];
  uniqueVisitors?: number;
  pagination?: { totalUsers?: number };
};

export default function AdminPromotionPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [uniqueVisitors, setUniqueVisitors] = useState<number>(0);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState<string | null>(null);
  const [adminOnly, setAdminOnly] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setError(null);
      try {
        const res = await apiFetch<ApiResponse<UsersPayload>>(
          "/api/v1/users/admin/users?limit=25",
          { cache: "no-store" },
        );

        if (!mounted) return;
        setUsers(res.data?.users ?? []);
        if (res.data?.uniqueVisitors !== undefined) {
          setUniqueVisitors(res.data.uniqueVisitors);
        }
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load users");
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handlePresence = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: string; status: "online" | "offline" }>;
      const { userId, status } = customEvent.detail;
      
      setUsers((prev) =>
        prev.map((u) => {
          if (String(u._id) === String(userId)) {
            return { ...u, isOnline: status === "online" };
          }
          return u;
        })
      );
    };

    const handleVisitorCount = (e: Event) => {
      const customEvent = e as CustomEvent<{ count: number }>;
      setUniqueVisitors(customEvent.detail.count);
    };

    window.addEventListener("user-presence", handlePresence);
    window.addEventListener("visitor-count", handleVisitorCount);
    
    return () => {
      window.removeEventListener("user-presence", handlePresence);
      window.removeEventListener("visitor-count", handleVisitorCount);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (adminOnly && u.role !== "admin") return false;
      if (!q) return true;
      return (
        (u.fullName ?? "").toLowerCase().includes(q) ||
        (u.username ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, query, adminOnly]);

  async function promote(userId: string) {
    setIsWorking(userId);
    setError(null);
    try {
      const res = await apiFetch<ApiResponse<AdminUser>>(
        `/api/v1/users/admin/users/promote/${userId}`,
        { method: "PATCH" },
      );

      setUsers((prev) => prev.map((u) => (u._id === userId ? res.data : u)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to promote user");
    } finally {
      setIsWorking(null);
    }
  }

  async function demote(userId: string) {
    setIsWorking(userId);
    setError(null);
    try {
      const res = await apiFetch<ApiResponse<AdminUser>>(
        `/api/v1/users/admin/users/demote/${userId}`,
        { method: "PATCH" },
      );

      setUsers((prev) => prev.map((u) => (u._id === userId ? res.data : u)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to demote admin");
    } finally {
      setIsWorking(null);
    }
  }

  return (
    <AdminShell 
      title="User Promotion"
      actions={
        <div className="flex items-center gap-8 text-[12px] text-white/60">
          <div className="text-right">
            <p className="text-[10px] tracking-[0.16em] text-white/45">UNIQUE VISITORS</p>
            <p className="mt-1 font-syne font-bold text-2xl text-white">{uniqueVisitors.toLocaleString("en-US")}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] tracking-[0.16em] text-white/45">TOTAL ADMINS</p>
            <p className="mt-1 font-syne font-bold text-2xl text-white">
              {users.filter((u) => u.role === "admin").length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] tracking-[0.16em] text-white/45">TOTAL USERS</p>
            <p className="mt-1 font-syne font-bold text-2xl text-white">{users.length.toLocaleString("en-US")}</p>
          </div>
        </div>
      }
    >
      <div className="rounded-md border border-white/15 bg-neutral-900/50 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-white/15 bg-neutral-900 px-3 py-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search user name or email..."
              className="w-full bg-transparent font-dm-sans font-normal text-sm outline-none placeholder:text-white/35"
            />
          </div>

          <div className="flex items-center gap-2 text-[10px] tracking-[0.16em] text-white/45">
            <span>ADMIN ONLY</span>
            <button
              type="button"
              aria-pressed={adminOnly}
              onClick={() => setAdminOnly((v) => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full p-0.5 ring-1 transition-colors hover:bg-white/15 ${
                adminOnly ? "bg-red-500/25 ring-red-400/30" : "bg-white/10 ring-white/25"
              }`}
              title={adminOnly ? "Showing admins only" : "Showing all users"}
            >
              <span
                className={`h-4 w-4 rounded-full bg-white/90 shadow-sm transition-transform duration-200 ${
                  adminOnly ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="h-px w-full bg-white/10" />

        {error ? (
          <p className="px-4 py-3 text-[12px] text-red-400">{error}</p>
        ) : null}

        <div className="divide-y divide-white/10">
          {filtered.map((u) => {
            const isAdmin = u.role === "admin";
            const busy = isWorking === u._id;

            return (
              <div
                key={u._id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-9 w-9">
                    <div className="relative h-full w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
                      {u.avatar ? (
                        <Image src={u.avatar} alt="" fill sizes="36px" className="object-cover" />
                      ) : null}
                    </div>
                    {u.isOnline && (
                      <span className="absolute -top-0.5 -right-0.5 z-10 h-[10px] w-[10px] rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] border-[1.5px] border-[#080808]" title="Online"></span>
                    )}
                  </div>
                  <div>
                    <p className="font-dm-sans font-medium text-[15px] text-white">{u.fullName ?? u.username ?? "—"}</p>
                    <p className="font-dm-sans font-normal text-[13px] text-white/55">{u.email ?? "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[10px] tracking-[0.16em] ${
                      isAdmin
                        ? "border-white/25 bg-white/10 text-white"
                        : "border-white/15 bg-white/5 text-white/80"
                    }`}
                  >
                    {isAdmin ? "ADMIN" : "USER"}
                  </span>

                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => void demote(u._id)}
                      disabled={busy}
                      className="h-10 rounded-md border border-white/25 bg-neutral-900 px-4 font-dm-sans font-semibold text-[14px] text-white hover:bg-neutral-800 transition-colors disabled:opacity-60"
                    >
                      {busy ? "..." : "Demote"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void promote(u._id)}
                      disabled={busy}
                      className="h-10 rounded-md bg-white text-neutral-950 px-4 font-dm-sans font-semibold text-[14px] hover:bg-white/90 transition-colors disabled:opacity-60"
                    >
                      {busy ? "..." : "Promote"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {!filtered.length ? (
            <p className="px-4 py-8 text-[12px] text-white/60">No users</p>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}
