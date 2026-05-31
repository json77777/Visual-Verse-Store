"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type RegisterForm = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  avatarFile: File | null;
};

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<RegisterForm>({
    fullName: "",
    username: "",
    email: "",
    password: "",
    avatarFile: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const avatarPreviewUrl = useMemo(() => {
    if (!form.avatarFile) return null;
    return URL.createObjectURL(form.avatarFile);
  }, [form.avatarFile]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (
        !form.fullName.trim() ||
        !form.username.trim() ||
        !form.email.trim() ||
        !form.password ||
        !form.avatarFile
      ) {
        setError("All fields + avatar are required");
        return;
      }

      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!base) {
        throw new Error(
          "Missing NEXT_PUBLIC_API_BASE_URL. Set it in frontend/.env.local",
        );
      }

      const fd = new FormData();
      fd.set("fullName", form.fullName);
      fd.set("username", form.username);
      fd.set("email", form.email);
      fd.set("password", form.password);
      fd.set("avatar", form.avatarFile);

      const res = await fetch(`${base.replace(/\/$/, "")}/api/v1/users/register`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Register failed: ${res.status} ${res.statusText}: ${text}`);
      }

      toast.success("Account created successfully!");
      
      setTimeout(() => {
        router.push("/login");
      }, 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Register failed";
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
          src="/mainpics/signup-page-1.png"
          alt="Background"
          fill
          className="object-cover object-center opacity-70"
          priority
        />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#080808] to-transparent" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-8 pt-8 pb-16">
        <section className="mx-auto w-full max-w-[420px]">
          <div className="text-center mb-8">
            <h1 className="font-syne font-extrabold text-3xl tracking-[-0.04em] text-white">
              Visual Verse
            </h1>
            <p className="mt-2 font-dm-sans font-light text-sm text-white/70">Create your account</p>
          </div>

          <div className="rounded-[20px] border border-white/20 bg-white/[0.03] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm backdrop-saturate-[1.8]">
            <form className="space-y-6" onSubmit={onSubmit}>
              <label className="block">
                <span className="block font-dm-sans font-semibold text-[15px] tracking-tight text-white/70">
                  Full Name
                </span>
                <input
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fullName: e.target.value }))
                  }
                  className="mt-2 h-11 w-full rounded-md bg-white/4 px-3 font-dm-sans font-normal text-sm text-white outline-none ring-1 ring-white/10 focus:ring-white/30"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </label>

              <label className="block">
                <span className="block font-dm-sans font-semibold text-[15px] tracking-tight text-white/70">
                  Username
                </span>
                <input
                  value={form.username}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, username: e.target.value }))
                  }
                  className="mt-2 h-11 w-full rounded-md bg-white/4 px-3 font-dm-sans font-normal text-sm text-white outline-none ring-1 ring-white/10 focus:ring-white/30"
                  placeholder="username"
                  autoComplete="username"
                />
              </label>

              <label className="block">
                <span className="block font-dm-sans font-semibold text-[15px] tracking-tight text-white/70">
                  Email
                </span>
                <input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  type="email"
                  className="mt-2 h-11 w-full rounded-md bg-white/4 px-3 font-dm-sans font-normal text-sm text-white outline-none ring-1 ring-white/10 focus:ring-white/30"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>

              <label className="block">
                <span className="block font-dm-sans font-semibold text-[15px] tracking-tight text-white/70">
                  Password
                </span>
                <div className="relative mt-2">
                  <input
                    value={form.password}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, password: e.target.value }))
                    }
                    type={showPassword ? "text" : "password"}
                    className="h-11 w-full rounded-md bg-white/4 px-3 pr-16 font-dm-sans font-normal text-sm text-white outline-none ring-1 ring-white/10 focus:ring-white/30"
                    placeholder="Create a password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 transition-opacity opacity-70 hover:opacity-100"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <Image src="/icons/visible.png" alt="Hide password" width={18} height={18} className="invert" />
                    ) : (
                      <Image src="/icons/hide.png" alt="Show password" width={18} height={18} className="invert" />
                    )}
                  </button>
                </div>
              </label>

              <div>
                <p className="font-dm-sans font-semibold text-[15px] tracking-tight text-white/70">
                  Avatar (required)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      avatarFile: e.target.files?.[0] ?? null,
                    }))
                  }
                  className="mt-2 block w-full font-dm-sans text-xs text-white/70 file:mr-4 file:rounded-md file:border file:border-white/15 file:bg-neutral-900 file:px-3 file:py-2 file:text-xs file:text-white hover:file:bg-white/10"
                />

                {avatarPreviewUrl ? (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
                      <Image
                        src={avatarPreviewUrl}
                        alt="Selected avatar preview"
                        fill
                        sizes="48px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <p className="font-dm-sans font-light text-xs text-white/50">Avatar preview</p>
                  </div>
                ) : null}
              </div>


              <button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-md bg-white text-neutral-950 px-4 font-dm-sans font-semibold text-[15px] tracking-tight hover:bg-white/90 disabled:opacity-60 transition-colors"
              >
                {isSubmitting ? "Creating..." : "Create account"}
              </button>

              <Link
                href="/login"
                className="block text-center font-dm-sans font-normal text-xs text-white/70 hover:text-white"
              >
                Already have an account?
              </Link>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
