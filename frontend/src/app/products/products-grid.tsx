"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { addToCart } from "@/lib/cart";
import { formatRupeesFromPaise } from "@/lib/money";
import type { Product } from "@/lib/types";

function ProductCard({ product }: { product: Product }) {
  const router = useRouter();

  const images = useMemo(() => {
    return (product.images ?? []).filter(Boolean);
  }, [product.images]);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0] ?? null;

  const canNavigate = images.length > 1;

  function go(delta: number) {
    if (!canNavigate) return;
    setActiveIndex((i) => {
      const next = (i + delta) % images.length;
      return next < 0 ? next + images.length : next;
    });
  }

  return (
    <article className="group vv-card-hover w-full flex flex-col items-center sm:items-start text-center sm:text-left">
      <div className="relative overflow-hidden rounded-xl w-full max-w-[280px] sm:max-w-none">
        <Link href={`/products/${product._id}`} className="block w-full">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-white/5">
            {activeImage ? (
              <Image
                src={activeImage}
                alt={product.title}
                fill
                sizes="(max-width: 640px) 280px, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            ) : null}
          </div>
        </Link>

        {canNavigate ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-neutral-900/80 text-lg leading-none text-white/70 backdrop-blur-md opacity-0 transition-all duration-300 hover:scale-110 hover:bg-neutral-800 hover:text-white group-hover:opacity-100"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                go(-1);
              }}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next image"
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-neutral-900/80 text-lg leading-none text-white/70 backdrop-blur-md opacity-0 transition-all duration-300 hover:scale-110 hover:bg-neutral-800 hover:text-white group-hover:opacity-100"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                go(1);
              }}
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      <h3 className="mt-4 line-clamp-2 font-syne font-bold text-[15px] tracking-[-0.02em] text-white/90 transition-colors group-hover:text-white">{product.title}</h3>

      <div className="mt-3 flex w-full items-center justify-center sm:justify-between gap-4">
        <span className="font-dm-sans font-semibold text-base tracking-[0.01em] text-white/90">{formatRupeesFromPaise(product.price)}</span>
        <button
          type="button"
          className="vv-soft-press grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105"
          aria-label="Add to cart"
          onClick={() => {
            addToCart(product._id, 1);
            toast.success("Added to cart!");
            setTimeout(() => {
              router.push("/cart");
            }, 800);
          }}
        >
          <Image
            src="/icons/shopping-cart (2).png"
            alt=""
            width={18}
            height={18}
            className="invert opacity-80"
          />
        </button>
      </div>
    </article>
  );
}

export function ProductsGrid({ products }: { products: Product[] }) {
  return (
    <div className="mt-12 w-full grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
