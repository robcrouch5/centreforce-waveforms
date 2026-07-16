"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/money";

/** A sticky bottom bar that appears whenever the cart has items. */
export function CartBar({ currency }: { currency: string }) {
  const { count, subtotalCents, ready } = useCart();

  if (!ready || count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-4">
      <Link
        href="/cart"
        className="mx-auto flex w-full max-w-3xl items-center justify-between rounded-full px-5 py-3 font-semibold shadow-lg"
        style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
      >
        <span>
          View cart · {count} item{count === 1 ? "" : "s"}
        </span>
        <span>{formatMoney(subtotalCents, currency)}</span>
      </Link>
    </div>
  );
}
