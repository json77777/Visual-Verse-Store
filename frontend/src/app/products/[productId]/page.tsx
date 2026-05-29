import Image from "next/image";
import { apiFetch } from "@/lib/api";
import { formatRupeesFromPaise } from "@/lib/money";
import type { ApiResponse, Product } from "@/lib/types";

import { AddToCartButton } from "./ui";

async function getProduct(productId: string): Promise<Product> {
  const response = await apiFetch<ApiResponse<Product>>(
    `/api/v1/products/${productId}`,
    { cache: "no-store" },
  );
  return response.data;
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await getProduct(productId);

  return (
    <div className="flex-1">
      <main className="mx-auto w-full max-w-[1024px] pt-14 pb-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-white/5">
            {product.images?.[0] ? (
              <Image
                src={product.images[0]}
                alt={product.title}
                fill
                sizes="(min-width: 1024px) 600px, 100vw"
                className="object-cover"
                priority
              />
            ) : null}
          </div>

          <div className="max-w-xl">
            <h1 className="font-syne font-extrabold text-3xl tracking-[-0.03em] text-white">{product.title}</h1>
            <p className="mt-3 font-dm-sans font-normal text-sm leading-relaxed text-white/70">{product.description}</p>

            <div className="mt-6 flex items-center justify-between">
              <span className="font-dm-sans font-semibold text-lg tracking-[0.01em] text-white">
                {formatRupeesFromPaise(product.price)}
              </span>
              <AddToCartButton productId={product._id} />
            </div>

            <div className="mt-10 h-px w-full bg-white/10" />
          </div>
        </div>
      </main>
    </div>
  );
}
