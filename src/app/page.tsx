import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveShop } from "@/lib/shop";

export default async function HomePage() {
  let shop;
  try {
    shop = await getActiveShop();
  } catch {
    return <NotSeeded />;
  }

  const productCount = await prisma.product.count({
    where: { shopId: shop.id, available: true },
  });

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border bg-[var(--card)] p-6">
        <div className="text-4xl">☕</div>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{shop.name}</h1>
        {shop.tagline && <p className="mt-1 text-[var(--muted)]">{shop.tagline}</p>}
        {shop.description && <p className="mt-3 text-sm text-[var(--muted)]">{shop.description}</p>}

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/menu"
            className="rounded-full px-5 py-2.5 font-semibold"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            Order ahead →
          </Link>
          <Link href="/loyalty" className="rounded-full border px-5 py-2.5 font-semibold">
            My rewards
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Feature emoji="⏱️" title="Skip the queue" body="Order and pay ahead, then collect when it's ready." />
        <Feature
          emoji="⭐"
          title="Earn rewards"
          body={`Collect ${shop.loyaltyStampsPerReward} stamps and get a ${shop.loyaltyRewardLabel.toLowerCase()}.`}
        />
        <Feature emoji="🧾" title="Order history" body="Reorder your usual in a couple of taps." />
      </section>

      <section className="flex items-center justify-between rounded-2xl border bg-[var(--card)] p-5">
        <div>
          <p className="font-medium">{productCount} items on the menu</p>
          <p className="text-sm text-[var(--muted)]">Freshly made to order.</p>
        </div>
        <Link
          href="/menu"
          className="rounded-full px-4 py-2 text-sm font-semibold"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
        >
          View menu
        </Link>
      </section>

      {shop.address && (
        <section className="rounded-2xl border bg-[var(--card)] p-5 text-sm text-[var(--muted)]">
          <p className="font-medium text-[var(--foreground)]">Find us</p>
          <p className="mt-1">{shop.address}</p>
          {shop.phone && <p>{shop.phone}</p>}
          <p className="mt-1">{shop.isOpen ? "🟢 Open now" : "🔴 Closed"}</p>
        </section>
      )}
    </div>
  );
}

function Feature({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border bg-[var(--card)] p-4">
      <div className="text-2xl">{emoji}</div>
      <h3 className="mt-2 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">{body}</p>
    </div>
  );
}

function NotSeeded() {
  return (
    <div className="rounded-3xl border bg-[var(--card)] p-6">
      <h1 className="text-xl font-bold">Welcome to Perk 👋</h1>
      <p className="mt-2 text-[var(--muted)]">
        The database has not been set up yet. Run the following to create the starter shop
        and menu:
      </p>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-black/80 p-4 text-sm text-white">
        npm run setup
      </pre>
      <p className="mt-3 text-sm text-[var(--muted)]">Then refresh this page.</p>
    </div>
  );
}
