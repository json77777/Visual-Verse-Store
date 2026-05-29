import { apiFetch } from "@/lib/api";
import type { ApiResponse, Product } from "@/lib/types";
import {
  getOrderedCategoryKeys,
  getSectionTitleForCategory,
  groupProductsByCategory,
  normalizeCategory,
} from "@/lib/productGroups";

import { ProductsGrid } from "./products-grid";

async function getProducts(): Promise<Product[]> {
  const response = await apiFetch<ApiResponse<Product[]>>("/api/v1/products", {
    cache: "no-store",
  });
  return response.data;
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function pickFirst(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function ProductsPage({
  searchParams,
}: {
  // Next.js 16+ may pass searchParams as a Promise (sync dynamic APIs)
  searchParams?: RawSearchParams | Promise<RawSearchParams>;
}) {
  const products = await getProducts();
  const byGroup = groupProductsByCategory(products);
  const keys = getOrderedCategoryKeys(products);

  // If a category filter is present, show only that category.
  // (searchParams is available in Next.js app router server components)
  const resolved = (await Promise.resolve(searchParams)) ?? {};
  const categoryParam = pickFirst(resolved.category);
  const filteredKey = categoryParam ? normalizeCategory(categoryParam) : null;
  const keysToRender = filteredKey ? [filteredKey] : keys;

  return (
    <div className="flex-1">
      <main className="mx-auto w-full max-w-[1024px] px-6 pt-24 pb-16 md:px-8 md:pt-32">
        {keysToRender.every(key => (byGroup.get(key) ?? []).length === 0) ? (
          <div className="py-20 text-center">
            <p className="font-dm-sans text-sm text-white/70">No products available at the moment.</p>
          </div>
        ) : (
          keysToRender.map((key) => {
            const groupProducts = byGroup.get(key) ?? [];
            if (groupProducts.length === 0) return null;

            return (
              <section key={key} className="pb-16 flex flex-col items-center sm:items-start text-center sm:text-left">
                <h1 className="font-syne font-bold text-2xl sm:text-[28px] tracking-[-0.02em] text-white/90">{getSectionTitleForCategory(key)}</h1>
                <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent sm:from-white/10 sm:via-white/10 sm:to-transparent" />
                <ProductsGrid products={groupProducts} />
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
