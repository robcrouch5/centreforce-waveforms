import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seeds the database with one coffee shop and a starter menu so the app is
 * usable the moment it boots. Safe to re-run: it upserts by stable slugs.
 */
async function main() {
  const shop = await prisma.shop.upsert({
    where: { slug: "soul-town-coffee" },
    update: {},
    create: {
      slug: "soul-town-coffee",
      name: "Soul Town Coffee",
      tagline: "Order ahead, skip the queue, earn rewards.",
      description:
        "Independent neighbourhood coffee shop. Freshly roasted beans, homemade bakes, and a loyalty card that actually rewards you.",
      address: "1 High Street, Your Town",
      phone: "01234 567890",
      currency: "GBP",
      accentColor: "#6f4e37",
      loyaltyStampsPerReward: 9,
      loyaltyRewardLabel: "Free regular drink",
      pointsPerPound: 10,
    },
  });

  // Clear existing menu for a clean, deterministic seed of categories/products.
  await prisma.product.deleteMany({ where: { shopId: shop.id } });
  await prisma.category.deleteMany({ where: { shopId: shop.id } });

  const menu: {
    category: string;
    sortOrder: number;
    products: {
      name: string;
      description: string;
      priceCents: number;
      imageEmoji: string;
      earnsStamp?: boolean;
    }[];
  }[] = [
    {
      category: "Coffee",
      sortOrder: 0,
      products: [
        { name: "Espresso", description: "A single shot of our house blend.", priceCents: 220, imageEmoji: "☕" },
        { name: "Flat White", description: "Double shot, silky steamed milk.", priceCents: 330, imageEmoji: "☕" },
        { name: "Cappuccino", description: "Espresso, steamed milk, airy foam.", priceCents: 330, imageEmoji: "☕" },
        { name: "Latte", description: "Smooth double shot with lots of milk.", priceCents: 340, imageEmoji: "☕" },
        { name: "Mocha", description: "Espresso, chocolate and steamed milk.", priceCents: 370, imageEmoji: "☕" },
        { name: "Americano", description: "Double shot topped with hot water.", priceCents: 290, imageEmoji: "☕" },
      ],
    },
    {
      category: "Cold Drinks",
      sortOrder: 1,
      products: [
        { name: "Iced Latte", description: "Chilled double shot over ice.", priceCents: 360, imageEmoji: "🧊" },
        { name: "Cold Brew", description: "Steeped 18 hours, smooth and strong.", priceCents: 380, imageEmoji: "🧊" },
        { name: "Fresh Orange Juice", description: "Squeezed this morning.", priceCents: 320, imageEmoji: "🍊" },
      ],
    },
    {
      category: "Tea & Other",
      sortOrder: 2,
      products: [
        { name: "English Breakfast Tea", description: "Proper builder's brew.", priceCents: 250, imageEmoji: "🫖" },
        { name: "Green Tea", description: "Light and refreshing.", priceCents: 250, imageEmoji: "🫖" },
        { name: "Hot Chocolate", description: "Rich Belgian chocolate.", priceCents: 340, imageEmoji: "🍫" },
      ],
    },
    {
      category: "Food",
      sortOrder: 3,
      products: [
        { name: "Butter Croissant", description: "Baked fresh each morning.", priceCents: 280, imageEmoji: "🥐", earnsStamp: false },
        { name: "Pain au Chocolat", description: "Flaky pastry, dark chocolate.", priceCents: 300, imageEmoji: "🥐", earnsStamp: false },
        { name: "Bacon Roll", description: "Smoked back bacon in a soft roll.", priceCents: 490, imageEmoji: "🥓", earnsStamp: false },
        { name: "Banana Bread", description: "Homemade, thick cut.", priceCents: 320, imageEmoji: "🍌", earnsStamp: false },
      ],
    },
    {
      category: "Retail",
      sortOrder: 4,
      products: [
        { name: "Beans (250g)", description: "Take our house blend home.", priceCents: 850, imageEmoji: "🫘", earnsStamp: false },
        { name: "Keep Cup", description: "Reusable cup — 20p off every refill.", priceCents: 1200, imageEmoji: "🥤", earnsStamp: false },
      ],
    },
  ];

  for (const section of menu) {
    const category = await prisma.category.create({
      data: { shopId: shop.id, name: section.category, sortOrder: section.sortOrder },
    });
    await prisma.product.createMany({
      data: section.products.map((p, i) => ({
        shopId: shop.id,
        categoryId: category.id,
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        imageEmoji: p.imageEmoji,
        earnsStamp: p.earnsStamp ?? true,
        sortOrder: i,
      })),
    });
  }

  const productCount = await prisma.product.count({ where: { shopId: shop.id } });
  console.log(`Seeded "${shop.name}" (slug: ${shop.slug}) with ${productCount} products.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
