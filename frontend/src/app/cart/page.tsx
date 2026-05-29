"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { apiFetch } from "@/lib/api";
import {
  getCartServerSnapshot,
  getCartSnapshot,
  subscribeToCart,
  updateCartItemQuantity,
  removeFromCart,
} from "@/lib/cart";
import { formatRupeesFromPaise } from "@/lib/money";
import type { ApiResponse, Product } from "@/lib/types";

type CartProduct = Product & { quantity: number };

export default function CartPage() {
  const items = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    getCartServerSnapshot,
  );
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setError(null);
      if (!items.length) {
        setProducts([]);
        return;
      }

      try {
        const results = await Promise.all(
          items.map(async (it) => {
            const res = await apiFetch<ApiResponse<Product>>(
              `/api/v1/products/${it.productId}`,
              { cache: "no-store" },
            );
            return { ...res.data, quantity: it.quantity };
          }),
        );

        if (isMounted) setProducts(results);
      } catch (e) {
        if (isMounted) {
          setError(e instanceof Error ? e.message : "Failed to load cart");
        }
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, [items]);

  const totalPaise = useMemo(() => {
    return products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  }, [products]);

  return (
    <div className="flex-1">
      <main className="mx-auto w-full max-w-5xl px-8 pt-14 pb-16">
        <h1 className="font-syne font-extrabold text-2xl tracking-[-0.03em] text-white">Cart</h1>
        <div className="mt-6 h-px w-full bg-white/10" />

        {error ? (
          <p className="mt-6 text-sm text-white/70">{error}</p>
        ) : null}

        {!products.length ? (
          <div className="mt-12 rounded-md border border-white/10 bg-white/2 p-10">
            <p className="font-dm-sans font-normal text-sm text-white/70">Your cart is empty.</p>
            <Link
              href="/products"
              className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-white px-5 font-dm-sans font-medium text-[12px] tracking-[0.1em] text-neutral-950 hover:bg-white/90 transition-colors"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
            <section className="space-y-4">
              {products.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center gap-4 rounded-md border border-white/10 p-4"
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-md bg-white/5">
                    {p.images?.[0] ? (
                      <Image
                        src={p.images[0]}
                        alt={p.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-syne font-bold text-[15px] tracking-[-0.01em] text-white/90">{p.title}</p>
                    <p className="mt-1 font-dm-sans font-light text-xs text-white/70">
                      Qty: {p.quantity}
                    </p>
                  </div>

                  <div className="font-dm-sans font-semibold text-sm tracking-[0.01em]">
                    {formatRupeesFromPaise(p.price * p.quantity)}
                  </div>

                  <button
                    type="button"
                    className="grid h-10 w-10 place-items-center rounded-md hover:bg-white/5"
                    aria-label="Remove item"
                    onClick={() => {
                      removeFromCart(p._id);
                    }}
                  >
                    <Image
                      src="/icons/bin (1).png"
                      alt="Remove"
                      width={20}
                      height={20}
                      className="filter invert brightness-150"
                    />
                  </button>
                </div>
              ))}
            </section>

            <aside className="h-fit rounded-md border border-white/10 p-6">
              <div className="flex items-center justify-between">
                <span className="font-dm-sans font-normal text-sm text-white/70">Total</span>
                <span className="font-dm-sans font-semibold text-sm">
                  {formatRupeesFromPaise(totalPaise)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="mt-6 grid h-11 w-full place-items-center rounded-md bg-white px-4 font-medium text-[12px] tracking-[0.1em] text-neutral-950 hover:bg-white/90 transition-colors"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                Checkout
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
