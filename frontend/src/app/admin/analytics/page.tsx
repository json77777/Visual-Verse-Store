"use client";

import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { formatRupeesFromPaise } from "@/lib/money";
import type { ApiResponse } from "@/lib/types";

import { AdminShell } from "@/components/admin/AdminShell";

type AdminOrder = {
  _id: string;
  user?: { email?: string };
  totalAmount?: number;
  orderStatus?: string;
  createdAt?: string;
};

type OrdersPayload = {
  orders: AdminOrder[];
  pagination?: {
    totalOrders?: number;
  };
};

type AdminStatsPayload = {
  totalRevenue: number;
  totalPaidOrders: number;
  totalOrders: number;
};

function fmtMoney(amount?: number) {
  if (amount == null) return "—";
  return formatRupeesFromPaise(amount);
}

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [totalOrders, setTotalOrders] = useState<number | null>(null);
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setError(null);
      try {
        const [ordersRes, statsRes, productsRes] = await Promise.all([
          apiFetch<ApiResponse<OrdersPayload>>("/api/v1/users/admin/orders?limit=8", {
            cache: "no-store",
          }),
          apiFetch<ApiResponse<AdminStatsPayload>>("/api/v1/users/admin/stats", {
            cache: "no-store",
          }),
          apiFetch<ApiResponse<unknown[]>>("/api/v1/products/admin/all", {
            cache: "no-store",
          }),
        ]);

        if (!mounted) return;
        setOrders(ordersRes.data?.orders ?? []);
        setTotalOrders(ordersRes.data?.pagination?.totalOrders ?? null);
        setTotalRevenue(statsRes.data?.totalRevenue ?? null);
        setTotalProducts(Array.isArray(productsRes.data) ? productsRes.data.length : null);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load orders");
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(
    () => [
      {
        label: "Total Orders",
        value: totalOrders != null ? totalOrders.toLocaleString("en-US") : "—",
        tag: "Total",
      },
      {
        label: "Total Revenue",
        value: totalRevenue != null ? fmtMoney(totalRevenue) : "—",
        tag: "Total",
      },
      {
        label: "Total Products",
        value: totalProducts != null ? totalProducts.toLocaleString("en-US") : "—",
        tag: "Total",
      },
    ],
    [totalOrders, totalRevenue, totalProducts],
  );

  return (
    <AdminShell title="Performance Metrics">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-md border border-white/15 bg-neutral-900 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] tracking-[0.16em] text-white/45">{m.label}</p>
              <span className="rounded-sm bg-white/5 px-2 py-1 text-[10px] text-white/60">
                {m.tag}
              </span>
            </div>
            <p className="mt-3 text-[22px] tracking-[-0.02em]">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <p className="font-syne font-bold text-lg text-white">Recent Orders</p>
        <div className="mt-3 overflow-hidden overflow-x-auto rounded-md border border-white/15">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-[120px_1fr_120px_120px_90px] gap-0 bg-white/2 px-4 py-2 text-[10px] tracking-[0.16em] text-white/45">
            <span>ORDER ID</span>
            <span>EMAIL</span>
            <span>AMOUNT</span>
            <span>STATUS</span>
            <span className="text-right">CREATED</span>
          </div>

          {orders.length ? (
            <div className="divide-y divide-white/10">
              {orders.map((o) => (
                <div
                  key={o._id}
                  className="grid grid-cols-[120px_1fr_120px_120px_90px] items-center px-4 py-3 text-[12px]"
                >
                  <span className="truncate text-white/80">{o._id.slice(-8)}</span>
                  <span className="truncate text-white/70">{o.user?.email ?? "—"}</span>
                  <span className="text-white/70">{fmtMoney(o.totalAmount)}</span>
                  <span className="text-white/70">
                    <span 
                      className={`inline-flex min-w-[70px] justify-center items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide ${
                        o.orderStatus === "completed" 
                          ? "bg-green-500/10 text-green-400 border border-green-500/20 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                          : o.orderStatus === "cancelled"
                            ? "bg-red-500/10 text-red-500 border border-red-500/20 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                            : "bg-orange-500/10 text-orange-400 border border-orange-500/20 drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]"
                      }`}
                    >
                      {o.orderStatus ?? "—"}
                    </span>
                  </span>
                  <span className="text-right text-white/50">
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-10 text-[12px] text-white/60">
              {error ? error : "No orders yet"}
            </div>
          )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
