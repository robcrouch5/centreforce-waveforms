import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { SiteHeader } from "@/components/SiteHeader";
import { getActiveShop } from "@/lib/shop";
import { getCurrentCustomer } from "@/lib/session";

export const metadata: Metadata = {
  title: "Perk — order ahead & earn rewards",
  description: "Order ahead for collection and earn loyalty rewards at your favourite coffee shop.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // These may fail before the DB is seeded; degrade gracefully so the app still
  // renders a helpful message rather than a crash.
  let shopName = "Perk";
  let accentColor = "#6f4e37";
  let customerName: string | null = null;
  try {
    const shop = await getActiveShop();
    shopName = shop.name;
    accentColor = shop.accentColor;
    const customer = await getCurrentCustomer();
    customerName = customer?.name ?? null;
  } catch {
    /* not seeded yet — handled by the pages */
  }

  return (
    <html lang="en">
      <body className="min-h-screen antialiased" style={{ ["--accent" as string]: accentColor }}>
        <CartProvider>
          <SiteHeader shopName={shopName} customerName={customerName} />
          <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
