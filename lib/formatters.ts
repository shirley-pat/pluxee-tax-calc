export function formatINR(value: number, compact = false): string {
  if (compact) {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toFixed(0)}`;
  }

  // Indian numbering: lakh/crore grouping
  const num = Math.round(value);
  if (num === 0) return "₹0";

  const numStr = num.toString();
  const lastThree = numStr.slice(-3);
  const rest = numStr.slice(0, -3);
  const grouped = rest
    ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
    : lastThree;

  return "₹" + grouped;
}

export function formatPercent(value: number): string {
  return value.toFixed(2) + "%";
}

export function parseINR(value: string): number {
  return Number(value.replace(/[^0-9.]/g, "")) || 0;
}
