import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/session";
import { getActiveShop, makeOrderCode } from "@/lib/shop";
import { applyEarnings } from "@/lib/loyalty";

interface IncomingItem {
  productId: string;
  quantity: number;
}

// POST /api/orders — place a collection order from the current cart.
export async function POST(request: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { items, pickupAt, notes } = (body ?? {}) as {
    items?: IncomingItem[];
    pickupAt?: string | null;
    notes?: string | null;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  // Collapse duplicate lines and sanitise quantities.
  const quantities = new Map<string, number>();
  for (const item of items) {
    if (!item || typeof item.productId !== "string") continue;
    const qty = Math.floor(Number(item.quantity));
    if (!Number.isFinite(qty) || qty <= 0) continue;
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + qty);
  }
  if (quantities.size === 0) {
    return NextResponse.json({ error: "No valid items in cart." }, { status: 400 });
  }

  const shop = await getActiveShop();

  // Re-price against the database — never trust client-supplied prices.
  const products = await prisma.product.findMany({
    where: { id: { in: [...quantities.keys()], }, shopId: shop.id, available: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  const missing = [...quantities.keys()].filter((id) => !productById.has(id));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Some items are no longer available. Please review your cart." },
      { status: 409 },
    );
  }

  const lineItems = [...quantities.entries()].map(([productId, quantity]) => {
    const product = productById.get(productId)!;
    return {
      productId,
      nameSnapshot: product.name,
      priceCentsSnapshot: product.priceCents,
      quantity,
      earnsStamp: product.earnsStamp,
    };
  });

  const subtotalCents = lineItems.reduce(
    (sum, i) => sum + i.priceCentsSnapshot * i.quantity,
    0,
  );

  // Validate pickup time (optional; null = as soon as possible).
  let pickupDate: Date | null = null;
  if (pickupAt) {
    const d = new Date(pickupAt);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid pickup time." }, { status: 400 });
    }
    pickupDate = d;
  }

  const cleanNotes =
    typeof notes === "string" && notes.trim() ? notes.trim().slice(0, 500) : null;

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Ensure the customer has a loyalty account at this shop.
      const account = await tx.loyaltyAccount.upsert({
        where: { customerId_shopId: { customerId: customer.id, shopId: shop.id } },
        update: {},
        create: { customerId: customer.id, shopId: shop.id },
      });

      const outcome = applyEarnings(
        {
          loyaltyStampsPerReward: shop.loyaltyStampsPerReward,
          pointsPerPound: shop.pointsPerPound,
        },
        lineItems.map((i) => ({
          priceCents: i.priceCentsSnapshot,
          quantity: i.quantity,
          earnsStamp: i.earnsStamp,
        })),
        { stamps: account.stamps, points: account.points, rewards: account.rewards },
      );

      // Create the order (retry on the rare order-code collision).
      let created;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          created = await tx.order.create({
            data: {
              shopId: shop.id,
              customerId: customer.id,
              code: makeOrderCode(),
              status: "confirmed",
              pickupAt: pickupDate,
              notes: cleanNotes,
              subtotalCents,
              stampsEarned: outcome.stampsEarned,
              pointsEarned: outcome.pointsEarned,
              items: {
                create: lineItems.map((i) => ({
                  productId: i.productId,
                  nameSnapshot: i.nameSnapshot,
                  priceCentsSnapshot: i.priceCentsSnapshot,
                  quantity: i.quantity,
                })),
              },
            },
          });
          break;
        } catch (e) {
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2002" &&
            attempt < 4
          ) {
            continue; // duplicate code — try another
          }
          throw e;
        }
      }
      if (!created) throw new Error("Could not allocate an order code.");

      // Apply loyalty earnings and record the audit line.
      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          stamps: outcome.next.stamps,
          points: outcome.next.points,
          rewards: outcome.next.rewards,
        },
      });
      await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          orderId: created.id,
          stampsDelta: outcome.stampsEarned,
          pointsDelta: outcome.pointsEarned,
          reason: "order",
        },
      });

      return created;
    });

    return NextResponse.json({ id: order.id, code: order.code });
  } catch (e) {
    console.error("Order creation failed:", e);
    return NextResponse.json(
      { error: "Something went wrong placing your order. Please try again." },
      { status: 500 },
    );
  }
}
