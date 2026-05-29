"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiFetchError, apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

type CurrentUser = {
  _id: string;
};

export default function ChangePasswordPage() {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setError(null);
      try {
        const res = await apiFetch<ApiResponse<CurrentUser>>(
          "/api/v1/users/current-user",
          { cache: "no-store" },
        );
        if (mounted) setUser(res.data);
      } catch (e) {
        if (!mounted) return;
        setUser(null);
        if (e instanceof ApiFetchError && e.status === 401) {
          setError("Please login to change password");
          return;
        }
        setError(e instanceof Error ? e.message : "Please login to change password");
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const oldTrim = oldPassword.trim();
    const nextTrim = newPassword.trim();

    if (!oldTrim || !nextTrim || !confirmNewPassword.trim()) {
      setError("All fields are required");
      return;
    }

    if (nextTrim !== confirmNewPassword.trim()) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch<ApiResponse<string | unknown>>("/api/v1/users/change-password", {
        method: "PATCH",
        body: { oldPassword: oldTrim, newPassword: nextTrim },
      });

      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSuccess("Password updated");
      toast.success("Password updated successfully!");
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 401) {
        setError("Session expired. Please login again.");
        toast.error("Session expired. Please login again.");
        router.push("/login");
        return;
      }
      const msg = err instanceof Error ? err.message : "Failed to update password";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1">
      <main className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 pt-14 pb-16">
        {error && !user ? (
          <div className="mt-12 rounded-md border border-white/10 bg-white/[0.02] p-6 sm:p-10">
            <p className="text-sm text-white/70">{error}</p>
            <button
              type="button"
              className="mt-4 inline-block rounded-md bg-white-neutral-950-white/90"
              onClick={() => router.push("/login")}
            >
              Login
            </button>
          </div>
        ) : null}

        {user ? (
          <section className="mt-8 sm:mt-16">
            <div className="mx-auto w-full max-w-[420px] px-4 sm:px-0">
              <h1 className="text-lg font-semibold">Change Password</h1>
              <p className="mt-1 text-xs text-white/50">
                Update your system access keys
              </p>

              <form className="mt-10 space-y-6" onSubmit={onSubmit}>
                <label className="block">
                  <span className="block text-[10px] uppercase tracking-wide text-white/40">
                    Old Password
                  </span>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="mt-2 h-10 w-full bg-white/[0.04] px-3 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30"
                  />
                </label>

                <label className="block">
                  <span className="block text-[10px] uppercase tracking-wide text-white/40">
                    New Password
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-2 h-10 w-full bg-white/[0.04] px-3 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30"
                  />
                </label>

                <label className="block">
                  <span className="block text-[10px] uppercase tracking-wide text-white/40">
                    Confirm New Password
                  </span>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="mt-2 h-10 w-full bg-white/[0.04] px-3 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30"
                  />
                </label>

                {error ? <p className="text-xs text-white/70">{error}</p> : null}
                {success ? (
                  <p className="text-xs text-white/70">{success}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-8 h-11 w-full bg-neutral-900 text-center text-[11px] text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
