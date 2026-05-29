"use client";

import Image from "next/image";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ApiFetchError, apiFetch } from "@/lib/api";
import type { ApiResponse, Product } from "@/lib/types";
import { DEFAULT_PRODUCT_GROUPS, getMenuLabelForCategory, toCategoryKey } from "@/lib/productGroups";

import { AdminShell } from "@/components/admin/AdminShell";

function toDecimalPrice(paise: number): string {
  const rupees = paise / 100;
  return rupees.toFixed(2);
}

function parsePaiseFromDecimalInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}

const DEFAULT_CATEGORY_KEY = DEFAULT_PRODUCT_GROUPS[0]!.key;

export default function AdminEditProductDetailsPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const router = useRouter();
  const { productId } = use(params);

  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceDecimal, setPriceDecimal] = useState("0.00");
  const [isFree, setIsFree] = useState(false);
  const [prevPriceDecimal, setPrevPriceDecimal] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>(
    DEFAULT_PRODUCT_GROUPS.map((g) => g.key),
  );
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY_KEY);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const [replaceDigitalFile, setReplaceDigitalFile] = useState<File | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [selectedCoverSrc, setSelectedCoverSrc] = useState<string | null>(null);

  const productImages = useMemo(() => product?.images ?? [], [product]);

  const coverImage = useMemo(() => {
    if (selectedCoverSrc && productImages.includes(selectedCoverSrc)) return selectedCoverSrc;
    return productImages[0] ?? null;
  }, [productImages, selectedCoverSrc]);

  useEffect(() => {
    // Reset selection when navigating between products.
    queueMicrotask(() => setSelectedCoverSrc(null));
  }, [productId]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setError(null);
      try {
        const res = await apiFetch<ApiResponse<Product>>(
          `/api/v1/products/admin/${productId}`,
          { cache: "no-store" },
        );

        if (!mounted) return;
        setProduct(res.data);
        setTitle(res.data.title ?? "");
        setDescription(res.data.description ?? "");
        const loadedIsFree = !!((res.data as any).isFree) || (res.data.price ?? 0) === 0;
        setIsFree(loadedIsFree);
        setPriceDecimal(loadedIsFree ? "0.00" : toDecimalPrice(res.data.price ?? 0));
        setCategory(toCategoryKey(res.data.category) || DEFAULT_CATEGORY_KEY);
        setStatus(res.data.isActive ? "ACTIVE" : "INACTIVE");
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load product");
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [productId]);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const res = await apiFetch<ApiResponse<string[]>>("/api/v1/products/categories", {
          cache: "no-store",
          redirectOn401: false,
        });

        const defaults = DEFAULT_PRODUCT_GROUPS.map((g) => g.key);
        const merged = [...defaults];
        for (const raw of res.data ?? []) {
          const key = toCategoryKey(raw);
          if (key && !merged.includes(key)) merged.push(key);
        }

        if (!cancelled) setAvailableCategories(merged);
      } catch {
        // ignore
      }
    }

    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveChanges() {
    if (!product) return;

    const pricePaise = parsePaiseFromDecimalInput(priceDecimal);
    if (!title.trim() || !description.trim() || pricePaise === null) {
      // If product is free, price validation is still satisfied (we treat 0 as valid)
      setError("Title, description, and valid price are required");
      return;
    }

    setError(null);
    setIsSaving(true);

    const categoryKey = isCreatingCategory ? toCategoryKey(newCategoryName) : toCategoryKey(category);
    if (!categoryKey) {
      setIsSaving(false);
      setError("Category is required");
      return;
    }

    try {
      const res = await apiFetch<ApiResponse<Product>>(
        `/api/v1/products/admin/update/${productId}`,
        {
          method: "PATCH",
            body: {
            title: title.trim(),
            description: description.trim(),
            price: isFree ? 0 : pricePaise,
            isFree: isFree,
            category: categoryKey,
          },
          redirectOn401: false,
        },
      );

      let updated = res.data;

      if (replaceDigitalFile) {
        const fd = new FormData();
        fd.append("file", replaceDigitalFile);

        const fileRes = await apiFetch<ApiResponse<Product>>(
          `/api/v1/products/admin/replace-file/${productId}`,
          { method: "PATCH", body: fd, redirectOn401: false },
        );

        updated = fileRes.data;
        setReplaceDigitalFile(null);
      }

      setProduct(updated);
      setStatus(updated.isActive ? "ACTIVE" : "INACTIVE");
      toast.success("Changes saved successfully!");
    } catch (e) {
      if (e instanceof ApiFetchError) {
        const msg = `${e.message} (HTTP ${e.status})`;
        setError(msg);
        toast.error(msg);
      } else {
        const msg = e instanceof Error ? e.message : "Failed to save changes";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadCoverImage(file: File) {
    if (!product) return;

    setError(null);
    setIsUploadingCover(true);

    try {
      const fd = new FormData();
      fd.append("image", file);

      const res = await apiFetch<ApiResponse<Product>>(
        `/api/v1/products/admin/cover-image/${productId}`,
        { method: "PATCH", body: fd, redirectOn401: false },
      );

      setProduct(res.data);
      setSelectedCoverSrc(res.data.images?.[0] ?? null);
      toast.success("Cover image updated!");
    } catch (e) {
      if (e instanceof ApiFetchError) {
        const msg = `${e.message} (HTTP ${e.status})`;
        setError(msg);
        toast.error(msg);
      } else {
        const msg = e instanceof Error ? e.message : "Failed to upload cover image";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setIsUploadingCover(false);
    }
  }

  async function setActive(nextActive: boolean) {
    if (!product) return;
    if (product.isActive === nextActive) return;

    setError(null);
    setIsSaving(true);

    try {
      const res = await apiFetch<ApiResponse<Product>>(
        `/api/v1/products/admin/toggle-status/${productId}`,
        { method: "PATCH", redirectOn401: false },
      );

      setProduct(res.data);
      setStatus(res.data.isActive ? "ACTIVE" : "INACTIVE");
      toast.success(`Product ${res.data.isActive ? "activated" : "deactivated"}!`);
    } catch (e) {
      if (e instanceof ApiFetchError) {
        const msg = `${e.message} (HTTP ${e.status})`;
        setError(msg);
        toast.error(msg);
      } else {
        const msg = e instanceof Error ? e.message : "Failed to update status";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteProduct() {
    if (!product) return;
    const ok = window.confirm("Delete this product?");
    if (!ok) return;

    setError(null);
    setIsSaving(true);

    try {
      await apiFetch<ApiResponse<Product>>(
        `/api/v1/products/admin/remove/${productId}`,
        { method: "PATCH", redirectOn401: false },
      );
      toast.success("Product deleted!");
      router.push("/admin/edit");
    } catch (e) {
      if (e instanceof ApiFetchError) {
        const msg = `${e.message} (HTTP ${e.status})`;
        setError(msg);
        toast.error(msg);
      } else {
        const msg = e instanceof Error ? e.message : "Failed to delete product";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminShell
      title="Edit Product"
      actions={
        <>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSaving}
            className="h-8 rounded-md border border-white/25 bg-neutral-900 px-3 text-[11px] tracking-[0.14em] text-white transition-colors hover:bg-white/10 disabled:opacity-60"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={() => void saveChanges()}
            disabled={isSaving || !product}
            className="h-10 rounded-md bg-white px-4 font-dm-sans font-semibold text-[14px] text-neutral-950 transition-colors hover:bg-white/90 disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <section>
          <div>
            <p className="block font-dm-sans font-semibold text-[15px] tracking-tight text-white/70">Product Title</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-white/15 bg-neutral-900 px-3 font-dm-sans font-normal text-sm text-white outline-none focus:ring-2 focus:ring-white/15"
            />
          </div>

          <div className="mt-5">
            <p className="block font-dm-sans font-semibold text-[15px] tracking-tight text-white/70">Description</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="mt-2 min-h-[120px] w-full resize-y rounded-md border border-white/15 bg-neutral-900 px-3 py-3 font-dm-sans font-normal text-sm text-white outline-none focus:ring-2 focus:ring-white/15"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-[180px_1fr] sm:items-end">
            <div>
              <p className="block font-dm-sans font-semibold text-[15px] tracking-tight text-white/70">Price (INR)</p>
                <div className="mt-2 flex items-center gap-3 rounded-md border border-white/15 bg-neutral-900 px-3">
                  {!isFree ? (
                    <span className="text-[12px] text-white/50">Rs</span>
                  ) : null}
                  <input
                    value={priceDecimal}
                    onChange={(e) => setPriceDecimal(e.target.value)}
                    inputMode="decimal"
                    disabled={isFree}
                    className={`h-11 w-full bg-transparent px-2 font-dm-sans font-normal text-sm outline-none ${isFree ? "text-white/40" : "text-white"}`}
                  />

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isFree}
                      onChange={(e) => {
                        const v = e.target.checked;
                        setIsFree(v);
                        if (v) {
                          setPrevPriceDecimal(priceDecimal);
                          setPriceDecimal("0.00");
                        } else {
                          if (prevPriceDecimal !== null) setPriceDecimal(prevPriceDecimal);
                        }
                      }}
                      className="h-4 w-4 rounded border-white/25 bg-neutral-900 accent-green-500"
                    />
                    <span className="text-white/70">Free</span>
                    {/* badge removed - keeping checkbox label only */}
                  </label>
                </div>
            </div>

            <div>
              <p className="block font-dm-sans font-semibold text-[15px] tracking-tight text-white/70">Status</p>
              <div className="mt-2 inline-flex overflow-hidden rounded-md border border-white/20 bg-neutral-900 divide-x divide-white/10">
                <button
                  type="button"
                  className={`h-9 px-3 font-dm-sans font-semibold text-[13px] transition-colors ${
                    status === "ACTIVE"
                      ? "bg-white/10 text-white"
                      : "bg-neutral-900 text-white/60 hover:bg-white/5"
                  }`}
                  onClick={() => void setActive(true)}
                  disabled={isSaving}
                >
                  Active
                </button>
                <button
                  type="button"
                  className={`h-9 px-3 font-dm-sans font-semibold text-[13px] transition-colors ${
                    status === "INACTIVE"
                      ? "bg-white/10 text-white"
                      : "bg-neutral-900 text-white/60 hover:bg-white/5"
                  }`}
                  onClick={() => void setActive(false)}
                  disabled={isSaving}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="block font-dm-sans font-semibold text-[15px] tracking-tight text-white/70">Category</p>

            <div className="relative mt-2">
              <select
                value={isCreatingCategory ? "__new__" : category}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "__new__") {
                    setIsCreatingCategory(true);
                    setNewCategoryName("");
                    return;
                  }
                  setIsCreatingCategory(false);
                  setCategory(v);
                }}
                className="h-11 w-full appearance-none rounded-md border border-white/15 bg-neutral-900 px-3 pr-12 font-dm-sans font-normal text-sm text-white/70 outline-none focus:ring-2 focus:ring-white/15"
              >
                {availableCategories.map((key) => (
                  <option key={key} value={key}>
                    {getMenuLabelForCategory(key)}
                  </option>
                ))}
                <option value="__new__">Create new category…</option>
              </select>

              <Image
                src="/assets/icons/arrow1.png"
                alt=""
                width={12}
                height={12}
                aria-hidden="true"
                className="w-auto h-auto pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 invert opacity-60"
              />
            </div>

            {isCreatingCategory ? (
              <div className="mt-3">
                <p className="block font-dm-sans font-semibold text-[15px] tracking-tight text-white/70">NEW CATEGORY NAME</p>
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. LUT Pack"
                  className="mt-2 h-11 w-full rounded-md border border-white/15 bg-neutral-900 px-3 font-dm-sans font-normal text-[15px] text-white outline-none focus:ring-2 focus:ring-white/15"
                />
                <p className="mt-2 text-[11px] text-white/45">
                  Key: <span className="text-white/70">{toCategoryKey(newCategoryName) || "—"}</span>
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-6">
            <p className="block font-dm-sans font-semibold text-[15px] tracking-tight text-white/70">DIGITAL ASSET FILE</p>
            <div className="mt-2 flex items-center justify-between gap-4 rounded-md border border-white/15 bg-neutral-900 px-4 py-3">
              <div className="flex items-center gap-3">
                <Image
                  src="/assets/icons/folder_zip.png"
                  alt=""
                  width={18}
                  height={18}
                  className="opacity-80 brightness-0 invert shrink-0"
                />
                <div>
                  <p className="text-[12px] text-white/80">
                    {product ? `${product.title.toLowerCase().replace(/\s+/g, "_")}.zip` : "—"}
                  </p>
                  <p className="text-[10px] tracking-[0.12em] text-white/35">CLOUDINARY LINKED</p>
                </div>
              </div>

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".zip,.pdf,.txt,video/mp4"
                  className="hidden"
                  onChange={(e) => setReplaceDigitalFile(e.target.files?.[0] ?? null)}
                />
                <span className="inline-flex h-8 items-center rounded-md border border-white/25 bg-neutral-900 px-3 text-[11px] tracking-[0.14em] text-white hover:bg-white/2">
                  Replace File
                </span>
              </label>
            </div>

            {replaceDigitalFile ? (
              <p className="mt-2 text-[12px] text-white/60">Selected: {replaceDigitalFile.name}</p>
            ) : null}
          </div>

          <div className="mt-8 rounded-md border border-red-500/40 bg-red-500/5 p-4">
            <p className="font-syne font-bold text-lg text-red-500">Danger Zone</p>
            <p className="mt-1 text-[11px] text-red-300/80">
              Permanently remove this product from the inventory and store.
            </p>
            <button
              type="button"
              className="mt-3 h-8 rounded-md border border-red-500/60 bg-neutral-900 px-3 text-[11px] tracking-[0.14em] text-red-300 transition-colors hover:bg-red-500/10"
              onClick={() => void deleteProduct()}
              disabled={isSaving || !product}
            >
              Delete Product
            </button>
          </div>

          {error ? <p className="mt-4 text-[12px] text-white/70">{error}</p> : null}
        </section>

        <aside>
          <p className="font-syne font-bold text-lg text-white">Cover Image Preview</p>
          <div className="mt-4 overflow-hidden rounded-md border border-white/15 bg-white/2">
            <div className="relative aspect-4/3 w-full">
              {coverImage ? (
                <Image src={coverImage} alt="" fill sizes="360px" className="object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-[12px] text-white/45">
                  No cover image
                </div>
              )}
            </div>
          </div>
          <p className="mt-3 text-[11px] text-white/45">
            Recommended size: 2400×3000px.
            <br />
            Format: JPG or WebP (max 10MB).
          </p>

          <div className="mt-4 flex items-center gap-3">
            <label
              className={`shrink-0 grid h-15 w-15 cursor-pointer select-none place-items-center rounded-md border bg-neutral-900 text-white/70 transition-colors ${
                isUploadingCover || isSaving
                  ? "border-white/10 opacity-60"
                  : "border-white/15 hover:border-white/25 hover:bg-white/5"
              }`}
              title="Upload new cover image"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploadingCover || isSaving}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  // allow picking same file again later
                  e.currentTarget.value = "";
                  if (!f) return;
                  void uploadCoverImage(f);
                }}
              />
              <span className="text-[18px] leading-none">{isUploadingCover ? "…" : "+"}</span>
            </label>
            {productImages.slice(0, 3).map((src, idx) => {
              const selected = coverImage === src;
              return (
                <button
                  key={`${src}-${idx}`}
                  type="button"
                  onClick={() => setSelectedCoverSrc(src)}
                  aria-pressed={selected}
                  className={`shrink-0 relative h-15 w-15 overflow-hidden rounded-md border bg-white/2 transition-colors ${
                    selected
                      ? "border-white/40 ring-2 ring-white/20"
                      : "border-white/15 hover:border-white/25"
                  }`}
                  title={selected ? "Selected cover" : "Set as cover preview"}
                >
                  <Image src={src} alt="" fill sizes="60px" className="object-cover" />
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
