"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiFetchError, apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/lib/types";
import { emitUserUpdated } from "@/lib/userEvents";

type CurrentUser = {
  _id: string;
  fullName?: string;
  username?: string;
  email?: string;
  avatar?: string;
};

export default function ProfileEditPage() {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const avatarPreviewUrl = useMemo(() => {
    if (!avatarFile) return null;
    return URL.createObjectURL(avatarFile);
  }, [avatarFile]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setError(null);
      try {
        const res = await apiFetch<ApiResponse<CurrentUser>>(
          "/api/v1/users/current-user",
          { cache: "no-store" },
        );
        if (!mounted) return;
        setUser(res.data);
        setFullName(res.data.fullName ?? "");
        setUsername(res.data.username ?? "");
        setEmail(res.data.email ?? "");
      } catch (e) {
        if (!mounted) return;
        if (e instanceof ApiFetchError && e.status === 401) {
          setError("Session expired. Please login.");
          return;
        }
        setError(e instanceof Error ? e.message : "Please login");
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  async function save() {
    if (!user) return;
    setError(null);
    setIsSaving(true);

    try {
      const fd = new FormData();
      if (fullName.trim() && fullName.trim() !== (user.fullName ?? "")) {
        fd.append("fullName", fullName.trim());
      }
      if (username.trim() && username.trim() !== (user.username ?? "")) {
        fd.append("username", username.trim());
      }
      if (email.trim() && email.trim() !== (user.email ?? "")) {
        fd.append("email", email.trim());
      }
      if (avatarFile) {
        fd.append("avatar", avatarFile);
      }

      const res = await apiFetch<ApiResponse<CurrentUser>>(
        "/api/v1/users/update-user-details",
        {
          method: "PATCH",
          body: fd,
        },
      );

      setUser(res.data);
      emitUserUpdated();
      toast.success("Profile updated successfully!");
      router.push("/profile");
    } catch (e) {
      if (e instanceof ApiFetchError && e.status === 401) {
        setError("Session expired. Please login.");
        toast.error("Session expired. Please login.");
        router.push("/login");
        return;
      }
      const msg = e instanceof Error ? e.message : "Failed to update profile";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex-1">
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-8 pt-14 pb-16">
        <div className="relative z-50">
          <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm" />

          <div className="relative mx-auto mt-4 sm:mt-10 w-full max-w-130 rounded-2xl border border-white/10 bg-neutral-900/70 p-5 sm:p-8 shadow-[0_18px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <h1 className="text-2xl font-semibold">Profile</h1>
              <button
                type="button"
                aria-label="Close"
                className="text-lg text-white/40 hover:text-white/70"
                onClick={() => router.back()}
              >
                ×
              </button>
            </div>

            {error ? <p className="mt-4 text-sm text-white/70">{error}</p> : null}

            {user ? (
              <div className="mt-8">
                <div className="flex justify-center">
                  <label className="relative cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                    />
                    <div className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-white/10">
                      {avatarPreviewUrl || user.avatar ? (
                        <Image
                          src={avatarPreviewUrl ?? user.avatar ?? ""}
                          alt="Avatar"
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <Image
                          src="/icons/edit.png"
                          alt=""
                          width={16}
                          height={16}
                          className="invert opacity-60"
                        />
                      )}
                    </div>
                  </label>
                </div>

                <div className="mt-8 grid gap-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-white/40">
                      Username
                    </p>
                    <div className="relative mt-2">
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="h-10 w-full rounded-md bg-white/4 px-3 pr-10 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30"
                      />
                      <Image
                        src="/icons/edit.png"
                        alt=""
                        width={14}
                        height={14}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 invert opacity-60"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-white/40">
                      Full Name
                    </p>
                    <div className="relative mt-2">
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-10 w-full rounded-md bg-white/4 px-3 pr-10 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30"
                      />
                      <Image
                        src="/icons/edit.png"
                        alt=""
                        width={14}
                        height={14}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 invert opacity-60"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-white/40">
                      Email
                    </p>
                    <div className="relative mt-2">
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-10 w-full rounded-md bg-white/4 px-3 pr-10 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30"
                      />
                      <Image
                        src="/icons/edit.png"
                        alt=""
                        width={14}
                        height={14}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 invert opacity-60"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={save}
                  className="mt-8 h-11 w-full rounded-md bg-white px-4 text-center text-[12px] font-medium tracking-[0.14em] text-neutral-950 hover:bg-white/90 disabled:opacity-60 transition-colors"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
