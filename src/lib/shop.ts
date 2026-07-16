import { prisma } from "@/lib/prisma";

// v1 runs a single shop. This helper is the one place that decides "which shop
// are we serving", so multi-shop routing (e.g. /s/[slug]) can be introduced
// later by changing only this function.
export async function getActiveShop() {
  const shop = await prisma.shop.findFirst({ orderBy: { createdAt: "asc" } });
  if (!shop) {
    throw new Error(
      "No shop found. Run `npm run db:seed` to create the starter shop.",
    );
  }
  return shop;
}

/** A short, human-friendly, mildly-unique order code, e.g. "A3F9". */
export function makeOrderCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}
