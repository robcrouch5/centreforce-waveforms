import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/session";
import { getActiveShop } from "@/lib/shop";
import { formatMoney } from "@/lib/money";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCurrentCustomer();
  if (!customer) notFound();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  // Only the owner may view an order.
  if (!order || order.customerId !== customer.id) notFound();

  const shop = await getActiveShop();

  return (
    <div className="space-y-6">
      <Link href="/orders" className="text-sm text-[var(--muted)]">
        ← All orders
      </Link>

      <section className="rounded-3xl border bg-[var(--card)] p-6 text-center">
        <p className="text-sm text-[var(--muted)]">Show this code at the counter</p>
        <p className="mt-1 text-5xl font-bold tracking-widest">{order.code}</p>
        <div className="mt-3 flex justify-center">
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-3 text-sm text-[var(--muted)]">
          {order.pickupAt
            ? `Collect at ${order.pickupAt.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "Collect as soon as possible"}
        </p>
      </section>

      {(order.stampsEarned > 0 || order.pointsEarned > 0) && (
        <section
          className="rounded-2xl p-4 text-sm font-medium"
          style={{ background: "color-mix(in srgb, var(--accent) 14%, transparent)" }}
        >
          ⭐ You earned{" "}
          {order.stampsEarned > 0 && (
            <>
              {order.stampsEarned} stamp{order.stampsEarned === 1 ? "" : "s"}
            </>
          )}
          {order.stampsEarned > 0 && order.pointsEarned > 0 && " and "}
          {order.pointsEarned > 0 && <>{order.pointsEarned} points</>} on this order.{" "}
          <Link href="/loyalty" className="underline">
            View rewards
          </Link>
        </section>
      )}

      <section className="rounded-2xl border bg-[var(--card)] p-4">
        <h2 className="font-semibold">Order {order.code}</h2>
        <p className="text-sm text-[var(--muted)]">
          {order.createdAt.toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        <div className="mt-3 space-y-1">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.quantity} × {item.nameSnapshot}
              </span>
              <span>{formatMoney(item.priceCentsSnapshot * item.quantity, shop.currency)}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-between border-t pt-2 font-semibold">
          <span>Total</span>
          <span>{formatMoney(order.subtotalCents, shop.currency)}</span>
        </div>

        {order.notes && (
          <p className="mt-3 rounded-xl bg-black/5 p-3 text-sm">
            <span className="font-medium">Notes: </span>
            {order.notes}
          </p>
        )}
      </section>

      <Link
        href="/menu"
        className="block rounded-full px-5 py-3 text-center font-semibold"
        style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
      >
        Order again
      </Link>
    </div>
  );
}
