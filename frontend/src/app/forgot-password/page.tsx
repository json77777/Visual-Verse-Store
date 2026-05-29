"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (!email.trim()) {
        setError("Email is required");
        return;
      }

      const response = await apiFetch<{ message?: string }>("/api/v1/users/forgot-password", {
        method: "POST",
        body: { email: email.trim() },
        redirectOn401: false,
      });

      const msg = response.message || "If an account exists with that email, a reset link has been sent. Please check your spam folder as well.";
      setMessage(msg);
      toast.success(msg);
      setEmail("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to request password reset";
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
            <p className="mt-2 font-dm-sans font-light text-sm text-white/70">Reset your password</p>
          </div>

          <div className="rounded-[20px] border border-white/20 bg-white/[0.03] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm backdrop-saturate-[1.8]">
            <form className="space-y-6" onSubmit={onSubmit}>
              <label className="block">
                <span className="block font-dm-sans font-semibold text-[15px] tracking-tight text-white/70">
                  Email Address
                </span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  className="mt-2 h-11 w-full rounded-md bg-white/4 px-3 font-dm-sans font-normal text-sm text-white outline-none ring-1 ring-white/10 focus:ring-white/30"
                  placeholder="you@example.com"
                />
              </label>


              {message ? (
                <div className="p-3 rounded bg-green-500/10 border border-green-500/20 text-green-400 font-dm-sans text-xs">
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-md bg-white text-neutral-950 px-4 font-dm-sans font-semibold text-[15px] tracking-tight hover:bg-white/90 disabled:opacity-60 transition-colors"
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="font-dm-sans font-normal text-xs text-white/70 hover:text-white transition-colors"
                >
                  Back to login
                </Link>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
