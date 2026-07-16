import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveShop } from "@/lib/shop";
import { MenuItem } from "@/components/MenuItem";
import { CartBar } from "@/components/CartBar";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  let shop;
  try {
    shop = await getActiveShop();
  } catch {
    return <p className="text-[var(--muted)]">Run <code>npm run setup</code> to load the menu.</p>;
  }

  const categories = await prisma.category.findMany({
    where: { shopId: shop.id },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Menu</h1>
        <p className="text-sm text-[var(--muted)]">Add items, then head to your cart to collect.</p>
      </div>

      {categories.length === 0 && (
        <p className="text-[var(--muted)]">No items yet.</p>
      )}

      {categories.map((category) => (
        <section key={category.id} className="space-y-3">
          <h2 className="text-lg font-semibold">{category.name}</h2>
          <div className="space-y-2">
            {category.products.map((p) => (
              <MenuItem
                key={p.id}
                currency={shop.currency}
                item={{
                  id: p.id,
                  name: p.name,
                  description: p.description,
                  priceCents: p.priceCents,
                  imageEmoji: p.imageEmoji,
                  earnsStamp: p.earnsStamp,
                  available: p.available,
                }}
              />
            ))}
          </div>
        </section>
      ))}

      <p className="text-center text-sm text-[var(--muted)]">
        Looking for your rewards?{" "}
        <Link href="/loyalty" className="underline">
          View your loyalty card
        </Link>
      </p>

      <CartBar currency={shop.currency} />
    </div>
  );
}
