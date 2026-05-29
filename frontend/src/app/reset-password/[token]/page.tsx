"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  
  // params.token is the token from the URL (e.g., /reset-password/[token])
  const token = typeof params.token === "string" ? params.token : "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (!token) {
        setError("Invalid reset link. Token is missing.");
        return;
      }
      if (!password || password.length < 5) {
        setError("Password must be at least 5 characters long");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      const response = await apiFetch<{ message?: string }>(`/api/v1/users/reset-password/${token}`, {
        method: "POST",
        body: { password },
        redirectOn401: false,
      });

      const msg = response.message || "Password reset successfully. You can now log in.";
      setMessage(msg);
      toast.success(msg);
      
      // Clear inputs
      setPassword("");
      setConfirmPassword("");
      
      // Optionally redirect to login after a delay
      setTimeout(() => {
        router.push("/login");
      }, 3000);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to reset password. The link may be expired.";
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
            <p className="mt-2 font-dm-sans font-light text-sm text-white/70">Set your new password</p>
          </div>

          <div className="rounded-[20px] border border-white/20 bg-white/[0.03] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm backdrop-saturate-[1.8]">
            <form className="space-y-6" onSubmit={onSubmit}>
              <label className="block">
                <span className="block font-dm-sans font-semibold text-[15px] tracking-tight text-white/70">
                  New Password
                </span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                  className="mt-2 h-11 w-full rounded-md bg-white/4 px-3 font-dm-sans font-normal text-sm text-white outline-none ring-1 ring-white/10 focus:ring-white/30"
                  placeholder="••••••••"
                />
              </label>

              <label className="block">
                <span className="block font-dm-sans font-semibold text-[15px] tracking-tight text-white/70">
                  Confirm New Password
                </span>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  required
                  className="mt-2 h-11 w-full rounded-md bg-white/4 px-3 font-dm-sans font-normal text-sm text-white outline-none ring-1 ring-white/10 focus:ring-white/30"
                  placeholder="••••••••"
                />
              </label>


              {message ? (
                <div className="p-3 rounded bg-green-500/10 border border-green-500/20 text-green-400 font-dm-sans text-xs">
                  {message} <br /> Redirecting to login...
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || !!message}
                className="h-11 w-full rounded-md bg-white text-neutral-950 px-4 font-dm-sans font-semibold text-[15px] tracking-tight hover:bg-white/90 disabled:opacity-60 transition-colors"
              >
                {isSubmitting ? "Saving..." : "Set New Password"}
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
