"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/money";

interface CustomerInfo {
  name: string;
  email: string;
}

const PICKUP_OPTIONS = [
  { label: "As soon as possible", minutes: 0 },
  { label: "In 15 minutes", minutes: 15 },
  { label: "In 30 minutes", minutes: 30 },
  { label: "In 45 minutes", minutes: 45 },
  { label: "In 1 hour", minutes: 60 },
];

export function CheckoutView({
  currency,
  shopName,
  initialCustomer,
}: {
  currency: string;
  shopName: string;
  initialCustomer: CustomerInfo | null;
}) {
  const router = useRouter();
  const { items, subtotalCents, clear, ready } = useCart();

  const [customer, setCustomer] = useState<CustomerInfo | null>(initialCustomer);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pickupMinutes, setPickupMinutes] = useState(0);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready) return null;

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <div className="rounded-2xl border bg-[var(--card)] p-8 text-center">
          <p className="text-[var(--muted)]">Your cart is empty.</p>
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

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not sign in.");
      setCustomer({ name: data.customer.name, email: data.customer.email });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function placeOrder() {
    setBusy(true);
    setError(null);
    try {
      const pickupAt =
        pickupMinutes > 0
          ? new Date(Date.now() + pickupMinutes * 60_000).toISOString()
          : null;

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          pickupAt,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not place order.");
      clear();
      router.push(`/orders/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>

      {/* Order summary */}
      <section className="space-y-2 rounded-2xl border bg-[var(--card)] p-4">
        <h2 className="font-semibold">Collecting from {shopName}</h2>
        {items.map((i) => (
          <div key={i.productId} className="flex justify-between text-sm">
            <span>
              {i.quantity} × {i.name}
            </span>
            <span>{formatMoney(i.priceCents * i.quantity, currency)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
          <span>Total to pay on collection</span>
          <span>{formatMoney(subtotalCents, currency)}</span>
        </div>
      </section>

      {/* Identity */}
      {!customer ? (
        <form onSubmit={handleSignIn} className="space-y-3 rounded-2xl border bg-[var(--card)] p-4">
          <h2 className="font-semibold">Your details</h2>
          <p className="text-sm text-[var(--muted)]">
            We use these to save your order history and loyalty rewards.
          </p>
          <input
            className="w-full rounded-xl border bg-transparent px-3 py-2"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            className="w-full rounded-xl border bg-transparent px-3 py-2"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full px-5 py-2.5 font-semibold disabled:opacity-50"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            {busy ? "…" : "Continue"}
          </button>
        </form>
      ) : (
        <section className="rounded-2xl border bg-[var(--card)] p-4">
          <h2 className="font-semibold">Your details</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {customer.name} · {customer.email}
          </p>
        </section>
      )}

      {/* Pickup + notes + place order (only once identified) */}
      {customer && (
        <>
          <section className="space-y-3 rounded-2xl border bg-[var(--card)] p-4">
            <h2 className="font-semibold">Collection time</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PICKUP_OPTIONS.map((opt) => (
                <button
                  key={opt.minutes}
                  onClick={() => setPickupMinutes(opt.minutes)}
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    pickupMinutes === opt.minutes
                      ? "font-semibold"
                      : "text-[var(--muted)]"
                  }`}
                  style={
                    pickupMinutes === opt.minutes
                      ? { background: "var(--accent)", color: "var(--accent-fg)", borderColor: "var(--accent)" }
                      : undefined
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <textarea
              className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm"
              placeholder="Notes for the shop (optional) — e.g. oat milk, extra hot"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </section>

          {error && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            onClick={placeOrder}
            disabled={busy}
            className="w-full rounded-full px-5 py-3 text-lg font-semibold disabled:opacity-50"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            {busy ? "Placing order…" : `Place order · ${formatMoney(subtotalCents, currency)}`}
          </button>
          <p className="text-center text-xs text-[var(--muted)]">
            Payment is taken in person on collection (online payment coming soon).
          </p>
        </>
      )}

      {error && !customer && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
