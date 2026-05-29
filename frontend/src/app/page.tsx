import Image from "next/image";
import { apiFetch } from "@/lib/api";
import { PixelTransitionHero } from "@/components/PixelTransitionHero";
import type { ApiResponse, Product } from "@/lib/types";
import {
  getOrderedCategoryKeys,
  getSectionTitleForCategory,
  groupProductsByCategory,
} from "@/lib/productGroups";

import { ProductsGrid } from "@/app/products/products-grid";

async function getProducts(): Promise<Product[]> {
  const response = await apiFetch<ApiResponse<Product[]>>("/api/v1/products", {
    cache: "no-store",
  });
  return response.data;
}

export default async function HomePage() {
  const products = await getProducts();
  const newArrivals = [...products]
    .sort((a, b) => {
      const ad = Date.parse(a.createdAt);
      const bd = Date.parse(b.createdAt);
      return (Number.isFinite(bd) ? bd : 0) - (Number.isFinite(ad) ? ad : 0);
    })
    .slice(0, 8);

  const byGroup = groupProductsByCategory(products);
  const keys = getOrderedCategoryKeys(products);

  return (
    <>
      <style>{`
        .hp-root {
          min-height: 100vh;
        }

        /* Shared content width */
        .hp-content {
          max-width: 1024px;
          margin: 0 auto;
          box-sizing: border-box;
          width: 100%;
        }

        /* ── Hero ── */
        .hp-hero {
          position: relative;
          width: 100%;
          height: 75vh;
          min-height: 500px;
          max-height: 700px;
          overflow: hidden;
        }

        .hp-hero-img {
          object-fit: cover;
          object-position: center;
        }

        .hp-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(8,8,8,1.00) 0%,
            rgba(8,8,8,0.15) 20%,
            rgba(8,8,8,0.10) 50%,
            rgba(8,8,8,0.70) 80%,
            rgba(8,8,8,1.00) 100%
          );
          z-index: 1;
        }

        .hp-hero-vignette {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, rgba(8,8,8,0.55) 0%, transparent 45%);
          z-index: 1;
        }

        /* Hero text lives inside the shared content column */
        .hp-hero-content {
          position: absolute;
          bottom: 64px;
          left: 0;
          right: 0;
          z-index: 2;
        }

        .hp-hero-eyebrow {
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.32);
          margin-bottom: 14px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
        }

        .hp-hero-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(36px, 6vw, 68px);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
          color: #fff;
          margin: 0 0 16px;
        }

        .hp-hero-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          color: rgba(255,255,255,0.42);
          margin: 0 0 32px;
          max-width: 40ch;
          line-height: 1.65;
        }

        .hp-hero-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 11px 22px;
          border-radius: 10px;
          background: #fff;
          color: #0a0a0a;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          transition: opacity 0.2s, transform 0.2s;
        }
        .hp-hero-cta:hover { opacity: 0.88; transform: translateY(-1px); }

        /* ── Scroll prompt ── */
        .hp-scroll {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 44px 0 52px;
        }

        .hp-scroll-label {
          font-family: var(--font-scroll), 'DM Sans', sans-serif;
          font-size: 12px;
          color: rgba(255,255,255,0.25);
          text-decoration: none;
          transition: color 0.2s;
          letter-spacing: 0.04em;
        }
        .hp-scroll-label:hover { color: rgba(255,255,255,0.55); }

        .hp-scroll-btn {
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.02);
          text-decoration: none;
          transition: border-color 0.2s, background 0.2s, transform 0.2s;
        }
        .hp-scroll-btn:hover {
          border-color: rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.04);
          transform: translateY(2px);
        }

        /* ── Store sections ── */
        .hp-store {
          padding-bottom: 96px;
        }

        .hp-section {
          padding-bottom: 80px;
        }

        .hp-section-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.20);
          margin-bottom: 6px;
          display: block;
        }

        .hp-section-title {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: rgba(255,255,255,0.90);
          margin: 0;
        }

        .hp-section-divider {
          height: 1px;
          background: linear-gradient(90deg, rgba(255,255,255,0.08) 0%, transparent 80%);
          margin: 20px 0 28px;
        }

        .hp-empty {
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          font-size: 13px;
          color: rgba(255,255,255,0.25);
          padding: 24px 0;
        }

        @media (max-width: 768px) {
          .hp-hero {
            height: 60vh;
            min-height: 400px;
          }
          
          /* Center Hero Content */
          .hp-hero-content {
            padding: 0 24px 40px;
            justify-content: center;
          }
          .hp-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .hp-hero-eyebrow {
            margin: 0 auto 12px;
          }
          .hp-hero-title {
            letter-spacing: -0.02em; /* Less squish on mobile */
            margin: 0 0 12px;
          }
          .hp-hero-sub {
            margin: 0 auto 24px;
            letter-spacing: 0.02em; /* More legibility */
          }
          
          /* Adjust store sections */
          .hp-store {
            padding-bottom: 64px;
          }
          .hp-section {
            padding-bottom: 48px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .hp-section-eyebrow,
          .hp-section-title {
            text-align: center;
          }
          .hp-section-divider {
            width: 100%;
            background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
          }
        }
      `}</style>

      <div className="hp-root flex-1" suppressHydrationWarning>

        {/* ── Hero ── */}
        <section className="hp-hero">
          <PixelTransitionHero 
            images={["/mainpics/ytBanner_00000.png", "/mainpics/Visual_Verse_Store_BG_official.png", "/mainpics/Horse_img3.png"]} 
          />
          <div className="hp-hero-overlay" />

          <div className="hp-hero-content">
            <div className="hp-content">
              <p className="hp-hero-eyebrow">Visual Verse Store</p>
              <h1 className="hp-hero-title">Premium Edit<br />Packs. Curated.</h1>
              <p className="hp-hero-sub">
                Motion graphics, overlays, LUTs and transitions — crafted for editors who care about craft.
              </p>
              <a href="#store" className="hp-hero-cta">
                Browse Store
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* ── Scroll prompt ── */}
        <div className="hp-scroll animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 fill-mode-both">
          <a href="#store" className="hp-scroll-label">Scroll down</a>
          <a href="#store" aria-label="Scroll to store" className="hp-scroll-btn vv-soft-press">
            <Image
              src="/assets/icons/arrow2.png"
              alt=""
              width={13}
              height={13}
              className="vv-yoyo-down invert opacity-55"
            />
          </a>
        </div>

        {/* ── Store ── */}
        <main id="store" className="hp-store">
          <div className="hp-content">

            {/* New Arrivals */}
            {newArrivals.length > 0 ? (
              <section id="new-arrivals" className="hp-section">
                <span className="hp-section-eyebrow">Just dropped</span>
                <h2 className="hp-section-title">New Arrivals</h2>
                <div className="hp-section-divider" />
                <div className="animate-in fade-in w-full slide-in-from-bottom-8 duration-1000">
                  <ProductsGrid products={newArrivals} />
                </div>
              </section>
            ) : null}

            {/* Category sections */}
            {keys.map((key) => {
              const groupProducts = byGroup.get(key) ?? [];
              if (groupProducts.length === 0) return null;

              return (
                <section key={key} className="hp-section w-full">
                  <span className="hp-section-eyebrow">Collection</span>
                  <h2 className="hp-section-title">{getSectionTitleForCategory(key)}</h2>
                  <div className="hp-section-divider" />
                  <div className="animate-in fade-in w-full slide-in-from-bottom-8 duration-1000">
                    <ProductsGrid products={groupProducts} />
                  </div>
                </section>
              );
            })}

          </div>
        </main>
      </div>
    </>
  );
}