"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CustomerInfo {
  name: string;
  email: string;
}

export function AccountView({
  initialCustomer,
  orderCount,
}: {
  initialCustomer: CustomerInfo | null;
  orderCount: number;
}) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerInfo | null>(initialCustomer);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(e: React.FormEvent) {
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
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    await fetch("/api/session", { method: "DELETE" });
    setCustomer(null);
    setBusy(false);
    router.refresh();
  }

  if (customer) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold">Account</h1>

        <section className="rounded-2xl border bg-[var(--card)] p-5">
          <div className="flex items-center gap-3">
            <div
              className="grid h-12 w-12 place-items-center rounded-full text-xl font-semibold"
              style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
            >
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{customer.name}</p>
              <p className="text-sm text-[var(--muted)]">{customer.email}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-[var(--muted)]">
            {orderCount} order{orderCount === 1 ? "" : "s"} placed.
          </p>
        </section>

        <button
          onClick={signOut}
          disabled={busy}
          className="w-full rounded-full border px-5 py-2.5 font-semibold disabled:opacity-50"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <p className="text-sm text-[var(--muted)]">
        Enter your details to track orders and collect loyalty rewards.
      </p>

      <form onSubmit={signIn} className="space-y-3 rounded-2xl border bg-[var(--card)] p-5">
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full px-5 py-2.5 font-semibold disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
        >
          {busy ? "…" : "Continue"}
        </button>
      </form>

      <p className="text-center text-xs text-[var(--muted)]">
        No password needed for now — we identify you by email. Secure sign-in is on the roadmap.
      </p>
    </div>
  );
}
