import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/session";
import { getActiveShop } from "@/lib/shop";
import { LoyaltyCard } from "@/components/LoyaltyCard";

export const dynamic = "force-dynamic";

export default async function LoyaltyPage() {
  const shop = await getActiveShop();
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Rewards</h1>
        <div className="rounded-2xl border bg-[var(--card)] p-8 text-center">
          <div className="text-4xl">⭐</div>
          <p className="mt-3 text-[var(--muted)]">
            Sign in to start collecting stamps and rewards.
          </p>
          <Link
            href="/account"
            className="mt-4 inline-block rounded-full px-5 py-2.5 font-semibold"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const account = await prisma.loyaltyAccount.findUnique({
    where: { customerId_shopId: { customerId: customer.id, shopId: shop.id } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rewards</h1>
        <p className="text-sm text-[var(--muted)]">{shop.name} loyalty card</p>
      </div>

      <LoyaltyCard
        stampsPerReward={shop.loyaltyStampsPerReward}
        rewardLabel={shop.loyaltyRewardLabel}
        initial={{
          stamps: account?.stamps ?? 0,
          points: account?.points ?? 0,
          rewards: account?.rewards ?? 0,
        }}
      />

      <section className="rounded-2xl border bg-[var(--card)] p-4 text-sm text-[var(--muted)]">
        <p className="font-medium text-[var(--foreground)]">How it works</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Earn a stamp for every eligible drink you buy.</li>
          <li>
            Collect {shop.loyaltyStampsPerReward} stamps for a{" "}
            {shop.loyaltyRewardLabel.toLowerCase()}.
          </li>
          <li>Earn {shop.pointsPerPound} points for every £1 spent.</li>
        </ul>
      </section>
    </div>
  );
}
