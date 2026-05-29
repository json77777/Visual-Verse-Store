export type CartItem = {
  productId: string;
  quantity: number;
};

const STORAGE_KEY = "vv_cart_v1";
const CART_CHANGE_EVENT = "vv_cart_change";

const EMPTY_CART_SNAPSHOT: CartItem[] = [];

let cachedRaw: string | null | undefined = undefined;
let cachedItems: CartItem[] = EMPTY_CART_SNAPSHOT;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function parseCart(raw: string | null): CartItem[] {
  if (!raw) return EMPTY_CART_SNAPSHOT;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((it) => {
        if (!isRecord(it)) return null;
        const productId = it.productId;
        const quantity = Number(it.quantity ?? 1);
        if (typeof productId !== "string" || !productId) return null;
        if (!Number.isFinite(quantity) || quantity <= 0) return null;
        return { productId, quantity } satisfies CartItem;
      })
      .filter(Boolean) as CartItem[];
  } catch {
    return [];
  }
}

function readCart(): CartItem[] {
  if (typeof window === "undefined") return EMPTY_CART_SNAPSHOT;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (cachedRaw !== undefined && raw === cachedRaw) return cachedItems;

  const next = parseCart(raw);
  cachedRaw = raw;
  cachedItems = next;
  return next;
}

function cloneCart(items: CartItem[]): CartItem[] {
  return items.map((it) => ({ productId: it.productId, quantity: it.quantity }));
}

function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(items);
  window.localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedItems = items;
  window.dispatchEvent(new Event(CART_CHANGE_EVENT));
}

export function getCartItems(): CartItem[] {
  return readCart();
}

export function subscribeToCart(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = () => callback();
  window.addEventListener(CART_CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CART_CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function getCartSnapshot(): CartItem[] {
  return readCart();
}

export function getCartServerSnapshot(): CartItem[] {
  return EMPTY_CART_SNAPSHOT;
}

export function addToCart(productId: string, quantity = 1): CartItem[] {
  const items = readCart();
  const next = cloneCart(items);
  const existing = next.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    next.push({ productId, quantity });
  }
  writeCart(next);
  return next;
}

export function setCartItemQuantity(productId: string, quantity: number): CartItem[] {
  const normalized = Math.floor(Number(quantity));
  if (!Number.isFinite(normalized)) return readCart();

  const items = readCart();
  const next = cloneCart(items);
  const existing = next.find((i) => i.productId === productId);

  if (normalized <= 0) {
    const filtered = next.filter((i) => i.productId !== productId);
    writeCart(filtered);
    return filtered;
  }

  if (existing) {
    existing.quantity = normalized;
  } else {
    next.push({ productId, quantity: normalized });
  }

  writeCart(next);
  return next;
}

export function updateCartItemQuantity(productId: string, delta: number): CartItem[] {
  const items = readCart();
  const existing = items.find((i) => i.productId === productId);
  const nextQuantity = (existing?.quantity ?? 0) + delta;
  return setCartItemQuantity(productId, nextQuantity);
}

export function removeFromCart(productId: string): CartItem[] {
  const items = readCart().filter((i) => i.productId !== productId);
  writeCart(items);
  return items;
}

export function clearCart(): void {
  writeCart([]);
}
