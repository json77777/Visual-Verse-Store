"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

type Download = {
  _id?: string;
  // New backend shape
  title?: string;
  purchasedAt?: string;
  downloadUrl?: string;
  images?: string[];
  description?: string;

  // Backward-compatible shape (older frontend expectation)
  product?: { _id: string; title?: string; images?: string[]; description?: string };
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

export default function DownloadsPage() {
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
        if (mounted) {
          setDownloads([]);
          setError(
            e instanceof Error
              ? e.message
              : "Please login to view your downloads",
          );
        }
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex-1">
      <main className="mx-auto w-full max-w-[1024px] pt-14 pb-16">
        <div className="flex items-center justify-between">
          <h1 className="font-syne font-extrabold text-2xl tracking-[-0.03em] text-white">Downloads</h1>
          <Link href="/profile" className="text-sm text-white/70 hover:underline">
            Back
          </Link>
        </div>

        <div className="mt-6 h-px w-full bg-white/10" />

        {error ? <p className="mt-8 text-sm text-white/70">{error}</p> : null}

        {!error && !downloads.length ? (
          <p className="mt-8 text-sm text-white/70">No downloads yet.</p>
        ) : null}

        <section className="mt-10 space-y-4">
          {downloads.map((d, idx) => {
            const timestamp = d.purchasedAt ?? d.createdAt;

            const title = d.title ?? d.product?.title ?? "Download";
            const imageSrc = (d as any).images?.[0] || d.product?.images?.[0] || "/assets/mainpics/default-pack.png";
            const href = resolveDownloadHref(d.downloadUrl ?? d.url ?? "#");

            return (
              <article
                key={d._id ?? idx}
                className="grid grid-cols-[80px_1fr_160px] items-center gap-4 rounded-2xl border border-white/8 bg-gradient-to-br from-neutral-900/60 to-neutral-900/40 p-4 shadow-lg hover:shadow-2xl transition-shadow duration-250"
              >
                <div className="relative rounded-lg overflow-hidden w-20 h-20 bg-white/5">
                  <Image
                    src={imageSrc}
                    alt={title}
                    fill
                    className="object-cover w-full h-full"
                  />
                </div>

                <div>
                  <h3 className="font-syne font-bold text-sm tracking-[-0.01em] text-white">{title}</h3>
                  <p className="mt-2 font-dm-sans font-normal text-sm text-white/70">Thank you for your purchase — your files are ready to download.</p>
                </div>

                <div className="flex flex-col items-end justify-center">
                  {timestamp ? (
                    <time className="font-dm-sans font-light text-xs text-white/60">{new Date(timestamp).toLocaleString()}</time>
                  ) : null}

                  <div className="mt-3">
                    {d.downloadUrl || d.url ? (
                      <a
                        href={href}
                        className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 font-dm-sans font-medium text-sm tracking-[0.1em] text-neutral-900 shadow-md hover:scale-[1.01] transition-transform"
                      >
                        Download
                      </a>
                    ) : (
                      <span className="inline-block rounded-lg bg-white/5 px-3 py-1 font-dm-sans font-light text-sm text-white/60">No download available</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}