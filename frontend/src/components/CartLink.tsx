"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

import { getCartServerSnapshot, getCartSnapshot, subscribeToCart } from "@/lib/cart";

export function CartLink() {
  const items = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    getCartServerSnapshot,
  );

  const quantity = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [items]);

  const badgeText = quantity > 99 ? "99+" : String(quantity);

  return (
    <Link
      href="/cart"
      aria-label={quantity > 0 ? `Cart (${quantity} items)` : "Cart"}
      className="vv-soft-press relative grid h-10 w-10 place-items-center rounded-md hover:bg-white/10 transition-colors"
    >
      <Image src="/icons/shopping-cart (2).png" alt="" width={24} height={24} className="invert opacity-90 transition-transform duration-300 hover:scale-110" />
      {quantity > 0 ? (
        <span
          className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 font-dm-sans font-medium text-[10px] leading-none text-white"
          aria-hidden="true"
        >
          {badgeText}
        </span>
      ) : null}
    </Link>
  );
}
