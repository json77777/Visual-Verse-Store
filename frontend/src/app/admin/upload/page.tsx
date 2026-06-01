"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ApiFetchError, apiFetch, apiUpload } from "@/lib/api";
import type { ApiResponse, Product } from "@/lib/types";
import { DEFAULT_PRODUCT_GROUPS, getMenuLabelForCategory, toCategoryKey } from "@/lib/productGroups";

import { AdminShell } from "@/components/admin/AdminShell";

function parsePaiseFromDecimalInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}

export default function AdminUploadPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceDecimal, setPriceDecimal] = useState("0.00");
  const [isFree, setIsFree] = useState(false);
  const [prevPriceDecimal, setPrevPriceDecimal] = useState<string | null>(null);
  const [isDigital, setIsDigital] = useState(true);

  const [displayImage, setDisplayImage] = useState<File | null>(null);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);

  const [publicListing, setPublicListing] = useState(true);
  const [privateDirectLinkOnly, setPrivateDirectLinkOnly] = useState(false);
  const defaultCategory = DEFAULT_PRODUCT_GROUPS[0]!.key;
  const [availableCategories, setAvailableCategories] = useState<string[]>(
    DEFAULT_PRODUCT_GROUPS.map((g) => g.key),
  );
  const [category, setCategory] = useState<string>(defaultCategory);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [uploadBytes, setUploadBytes] = useState<{ loaded: number; total?: number } | null>(null);
  const [uploadPhase, setUploadPhase] = useState<"idle" | "uploading" | "processing">("idle");
  const [serverPercent, setServerPercent] = useState<number | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverDone, setServerDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayImagePreview = useMemo(() => {
    if (!displayImage) return null;
    return URL.createObjectURL(displayImage);
  }, [displayImage]);

  useEffect(() => {
    return () => {
      if (displayImagePreview) URL.revokeObjectURL(displayImagePreview);
    };
  }, [displayImagePreview]);

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

  async function publish() {
    setError(null);

    const pricePaise = parsePaiseFromDecimalInput(priceDecimal);
    if (!title.trim() || !description.trim() || pricePaise === null) {
      setError("Title, description, and valid price are required");
      return;
    }

    if (!displayImage) {
      setError("Display image is required");
      return;
    }

    if (isDigital && !digitalFile) {
      setError("Digital file is required");
      return;
    }

    const categoryKey = isCreatingCategory ? toCategoryKey(newCategoryName) : toCategoryKey(category);
    if (!categoryKey) {
      setError("Category is required");
      return;
    }

    setIsSubmitting(true);
    setUploadPercent(null);
    setUploadBytes(null);
    setUploadPhase("uploading");
    setServerPercent(null);
    setServerMessage(null);
    setServerDone(false);

    const uploadJobId = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now());

    const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
    const sseUrl = `${baseUrl}/api/v1/products/admin/upload-status/${encodeURIComponent(uploadJobId)}`;
    const source = baseUrl ? new EventSource(sseUrl, { withCredentials: true }) : null;

    const closeSource = () => {
      try {
        source?.close();
      } catch {
        // ignore
      }
    };

    if (source) {
      source.addEventListener("progress", (evt) => {
        try {
          const data = JSON.parse((evt as MessageEvent).data) as {
            percent?: number;
            message?: string;
          };
          if (typeof data.percent === "number") setServerPercent(data.percent);
          if (typeof data.message === "string") setServerMessage(data.message);
        } catch {
          // ignore
        }
      });

      source.addEventListener("done", (evt) => {
        try {
          const data = JSON.parse((evt as MessageEvent).data) as {
            percent?: number;
            message?: string;
          };
          if (typeof data.percent === "number") setServerPercent(data.percent);
          if (typeof data.message === "string") setServerMessage(data.message);
        } catch {
          // ignore
        }
        setServerDone(true);
        closeSource();
      });

      source.addEventListener("error", () => {
        // SSE can fail due to proxies/CORS. We'll fallback to the existing processing spinner.
        closeSource();
      });
    }

    try {
      const fd = new FormData();
      fd.set("title", title.trim());
      fd.set("description", description.trim());
      fd.set("category", categoryKey);
    fd.set("price", String(pricePaise));
    fd.set("isFree", String(isFree));
      fd.set("isDigital", String(isDigital));
      fd.set("stock", "1");
      fd.set("uploadJobId", uploadJobId);
      fd.append("images", displayImage);
      if (digitalFile) fd.append("file", digitalFile);

      const res = await apiUpload<ApiResponse<Product>>("/api/v1/products/admin/create", fd, {
        method: "POST",
        redirectOn401: false,
        onProgress: (p) => {
          setUploadBytes({ loaded: p.loaded, total: p.total });
          if (typeof p.percent === "number") setUploadPercent(p.percent);
          if (p.percent === 100) setUploadPhase("processing");
        },
      });

      toast.success("Product uploaded successfully!");
      router.push(`/admin/edit/${res.data._id}`);
    } catch (e) {
      if (e instanceof ApiFetchError) {
        const msg = `${e.message} (HTTP ${e.status})`;
        setError(msg);
        toast.error(msg);
      } else {
        const msg = e instanceof Error ? e.message : "Failed to publish asset";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
      setUploadPercent(null);
      setUploadBytes(null);
      setUploadPhase("idle");
      setServerDone(false);
      closeSource();
    }
  }

  const displayServerPercent =
    uploadPhase === "processing" && isSubmitting && typeof serverPercent === "number" && serverPercent >= 100
      ? 99
      : serverPercent;

  return (
    <AdminShell
      title="Upload New Product"
      actions={
        <>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="h-10 rounded-md border border-white/25 bg-neutral-900 px-4 font-dm-sans font-semibold text-[14px] text-white hover:bg-neutral-800 disabled:opacity-60 transition-colors"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={() => void publish()}
            disabled={isSubmitting}
            className="inline-flex h-10 min-w-[140px] items-center justify-center whitespace-nowrap rounded-md border border-green-400/40 bg-neutral-900 px-6 font-dm-sans font-semibold text-[14px] text-green-300 hover:bg-green-500/10 hover:border-green-300/60 hover:text-green-200 transition-colors shadow-[0_0_18px_rgba(34,197,94,0.08)] disabled:opacity-60"
          >
            {isSubmitting ? (
              uploadPhase === "processing"
                ? `Processing${typeof displayServerPercent === "number" ? `… ${displayServerPercent}%` : "…"}`
                : `Uploading${typeof uploadPercent === "number" ? `… ${uploadPercent}%` : "…"}`
            ) : (
              "Publish Asset"
            )}
          </button>

          {isSubmitting ? (
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
              {uploadPhase === "processing" && typeof displayServerPercent === "number" ? (
                <div className="w-32 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-1 bg-green-400/70 transition-[width] duration-200"
                    style={{ width: `${displayServerPercent}%` }}
                  />
                </div>
              ) : uploadPhase === "processing" ? (
                <div className="w-32 overflow-hidden rounded-full bg-white/10">
                  <div className="h-1 w-full animate-pulse bg-green-400/50" />
                </div>
              ) : (
                <div className="w-32 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-1 bg-green-400/70 transition-[width] duration-200"
                    style={{ width: `${uploadPercent ?? 0}%` }}
                  />
                </div>
              )}

              <div className="hidden sm:block text-[10px] tracking-[0.12em] text-white/45">
                {uploadPhase === "processing"
                  ? (serverDone && isSubmitting
                      ? "FINALIZING"
                      : (serverMessage ? serverMessage.toUpperCase() : "FINALIZING"))
                  : uploadBytes?.total
                    ? `${Math.round(uploadBytes.loaded / 1024 / 1024)}MB / ${Math.round(uploadBytes.total / 1024 / 1024)}MB`
                    : uploadBytes
                      ? `${Math.round(uploadBytes.loaded / 1024 / 1024)}MB`
                      : "STARTING"}
              </div>
            </div>
          ) : null}
        </>
      }
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <section className="space-y-10">
          <div>
            <p className="font-syne font-bold text-lg text-white">Product Information</p>
            <div className="mt-5 space-y-5">
              <div>
                <p className="block font-dm-sans font-semibold text-[15px] tracking-tight text-white/70">Title</p>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Minimalist Abstract 01"
                  className="mt-2 h-11 w-full rounded-md border border-white/15 bg-neutral-900 px-3 font-dm-sans font-normal text-sm text-white outline-none focus:ring-2 focus:ring-white/15"
                />
              </div>

              <div>
                <p className="block font-dm-sans font-semibold text-[15px] tracking-tight text-white/70">Description</p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed technical specification or artistic intent..."
                  rows={4}
                  className="mt-2 min-h-[120px] w-full resize-y rounded-md border border-white/15 bg-neutral-900 px-3 py-3 font-dm-sans font-normal text-sm text-white outline-none focus:ring-2 focus:ring-white/15"
                />
              </div>

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
            </div>
          </div>

          <div>
            <p className="font-syne font-bold text-lg text-white">Digital File</p>
            <label className="mt-5 flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-white/15 bg-neutral-900 text-center hover:bg-white/1">
              <input
                type="file"
                accept=".zip,.rar,.pdf,.txt,video/mp4"
                className="hidden"
                onChange={(e) => setDigitalFile(e.target.files?.[0] ?? null)}
              />
              <Image
                src="/assets/icons/folder_zip.png"
                alt=""
                width={18}
                height={18}
                className="opacity-70 invert"
              />
              <p className="text-[12px] text-white/70">
                {digitalFile ? digitalFile.name : "Drag and drop source file or browse"}
              </p>
              <p className="text-[10px] tracking-[0.12em] text-white/35">MAX 100MB · ZIP, RAR, PDF, TXT, MP4</p>
            </label>

            <p className="mt-3 text-[10px] tracking-[0.12em] text-white/35">
              RECEIPTS STORED VIA CLOUDINARY LOGIC
            </p>
          </div>

          {error ? <p className="text-[12px] text-white/70">{error}</p> : null}
        </section>

        <aside className="space-y-8">
          <div>
            <p className="font-syne font-bold text-lg text-white">Display Image</p>
            <label className="mt-5 block cursor-pointer overflow-hidden rounded-md border border-white/10 border-dashed bg-neutral-900/50 backdrop-blur-sm transition-colors hover:bg-neutral-800 hover:border-white/20">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setDisplayImage(e.target.files?.[0] ?? null)}
              />

              <div className="grid aspect-square w-full place-items-center text-center">
                {displayImagePreview ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={displayImagePreview}
                      alt=""
                      fill
                      sizes="360px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="px-6">
                    <Image
                      src="/assets/icons/add_photo_alternate.png"
                      alt=""
                      width={18}
                      height={18}
                      className="mx-auto opacity-70 invert"
                    />
                    <p className="mt-2 text-[11px] tracking-[0.14em] text-white/70">
                      UPLOAD THUMBNAIL
                    </p>
                    <p className="mt-1 text-[10px] tracking-[0.12em] text-white/35">
                      1080 × 1080 Recommended
                    </p>
                  </div>
                )}
              </div>
            </label>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-[10px] tracking-[0.16em] text-white/40">OPTIMIZATION</p>
              <p className="text-[10px] tracking-[0.16em] text-white/40">AUTO</p>
            </div>
            <p className="mt-2 text-[11px] text-white/45">
              Thumbnails are automatically served as WebP with architectural cropping presets applied.
            </p>
          </div>

          <div>
            <p className="font-syne font-bold text-lg text-white">Visibility Settings</p>
            <div className="mt-4 space-y-3 text-[12px]">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={publicListing}
                  onChange={(e) => {
                    setPublicListing(e.target.checked);
                    if (e.target.checked) setPrivateDirectLinkOnly(false);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-white/25 bg-neutral-900 accent-green-500"
                />
                <span className="text-white/70">Public Listing</span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={privateDirectLinkOnly}
                  onChange={(e) => {
                    setPrivateDirectLinkOnly(e.target.checked);
                    if (e.target.checked) setPublicListing(false);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-white/25 bg-neutral-900 accent-green-500"
                />
                <span className="text-white/70">Private (Direct Link Only)</span>
              </label>
            </div>
          </div>

          <div>
            <p className="font-syne font-bold text-lg text-white">Category</p>

            <div className="relative mt-4">
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
                className="h-10 w-full appearance-none rounded-md border border-white/15 bg-neutral-900 px-3 pr-10 text-[12px] text-white/70 outline-none focus:ring-2 focus:ring-white/15"
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
                className="w-auto h-auto pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 invert opacity-60"
              />
            </div>

            {isCreatingCategory ? (
              <div className="mt-3">
                <p className="font-dm-sans font-semibold text-[15px] text-white/70">NEW CATEGORY NAME</p>
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
        </aside>
      </div>
    </AdminShell>
  );
}
