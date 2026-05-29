"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { CartLink } from "./CartLink";
import { UserAvatarLink } from "./UserAvatarLink";
import { AdminNavItem } from "./admin/AdminNavItem";

import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/lib/types";
import { DEFAULT_PRODUCT_GROUPS, getMenuLabelForCategory, normalizeCategory } from "@/lib/productGroups";

type Active = "home" | "products" | "new-arrivals" | "downloads" | "admin" | "none";

function getActiveFromPathname(pathname: string): Active {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/products")) return "products";
  if (pathname.startsWith("/downloads")) return "downloads";
  if (pathname.startsWith("/admin")) return "admin";
  return "none";
}

export function SiteHeader({ active }: { active?: Active }) {
  const pathname = usePathname();
  const resolvedActive = active ?? getActiveFromPathname(pathname);
  const defaultKeys = useMemo(
    () => DEFAULT_PRODUCT_GROUPS.map((g) => g.key),
    [],
  );
  const [categoryKeys, setCategoryKeys] = useState<string[]>(defaultKeys);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const res = await apiFetch<ApiResponse<string[]>>(
          "/api/v1/products/categories",
          { cache: "no-store", redirectOn401: false },
        );

        const fromApi = (res.data ?? []).map((k) => normalizeCategory(k)).filter(Boolean);

        // Only show categories that the API actually returned, keeping the default sort order if possible
        const availableKeys = [
          ...defaultKeys.filter((k) => fromApi.includes(k)),
          ...fromApi.filter((k) => !defaultKeys.includes(k)),
        ];

        if (!cancelled) setCategoryKeys(availableKeys);
      } catch {
        if (!cancelled) setCategoryKeys([]);
      }
    }

    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, [defaultKeys]);

  const dropdownItems = useMemo(
    () => categoryKeys.map((key) => ({ key, label: getMenuLabelForCategory(key) })),
    [categoryKeys],
  );

  return (
    <header className="fixed left-1/2 top-6 z-50 w-full max-w-5xl -translate-x-1/2 px-4 md:px-8 transition-all duration-300">
      <nav className="flex w-full items-center justify-between rounded-[20px] border border-white/20 bg-white/[0.03] px-6 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[40px] backdrop-saturate-[1.8]">
        
        {/* Left Side: Logo & Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Go to Home" className="flex items-center gap-3 vv-soft-press transition-transform duration-300 hover:opacity-80">
            <Image
              src="/logo/vvlogo-updated.png"
              alt="Visual Verse logo"
              width={28}
              height={28}
              priority
            />
            <span className="font-syne font-extrabold text-lg tracking-[-0.04em] text-white">
              Visual Verse
            </span>
          </Link>
        </div>

        {/* Middle: Links */}
        <div className="hidden items-center gap-7 text-[15px] tracking-tight font-dm-sans font-semibold md:flex">
          <Link href="/" className="group relative pb-0.5 transition-colors hover:text-white vv-soft-press">
            <span className={resolvedActive === "home" ? "text-white" : "text-white/60"}>
              Home
            </span>
            <span className={`absolute inset-x-0 -bottom-1 h-0.5 bg-white rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.6)] ${resolvedActive === "home" ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-50"}`} />
          </Link>

          <div className="group/dropdown relative">
            <Link href="/products" className="group relative pb-0.5 transition-colors hover:text-white vv-soft-press">
              <span
                className={
                  resolvedActive === "products" ? "text-white flex items-center gap-1.5" : "text-white/60 flex items-center gap-1.5 group-hover:text-white transition-colors"
                }
              >
                Products
                {dropdownItems.length > 0 ? (
                  <Image
                    src="/assets/icons/arrow1.png"
                    alt=""
                    width={9}
                    height={9}
                    className="w-auto h-auto invert opacity-70 transition-transform duration-300 group-hover:-rotate-90 group-hover/dropdown:-rotate-90"
                  />
                ) : null}
              </span>
              <span className={`absolute inset-x-0 -bottom-1 h-0.5 bg-white rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.6)] ${resolvedActive === "products" ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-50"}`} />
            </Link>

            {dropdownItems.length > 0 ? (
              <div className="absolute left-1/2 top-full z-50 pt-7 w-52 -translate-x-1/2 opacity-0 pointer-events-none transition-all duration-300 translate-y-2 group-hover/dropdown:translate-y-0 group-hover/dropdown:pointer-events-auto group-hover/dropdown:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                <div className="rounded-xl border border-white/[0.08] bg-[#0A0A0A]/95 backdrop-blur-[40px] p-2 shadow-[0_10px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(255,255,255,0.03)] ring-1 ring-white/[0.05]">
                  {dropdownItems.map((it) => (
                    <Link
                      key={it.key}
                      href={`/products?category=${encodeURIComponent(it.key)}`}
                      className="flex items-center justify-between rounded-lg px-4 py-2.5 text-[14px] tracking-normal font-dm-sans font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {it.label}
                      <Image
                        src="/assets/icons/arrow1.png"
                        alt=""
                        width={8}
                        height={8}
                        className="w-auto h-auto invert opacity-40"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <Link href="/#new-arrivals" className="group relative pb-0.5 transition-colors hover:text-white vv-soft-press">
            <span
              className={
                resolvedActive === "new-arrivals" ? "text-white" : "text-white/60"
              }
            >
              New Arrivals
            </span>
            <span className={`absolute inset-x-0 -bottom-1 h-0.5 bg-white rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.6)] ${resolvedActive === "new-arrivals" ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-50"}`} />
          </Link>

          <Link href="/downloads" className="group relative pb-0.5 transition-colors hover:text-white vv-soft-press">
            <span
              className={resolvedActive === "downloads" ? "text-white" : "text-white/60"}
            >
              Downloads
            </span>
            <span className={`absolute inset-x-0 -bottom-1 h-0.5 bg-white rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.6)] ${resolvedActive === "downloads" ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-50"}`} />
          </Link>

          <AdminNavItem active={resolvedActive === "admin"} />
        </div>

        {/* Right Side: User & Cart & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <UserAvatarLink />
          <CartLink />
          
          <button 
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 rounded-full bg-white/5 border border-white/10 vv-soft-press"
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            aria-label="Toggle menu"
          >
            <div className={`w-3.5 h-[1.5px] bg-white transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-[0px]' : '-translate-y-0.5'}`} />
            <div className={`w-3.5 h-[1.5px] bg-white transition-all duration-300 ${isMobileMenuOpen ? 'hidden' : 'translate-y-0.5'}`} />
            <div className={`w-3.5 h-[1.5px] bg-white transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-[1.5px]' : 'hidden'}`} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      <div className={`absolute top-full left-4 right-4 mt-3 p-5 rounded-[20px] border border-white/20 bg-[#0A0A0A]/95 backdrop-blur-[40px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="flex flex-col gap-5 font-dm-sans text-[15px] font-medium text-white/70">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className={resolvedActive === "home" ? "text-white" : "hover:text-white transition-colors"}>Home</Link>
          <Link href="/products" onClick={() => setIsMobileMenuOpen(false)} className={resolvedActive === "products" ? "text-white" : "hover:text-white transition-colors"}>Products</Link>
          {categoryKeys.map((key) => (
             <Link key={key} href={`/products?category=${encodeURIComponent(key)}`} onClick={() => setIsMobileMenuOpen(false)} className="pl-4 text-[14px] text-white/50 hover:text-white transition-colors">↳ {getMenuLabelForCategory(key)}</Link>
          ))}
          <Link href="/#new-arrivals" onClick={() => setIsMobileMenuOpen(false)} className={resolvedActive === "new-arrivals" ? "text-white" : "hover:text-white transition-colors"}>New Arrivals</Link>
          <Link href="/downloads" onClick={() => setIsMobileMenuOpen(false)} className={resolvedActive === "downloads" ? "text-white" : "hover:text-white transition-colors"}>Downloads</Link>
          <div className="pt-4 border-t border-white/10">
             <AdminNavItem active={resolvedActive === "admin"} />
          </div>
        </div>
      </div>
    </header>
  );
}
