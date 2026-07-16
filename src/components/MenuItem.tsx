"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/money";

export interface MenuItemData {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageEmoji: string | null;
  earnsStamp: boolean;
  available: boolean;
}

export function MenuItem({ item, currency }: { item: MenuItemData; currency: string }) {
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleAdd() {
    add(
      {
        productId: item.id,
        name: item.name,
        priceCents: item.priceCents,
        imageEmoji: item.imageEmoji,
        earnsStamp: item.earnsStamp,
      },
      1,
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-[var(--card)] p-3">
      <div
        className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-2xl"
        style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
        aria-hidden
      >
        {item.imageEmoji ?? "🍽️"}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate font-medium">{item.name}</h3>
          <span className="shrink-0 font-semibold">{formatMoney(item.priceCents, currency)}</span>
        </div>
        {item.description && (
          <p className="line-clamp-2 text-sm text-[var(--muted)]">{item.description}</p>
        )}
        {item.earnsStamp && (
          <span className="mt-0.5 inline-block text-xs text-[var(--muted)]">☕ earns a stamp</span>
        )}
      </div>

      <button
        onClick={handleAdd}
        disabled={!item.available}
        className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-40"
        style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
      >
        {item.available ? (justAdded ? "Added ✓" : "Add") : "Sold out"}
      </button>
    </div>
  );
}
