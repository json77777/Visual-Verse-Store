"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/lib/types";
import { emitUserUpdated } from "@/lib/userEvents";

type LoginResponse = {
  user: unknown;
  accessToken: string;
  refreshToken: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const trimmed = identifier.trim();
      if (!trimmed || !password) {
        setError("Email/Username and password are required");
        return;
      }

      const isEmail = trimmed.includes("@");
      const body = isEmail
        ? { email: trimmed, password }
        : { username: trimmed, password };

      await apiFetch<ApiResponse<LoginResponse>>("/api/v1/users/login", {
        method: "POST",
        body,
      });

      emitUserUpdated();
      toast.success("Successfully logged in!");
      
      // Delay navigation slightly so the toast can be seen before page transition
      setTimeout(() => {
        router.push("/products");
      }, 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1 relative min-h-[calc(100vh-100px)]">
      <div className="absolute -top-28 left-0 right-0 bottom-0 z-[-1] pointer-events-none overflow-hidden">
        <Image
          src="/mainpics/Superman_Site_v2_1.jpg"
          alt="Background"
          fill
          className="object-cover object-center opacity-70"
          priority
        />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#080808] to-transparent" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-8 pt-20 pb-32">
        <section className="mx-auto w-full max-w-[420px]">
          <div className="text-center mb-8">
            <h1 className="font-syne font-extrabold text-3xl tracking-[-0.04em] text-white">
              Visual Verse
            </h1>
            <p className="mt-2 font-dm-sans font-light text-sm text-white/70">Login to continue</p>
          </div>

          <div className="rounded-[20px] border border-white/20 bg-white/[0.03] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm backdrop-saturate-[1.8]">
            <form className="space-y-6" onSubmit={onSubmit}>
              <label className="block">
                <span className="block font-dm-sans font-semibold text-[15px] tracking-tight text-white/70">
                  Email / Username
                </span>
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="mt-2 h-11 w-full rounded-md bg-white/4 px-3 font-dm-sans font-normal text-sm text-white outline-none ring-1 ring-white/10 focus:ring-white/30"
                  placeholder="you@example.com"
                  autoComplete="username"
                />
              </label>

              <label className="block">
                <span className="block font-dm-sans font-semibold text-[15px] tracking-tight text-white/70">
                  Password
                </span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="mt-2 h-11 w-full rounded-md bg-white/4 px-3 font-dm-sans font-normal text-sm text-white outline-none ring-1 ring-white/10 focus:ring-white/30"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </label>


              <button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-md bg-white text-neutral-950 px-4 font-dm-sans font-semibold text-[15px] tracking-tight hover:bg-white/90 disabled:opacity-60 transition-colors"
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </button>

              <div className="flex flex-col space-y-4 items-center pt-2">
                <Link
                  href="/forgot-password"
                  className="font-dm-sans font-normal text-xs text-white/70 hover:text-white transition-colors"
                >
                  Forgot your password?
                </Link>

                <Link
                  href="/register"
                  className="font-dm-sans font-normal text-xs text-white/70 hover:text-white transition-colors"
                >
                  Create an account
                </Link>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
