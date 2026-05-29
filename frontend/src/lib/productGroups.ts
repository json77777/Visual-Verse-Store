import type { Product } from "@/lib/types";

export const DEFAULT_PRODUCT_GROUPS = [
  {
    key: "colour-preset",
    menuLabel: "Colour Preset",
    sectionTitle: "Colour Presets",
  },
  {
    key: "shakes-preset",
    menuLabel: "Shakes Preset",
    sectionTitle: "Shakes Presets",
  },
  {
    key: "editing-pack",
    menuLabel: "Editing Pack",
    sectionTitle: "Editing Pack",
  },
  {
    key: "sfx-pack",
    menuLabel: "SFX Pack",
    sectionTitle: "SFX Pack",
  },
];

export function toCategoryKey(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeCategory(category: unknown): string {
  const key = toCategoryKey(category);
  return key || DEFAULT_PRODUCT_GROUPS[0]!.key;
}

function toTitleCaseFromKey(key: string): string {
  return key
    .split("-")
    .filter(Boolean)
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getMenuLabelForCategory(key: string): string {
  const normalized = normalizeCategory(key);
  const match = DEFAULT_PRODUCT_GROUPS.find((g) => g.key === normalized);
  return match?.menuLabel ?? toTitleCaseFromKey(normalized);
}

export function getSectionTitleForCategory(key: string): string {
  const normalized = normalizeCategory(key);
  const match = DEFAULT_PRODUCT_GROUPS.find((g) => g.key === normalized);
  return match?.sectionTitle ?? getMenuLabelForCategory(normalized);
}

export function getOrderedCategoryKeys(products: Product[]): string[] {
  const defaults = DEFAULT_PRODUCT_GROUPS.map((g) => g.key);
  const extra = new Set<string>();

  for (const product of products) {
    const key = normalizeCategory((product as Product).category);
    if (!defaults.includes(key)) extra.add(key);
  }

  const extraSorted = [...extra].sort((a, b) => a.localeCompare(b));
  return [...defaults, ...extraSorted];
}

export function groupProductsByCategory(products: Product[]): Map<string, Product[]> {
  const byGroup = new Map<string, Product[]>();
  for (const key of getOrderedCategoryKeys(products)) byGroup.set(key, []);

  for (const product of products) {
    const key = normalizeCategory((product as Product).category);
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key)!.push(product);
  }

  return byGroup;
}
