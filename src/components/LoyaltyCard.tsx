"use client";

import { useState } from "react";

interface Balance {
  stamps: number;
  points: number;
  rewards: number;
}

export function LoyaltyCard({
  stampsPerReward,
  rewardLabel,
  initial,
}: {
  stampsPerReward: number;
  rewardLabel: string;
  initial: Balance;
}) {
  const [balance, setBalance] = useState<Balance>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function redeem() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeem" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not redeem.");
      setBalance({ stamps: data.stamps, points: data.points, rewards: data.rewards });
      setMessage("Reward redeemed — show this to staff. Enjoy! ☕");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not redeem.");
    } finally {
      setBusy(false);
    }
  }

  const slots = Array.from({ length: stampsPerReward }, (_, i) => i < balance.stamps);

  return (
    <div className="space-y-4">
      {/* Stamp card */}
      <div
        className="rounded-3xl border p-5"
        style={{ background: "color-mix(in srgb, var(--accent) 10%, var(--card))" }}
      >
        <div className="flex items-baseline justify-between">
          <p className="font-semibold">Stamp card</p>
          <p className="text-sm text-[var(--muted)]">
            {balance.stamps} / {stampsPerReward}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-3 sm:grid-cols-9">
          {slots.map((filled, i) => (
            <div
              key={i}
              className="grid aspect-square place-items-center rounded-full border-2 text-lg"
              style={
                filled
                  ? { background: "var(--accent)", color: "var(--accent-fg)", borderColor: "var(--accent)" }
                  : { borderColor: "var(--border)" }
              }
            >
              {filled ? "☕" : ""}
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-[var(--muted)]">
          {stampsPerReward - balance.stamps > 0
            ? `${stampsPerReward - balance.stamps} more until your ${rewardLabel.toLowerCase()}.`
            : `You've filled your card!`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-[var(--card)] p-4 text-center">
          <p className="text-2xl font-bold">{balance.points}</p>
          <p className="text-sm text-[var(--muted)]">points</p>
        </div>
        <div className="rounded-2xl border bg-[var(--card)] p-4 text-center">
          <p className="text-2xl font-bold">{balance.rewards}</p>
          <p className="text-sm text-[var(--muted)]">reward{balance.rewards === 1 ? "" : "s"} ready</p>
        </div>
      </div>

      {/* Redeem */}
      {balance.rewards > 0 && (
        <button
          onClick={redeem}
          disabled={busy}
          className="w-full rounded-full px-5 py-3 font-semibold disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
        >
          {busy ? "…" : `Redeem a ${rewardLabel.toLowerCase()}`}
        </button>
      )}

      {message && (
        <p className="rounded-xl border bg-[var(--card)] px-4 py-2 text-center text-sm">
          {message}
        </p>
      )}
    </div>
  );
}
