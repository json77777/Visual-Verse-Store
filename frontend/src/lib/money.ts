export function formatRupeesFromPaise(paise: number): string {
  if (!paise) return "Free";

  const rupees = paise / 100;
  const formatted = rupees.toLocaleString("en-IN", {
    maximumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
  });
  return `Rs ${formatted}`;
}
