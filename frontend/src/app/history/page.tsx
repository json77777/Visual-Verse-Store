"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

type Download = {
  _id?: string;
  title?: string;
  purchasedAt?: string;
  downloadUrl?: string;

  // Backward-compatible shape
  product?: { _id: string; title?: string };
  url?: string;
  createdAt?: string;
};

function resolveDownloadHref(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "#";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return trimmed;
  return `${base.replace(/\/$/, "")}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}

export default function HistoryPage() {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setError(null);
      try {
        const res = await apiFetch<ApiResponse<Download[]>>(
          "/api/v1/users/downloads/me",
          { cache: "no-store" },
        );
        if (mounted) setDownloads(res.data ?? []);
      } catch (e) {
        if (!mounted) return;
        setDownloads([]);
        setError(
          e instanceof Error
            ? e.message
            : "Please login to view your history",
        );
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex-1">
      <main className="mx-auto w-full max-w-[1440px] px-8 pt-14 pb-16">
        <h1 className="text-lg tracking-wide">History</h1>
        <div className="mt-6 h-px w-full bg-white/10" />

        {error ? <p className="mt-8 text-sm text-white/70">{error}</p> : null}

        {!error && !downloads.length ? (
          <p className="mt-8 text-sm text-white/70">No downloads yet.</p>
        ) : null}

        <section className="mt-10 space-y-4">
          {downloads.map((d, idx) => {
            const timestamp = d.purchasedAt ?? d.createdAt;

            return (
              <div
                key={d._id ?? idx}
                className="rounded-md border border-white/10 p-6"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {d.title ?? d.product?.title ?? "Download"}
                  </p>
                  {timestamp ? (
                    <p className="text-xs text-white/70">
                      {new Date(timestamp).toLocaleString()}
                    </p>
                  ) : null}
                </div>

                {d.downloadUrl || d.url ? (
                  <a
                    href={resolveDownloadHref(d.downloadUrl ?? d.url ?? "#")}
                    className="mt-4 inline-block rounded-md bg-white-neutral-950-white/90"
                  >
                    Download
                  </a>
                ) : (
                  <p className="mt-4 text-sm text-white/70">No link available.</p>
                )}
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
