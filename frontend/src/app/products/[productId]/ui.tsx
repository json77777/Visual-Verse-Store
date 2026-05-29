"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { addToCart } from "@/lib/cart";
import { toast } from "sonner";

export function AddToCartButton({ productId }: { productId: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-md bg-white-neutral-950-white/90"
      onClick={() => {
        addToCart(productId, 1);
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
        className="invert"
      />
      Add
    </button>
  );
}
