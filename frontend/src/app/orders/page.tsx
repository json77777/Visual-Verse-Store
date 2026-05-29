"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { formatRupeesFromPaise } from "@/lib/money";
import type { ApiResponse } from "@/lib/types";

type OrderItem = {
  product?: {
    _id: string;
    title?: string;
    price?: number;
  };
  quantity: number;
};

type Order = {
  _id: string;
  status?: string;
  totalAmount?: number;
  items?: OrderItem[];
  createdAt?: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setError(null);
      try {
        const res = await apiFetch<ApiResponse<Order[]>>(
          "/api/v1/users/orders/me",
          { cache: "no-store" },
        );
        if (mounted) setOrders(res.data ?? []);
      } catch (e) {
        if (mounted) {
          setOrders([]);
          setError(
            e instanceof Error ? e.message : "Please login to view your orders",
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
      <main className="mx-auto w-full max-w-[1440px] px-8 pt-14 pb-16">
        <div className="flex items-center justify-between">
          <h1 className="text-lg tracking-wide">Orders</h1>
          <Link href="/profile" className="text-sm text-white/70 hover:underline">
            Back
          </Link>
        </div>

        <div className="mt-6 h-px w-full bg-white/10" />

        {error ? <p className="mt-8 text-sm text-white/70">{error}</p> : null}

        {!error && !orders.length ? (
          <p className="mt-8 text-sm text-white/70">No orders yet.</p>
        ) : null}

        <section className="mt-10 space-y-4">
          {orders.map((o) => (
            <div
              key={o._id}
              className="rounded-md border border-white/10 p-6"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Order</p>
                <p className="text-xs text-white/70">{o.status ?? ""}</p>
              </div>

              <p className="mt-2 text-xs text-white/70">ID: {o._id}</p>
              {o.createdAt ? (
                <p className="mt-1 text-xs text-white/70">
                  {new Date(o.createdAt).toLocaleString()}
                </p>
              ) : null}

              <div className="mt-4 space-y-2">
                {(o.items ?? []).map((it, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-white/80">
                      {it.product?.title ?? "Item"} × {it.quantity}
                    </span>
                    <span className="text-white/80">
                      {typeof it.product?.price === "number"
                        ? formatRupeesFromPaise(it.product.price * it.quantity)
                        : ""}
                    </span>
                  </div>
                ))}
              </div>

              {typeof o.totalAmount === "number" ? (
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm text-white/70">Total</span>
                  <span className="text-sm font-medium">
                    {formatRupeesFromPaise(o.totalAmount)}
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
