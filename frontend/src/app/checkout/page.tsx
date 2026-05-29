"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import {
  clearCart,
  getCartServerSnapshot,
  getCartSnapshot,
  subscribeToCart,
  updateCartItemQuantity,
} from "@/lib/cart";
import type { ApiResponse, Product } from "@/lib/types";

import { TermsModal } from "@/components/TermsModal";

type CartProduct = Product & { quantity: number };

function formatRupeesFixed2FromPaise(paise: number): string {
  const rupees = paise / 100;
  const formatted = rupees.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `Rs ${formatted}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    getCartServerSnapshot,
  );
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  async function loadRazorpaySdk(): Promise<void> {
    if (typeof window === "undefined") return;
    const w = window as unknown as { Razorpay?: unknown };
    if (w.Razorpay) return;

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
      );
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error("Failed to load Razorpay")),
        );
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(script);
    });
  }

  const itemsById = useMemo(() => {
    return new Map(items.map((it) => [it.productId, it] as const));
  }, [items]);

  const productIdsKey = useMemo(() => {
    return items.map((it) => it.productId).join("|");
  }, [items]);

  const displayProducts = useMemo(() => {
    return products
      .filter((p) => itemsById.has(p._id))
      .map((p) => {
        const it = itemsById.get(p._id);
        return it ? { ...p, quantity: it.quantity } : p;
      });
  }, [products, itemsById]);

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
          setError(e instanceof Error ? e.message : "Failed to load checkout");
        }
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, [items, productIdsKey]);

  const totalPaise = useMemo(() => {
    return displayProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
  }, [displayProducts]);

  async function confirmEmail() {
    setError(null);
    setTermsError(false);
    setIsConfirming(true);
    setIsConfirmed(false);

    try {
      if (!displayProducts.length) {
        setError("Cart is empty");
        return;
      }

      const normalizedEmail = email.trim();
      if (!normalizedEmail || !normalizedEmail.includes("@")) {
        setError("Please enter your email");
        return;
      }

      if (!acceptedTerms) {
        setTermsError(true);
        setError("Please accept the Terms of Service");
        return;
      }

      setIsConfirmed(true);

      // 1) Create internal order
      const orderRes = await apiFetch<
        ApiResponse<{
          _id: string;
          totalAmount: number;
          paymentProvider: string;
          paymentStatus: string;
        }>
      >("/api/v1/orders", {
        method: "POST",
        body: {
          items: items.map((it) => ({ product: it.productId, quantity: it.quantity })),
          paymentProvider: "razorpay",
        },
      });

      const orderId = orderRes.data._id;

      // 2) Create Razorpay order (backend will handle zero-amount orders)
      const rzpOrderRes = await apiFetch<
        ApiResponse<{
          razorpayOrderId: string | null;
          amount: number;
          currency: string;
          key: string;
        }>
      >("/api/v1/payments/razorpay/create-order", {
        method: "POST",
        body: { orderId },
      });

      // If backend reports amount === 0, it's a free order — skip Razorpay UI
      if (typeof rzpOrderRes.data.amount === "number" && rzpOrderRes.data.amount === 0) {
        // finalize client-side UX: clear cart, notify, redirect to downloads
        clearCart();
        toast.success("Order completed — your downloads are ready!");
        setTimeout(() => {
          router.push("/downloads");
          router.refresh();
        }, 600);
        return;
      }

      // 3) Load Razorpay SDK + open checkout
      await loadRazorpaySdk();
      const w = window as unknown as {
        Razorpay: new (options: unknown) => { open: () => void; on: (ev: string, cb: (p: unknown) => void) => void };
      };

      const options = {
        key: rzpOrderRes.data.key,
        amount: rzpOrderRes.data.amount,
        currency: rzpOrderRes.data.currency,
        name: "Visual Verse",
        description: "Digital purchase",
        order_id: rzpOrderRes.data.razorpayOrderId,
        prefill: {
          email: normalizedEmail,
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await apiFetch<ApiResponse<unknown>>("/api/v1/payments/razorpay/verify", {
              method: "POST",
              body: {
                orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });

            clearCart();
            toast.success("Payment successful!");
            setTimeout(() => {
              router.push("/downloads");
              router.refresh();
            }, 800);
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Payment verification failed";
            setError(msg);
            toast.error(msg);
          }
        },
        modal: {
          ondismiss: () => {
            setError("Payment cancelled");
            toast.error("Payment cancelled");
          },
        },
      };

      const rzp = new w.Razorpay(options);
      rzp.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
        toast.error("Payment failed. Please try again.");
      });
      rzp.open();
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="flex-1">
      <main className="mx-auto w-full max-w-5xl px-8 pt-14 pb-16" style={{ fontFamily: "var(--font-syne)" }}>
        <div className="mt-2 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_420px]">
          <section>
            <h1 className="font-syne font-extrabold text-3xl tracking-[-0.03em] text-white">Checkout</h1>
            <p className="mt-2 font-dm-sans font-light text-xs text-white/60">
              Complete your purchase for instant digital access.
            </p>

            <div className="mt-10">
              <p className="font-dm-sans font-medium text-[11px] tracking-[0.18em] uppercase text-white/60">
                01 / DELIVERY EMAIL
              </p>
              <div className="mt-4 h-px w-full bg-white/10" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="YOUR@EMAIL.COM"
                inputMode="email"
                className="mt-4 h-11 w-full rounded-none border border-white/20 bg-neutral-900 px-3 font-dm-sans font-normal text-sm outline-none focus:border-white/40"
              />
              <p className="mt-2 font-dm-sans font-light text-[11px] text-white/60">
                Files will be sent here immediately after payment. <span className="text-[#ff6a00]/80 ml-1">Note: Please check your spam folder if you don't receive it within a few minutes.</span>
              </p>

              {isConfirmed ? (
                <p className="mt-3 font-dm-sans font-normal text-xs text-white/70">
                  Email confirmed. We’ll send your link soon.
                </p>
              ) : null}
            </div>

            <div className="mt-10">
              <p className="font-dm-sans font-medium text-[11px] tracking-[0.18em] uppercase text-white/60">
                02 / PAYMENT METHOD
              </p>
              <div className="mt-4 h-px w-full bg-white/10" />

              <div className="mt-5 border border-white/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image
                      src="/assets/icons/account_balance_wallet.png"
                      alt=""
                      width={14}
                      height={14}
                      className="invert opacity-80"
                    />
                    <span className="font-dm-sans font-normal text-xs">Razorpay Secure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="grid h-5 w-8 place-items-center border border-white/15 text-[9px] text-white/60">
                      VISA
                    </span>
                    <span className="grid h-5 w-8 place-items-center border border-white/15 text-[9px] text-white/60">
                      UPI
                    </span>
                    <span className="grid h-5 w-8 place-items-center border border-white/15 text-[9px] text-white/60">
                      MC
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-md border border-white/10 bg-white/3 p-4">
                  <p className="text-center font-dm-sans font-light text-[11px] text-white/60">
                    You will be redirected to Razorpay to complete your transaction securely.
                  </p>
                  <button
                    type="button"
                    className="mt-4 h-11 w-full rounded-md bg-white px-4 font-medium text-[12px] tracking-[0.1em] text-neutral-950 hover:bg-white/90 disabled:opacity-60 transition-colors"
                    onClick={confirmEmail}
                    disabled={isConfirming}
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    {isConfirming
                      ? "Processing..."
                      : totalPaise === 0
                      ? "Confirm Order"
                      : "Initialize Secure Payment"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAcceptedTerms(checked);
                  if (checked) setTermsError(false);
                }}
                className="mt-0.5 h-4 w-4 rounded border border-white/30 bg-transparent accent-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/20"
              />
              <label htmlFor="terms" className="font-dm-sans font-light text-[11px] text-white/70">
                I have read and agree to the{" "}
                <button
                  type="button"
                  onClick={() => setIsTermsModalOpen(true)}
                  className="text-green-400 hover:text-green-300 hover:underline transition-all"
                >
                  Terms & Conditions
                </button>
                , including the no-refund policy for digital products.
              </label>
            </div>

            {termsError ? (
              <p className="vv-alert-red mt-6 rounded-xl px-4 py-3 text-xs font-medium">
                Please accept the Terms & Conditions before continuing.
              </p>
            ) : null}

            {!termsError && error ? <p className="mt-6 text-xs text-white/70">{error}</p> : null}
          </section>

          <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />

          <aside className="h-fit border border-white/20 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-dm-sans font-medium text-[10px] uppercase tracking-[0.18em] text-white/70">ORDER SUMMARY</h2>
              <Link
                href="/products"
                className="grid h-9 w-24 place-items-center rounded-md border border-white/25 bg-neutral-900 font-dm-sans font-medium text-[11px] tracking-[0.1em] text-white/70 hover:bg-white/10 transition-colors"
              >
                Browse
              </Link>
            </div>

            <div className="mt-5 space-y-5">
              {displayProducts.length ? (
                displayProducts.map((p) => (
                  <div key={p._id} className="flex items-start gap-4">
                    <div className="relative h-16 w-16 overflow-hidden bg-white/5">
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
                      <p className="truncate font-syne font-bold text-[13px] tracking-[-0.01em] text-white">
                        {p.title}
                      </p>
                      <p className="mt-0.5 font-dm-sans font-light text-[9px] uppercase text-white/50">
                        Digital asset | instant download
                      </p>
                      <p className="mt-1 font-dm-sans font-semibold text-[11px] text-white">
                        {formatRupeesFixed2FromPaise(p.price)}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          className="grid h-7 w-7 place-items-center rounded-full border border-green-400/60 bg-green-500/15 text-[12px] font-semibold text-green-200 hover:bg-green-500/25 hover:border-green-300/80 transition-colors"
                          onClick={() => updateCartItemQuantity(p._id, 1)}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          className="grid h-7 w-7 place-items-center rounded-full border border-red-400/60 bg-red-500/15 text-[12px] font-semibold text-red-200 hover:bg-red-500/25 hover:border-red-300/80 transition-colors"
                          onClick={() => updateCartItemQuantity(p._id, -1)}
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="pt-7 text-[11px] text-white/70">
                      Qty. {p.quantity}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/60">Cart is empty.</p>
              )}
            </div>

            <div className="mt-6 h-px w-full bg-white/20" />

            <div className="mt-5 space-y-3 font-dm-sans text-[11px] text-white/70">
              <div className="flex items-center justify-between">
                <span className="font-normal">SUBTOTAL</span>
                <span className="font-semibold">{formatRupeesFixed2FromPaise(totalPaise)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-normal">DIGITAL DELIVERY</span>
                <span className="font-normal">Free</span>
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between">
              <span className="font-syne font-bold text-sm tracking-[-0.01em]">TOTAL</span>
              <span className="font-dm-sans font-semibold text-sm tracking-[0.01em]">
                {formatRupeesFixed2FromPaise(totalPaise)}
              </span>
            </div>

            <p className="mt-6 font-dm-sans font-light text-[9px] uppercase tracking-[0.12em] text-white/40">
              Encrypted SSL connection
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}
