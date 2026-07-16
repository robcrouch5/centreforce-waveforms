"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/money";

export function CartView({ currency }: { currency: string }) {
  const { items, subtotalCents, setQuantity, remove, ready } = useCart();

  if (!ready) return null;

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Your cart</h1>
        <div className="rounded-2xl border bg-[var(--card)] p-8 text-center">
          <div className="text-4xl">🛒</div>
          <p className="mt-3 text-[var(--muted)]">Your cart is empty.</p>
          <Link
            href="/menu"
            className="mt-4 inline-block rounded-full px-5 py-2.5 font-semibold"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            Browse the menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Your cart</h1>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-3 rounded-2xl border bg-[var(--card)] p-3"
          >
            <div
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-xl"
              style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
              aria-hidden
            >
              {item.imageEmoji ?? "🍽️"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{item.name}</p>
              <p className="text-sm text-[var(--muted)]">
                {formatMoney(item.priceCents, currency)} each
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(item.productId, item.quantity - 1)}
                className="grid h-8 w-8 place-items-center rounded-full border text-lg"
                aria-label={`Decrease ${item.name}`}
              >
                −
              </button>
              <span className="w-6 text-center font-semibold">{item.quantity}</span>
              <button
                onClick={() => setQuantity(item.productId, item.quantity + 1)}
                className="grid h-8 w-8 place-items-center rounded-full border text-lg"
                aria-label={`Increase ${item.name}`}
              >
                +
              </button>
            </div>

            <div className="w-16 shrink-0 text-right font-semibold">
              {formatMoney(item.priceCents * item.quantity, currency)}
            </div>

            <button
              onClick={() => remove(item.productId)}
              className="shrink-0 text-[var(--muted)] hover:text-red-500"
              aria-label={`Remove ${item.name}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-2xl border bg-[var(--card)] p-4">
        <span className="font-medium">Subtotal</span>
        <span className="text-lg font-bold">{formatMoney(subtotalCents, currency)}</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/menu" className="rounded-full border px-5 py-2.5 font-semibold">
          Add more
        </Link>
        <Link
          href="/checkout"
          className="flex-1 rounded-full px-5 py-2.5 text-center font-semibold"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
        >
          Checkout for collection →
        </Link>
      </div>
    </div>
  );
}
