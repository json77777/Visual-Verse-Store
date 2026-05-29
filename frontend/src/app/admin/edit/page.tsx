"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import type { ApiResponse, Product } from "@/lib/types";
import { formatRupeesFromPaise } from "@/lib/money";

import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminEditProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setError(null);
      try {
        const res = await apiFetch<ApiResponse<Product[]>>("/api/v1/products/admin/all", {
          cache: "no-store",
        });
        if (!mounted) return;
        setProducts(res.data ?? []);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load products");
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AdminShell title="Edit Product">
      <div className="space-y-3">
        {products.map((p) => (
          <div
            key={p._id}
            className="flex items-center justify-between gap-4 rounded-md border border-white/15 bg-neutral-900 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-white/5 ring-1 ring-white/10">
                {p.images?.[0] ? (
                  <Image src={p.images[0]} alt="" fill sizes="40px" className="object-cover" />
                ) : null}
              </div>

              <div>
                <p className="text-[12px] text-white">{p.title}</p>
                <p className="text-[10px] tracking-[0.12em] text-white/45">
                  {p._id.slice(-10)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <p className="text-[12px] text-white/70">{formatRupeesFromPaise(p.price)}</p>
              <span className={`text-[10px] tracking-[0.12em] ${p.isActive ? "text-green-500 font-medium" : "text-red-500 font-medium drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]"}`}>
                {p.isActive ? "ACTIVE" : "INACTIVE"}
              </span>
              <Link
                href={`/admin/edit/${p._id}`}
                aria-label="Edit"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/20 bg-neutral-900 hover:bg-neutral-800 transition-colors shadow-sm"
              >
                <Image
                  src="/assets/icons/edit.png"
                  alt=""
                  width={14}
                  height={14}
                  className="opacity-70 invert"
                />
              </Link>
            </div>
          </div>
        ))}

        {!products.length && !error ? (
          <p className="text-[12px] text-white/60">No products found</p>
        ) : error ? (
           <p className="text-[12px] text-red-400">{error}</p>
        ) : null}
      </div>
    </AdminShell>
  );
}
