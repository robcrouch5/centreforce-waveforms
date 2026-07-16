import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/session";
import { getActiveShop } from "@/lib/shop";
import { formatMoney } from "@/lib/money";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Your orders</h1>
        <div className="rounded-2xl border bg-[var(--card)] p-8 text-center">
          <p className="text-[var(--muted)]">Sign in to see your order history.</p>
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

  const shop = await getActiveShop();
  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 50,
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Your orders</h1>

      {orders.length === 0 && (
        <div className="rounded-2xl border bg-[var(--card)] p-8 text-center">
          <p className="text-[var(--muted)]">No orders yet.</p>
          <Link
            href="/menu"
            className="mt-4 inline-block rounded-full px-5 py-2.5 font-semibold"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            Order something
          </Link>
        </div>
      )}

      <div className="space-y-2">
        {orders.map((order) => {
          const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between rounded-2xl border bg-[var(--card)] p-4"
            >
              <div>
                <p className="font-semibold">Order {order.code}</p>
                <p className="text-sm text-[var(--muted)]">
                  {itemCount} item{itemCount === 1 ? "" : "s"} ·{" "}
                  {order.createdAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
                <span className="font-semibold">
                  {formatMoney(order.subtotalCents, shop.currency)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
