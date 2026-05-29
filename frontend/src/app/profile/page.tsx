"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/lib/types";
import { emitUserUpdated } from "@/lib/userEvents";

type CurrentUser = {
  _id: string;
  fullName?: string;
  username?: string;
  email?: string;
  avatar?: string;
  role?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setError(null);
      try {
        const res = await apiFetch<ApiResponse<CurrentUser>>(
          "/api/v1/users/current-user",
          { cache: "no-store" },
        );
        if (mounted) {
          setUser(res.data);
        }
      } catch (e) {
        if (mounted) {
          setUser(null);
          setError(
            e instanceof Error
              ? e.message
              : "Please login to view your profile",
          );
        }
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  async function logout() {
    setIsLoggingOut(true);
    setError(null);

    try {
      await apiFetch<ApiResponse<Record<string, never>>>("/api/v1/users/logout", {
        method: "POST",
      });
      setUser(null);
      emitUserUpdated();
      toast.success("Successfully logged out!");
      router.push("/");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Logout failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex-1">
      <main className="mx-auto w-full max-w-[1440px] px-8 pt-14 pb-16">
        {error && !user ? (
          <div className="mt-12 rounded-md border border-white/10 bg-white/[0.02] p-10">
            <p className="text-sm text-white/70">{error}</p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-md bg-white-neutral-950-white/90"
            >
              Login
            </Link>
          </div>
        ) : null}

        {user ? (
          <section className="mt-10 md:mt-20">
            <div className="mx-auto flex w-full max-w-[980px] flex-col md:flex-row items-center md:items-start justify-center gap-10 md:gap-16">
              <div className="relative shrink-0">
                <div className="relative h-32 w-32 md:h-44 md:w-44 overflow-hidden rounded-full bg-white/5">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt="Avatar"
                      fill
                      sizes="(min-width: 768px) 176px, 128px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 h-3 w-3 md:h-4 md:w-4 rounded-full bg-lime-500 ring-4 ring-[#080808]" />
              </div>

              <div className="flex-1 text-center md:text-left w-full">
                <h1 className="font-syne font-extrabold text-4xl sm:text-5xl md:text-6xl tracking-[-0.04em] text-white break-words">
                  {user.fullName ?? user.username ?? "User"}
                </h1>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10">
                  <div className="bg-white/5 md:bg-transparent rounded-xl md:rounded-none p-4 md:p-0">
                    <p className="font-dm-sans font-medium text-[10px] uppercase tracking-[0.18em] text-white/40">
                      Username
                    </p>
                    <p className="mt-1 font-dm-sans font-normal text-sm text-white/70">
                      {user.username ?? ""}
                    </p>
                  </div>
                  <div className="bg-white/5 md:bg-transparent rounded-xl md:rounded-none p-4 md:p-0 overflow-hidden">
                    <p className="font-dm-sans font-medium text-[10px] uppercase tracking-[0.18em] text-white/40">
                      Email Address
                    </p>
                    <p className="mt-1 font-dm-sans font-normal text-sm text-white/70 truncate">
                      {user.email ?? ""}
                    </p>
                  </div>
                </div>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 md:gap-6">
                  <Link
                    href="/profile/edit"
                    className="grid h-12 sm:h-10 w-full sm:w-36 place-items-center bg-neutral-900 rounded-lg sm:rounded-none font-dm-sans font-medium text-[11px] tracking-[0.1em] text-white"
                  >
                    Edit Profile
                  </Link>
                  <Link
                    href="/profile/password"
                    className="grid h-12 sm:h-10 w-full sm:w-36 place-items-center bg-white/10 rounded-lg sm:rounded-none font-dm-sans font-medium text-[11px] tracking-[0.1em] text-white/70"
                  >
                    Change Password
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    disabled={isLoggingOut}
                    className="grid h-12 sm:h-10 w-full sm:w-36 place-items-center bg-red-600 rounded-lg sm:rounded-none font-dm-sans font-medium text-[11px] tracking-[0.1em] text-white disabled:opacity-60"
                  >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>

                {error ? (
                  <p className="mt-6 text-xs text-white/70">{error}</p>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
