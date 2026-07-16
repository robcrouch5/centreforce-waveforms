import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/session";
import { getActiveShop } from "@/lib/shop";

// POST /api/loyalty — redeem one earned reward.
// The reward is "spent" here; in a real till flow, staff would apply it to an
// order. This endpoint models banking/redeeming so the loyalty loop is complete.
export async function POST(request: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const action = (body as { action?: string })?.action ?? "redeem";
  if (action !== "redeem") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const shop = await getActiveShop();

  try {
    const account = await prisma.$transaction(async (tx) => {
      const acct = await tx.loyaltyAccount.findUnique({
        where: { customerId_shopId: { customerId: customer.id, shopId: shop.id } },
      });
      if (!acct || acct.rewards <= 0) {
        throw new Error("NO_REWARD");
      }
      const updated = await tx.loyaltyAccount.update({
        where: { id: acct.id },
        data: { rewards: { decrement: 1 } },
      });
      await tx.loyaltyTransaction.create({
        data: { accountId: acct.id, reason: "reward-redeemed" },
      });
      return updated;
    });

    return NextResponse.json({
      rewards: account.rewards,
      stamps: account.stamps,
      points: account.points,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "NO_REWARD") {
      return NextResponse.json({ error: "You have no rewards to redeem yet." }, { status: 400 });
    }
    console.error("Redeem failed:", e);
    return NextResponse.json({ error: "Could not redeem right now." }, { status: 500 });
  }
}
