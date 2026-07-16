/** Formats an integer minor-unit amount (pence) as a currency string. */
export function formatMoney(cents: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/** Sums order-item-like rows into a subtotal in minor units. */
export function subtotalOf(items: { priceCents: number; quantity: number }[]): number {
  return items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
}
