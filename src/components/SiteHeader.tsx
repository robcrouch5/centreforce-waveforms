"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/loyalty", label: "Rewards" },
  { href: "/orders", label: "Orders" },
];

export function SiteHeader({
  shopName,
  customerName,
}: {
  shopName: string;
  customerName: string | null;
}) {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-20 border-b bg-[var(--background)]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span
            className="grid h-8 w-8 place-items-center rounded-full text-lg"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
            aria-hidden
          >
            ☕
          </span>
          <span className="truncate">{shopName}</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 sm:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/cart"
          className="relative ml-auto grid h-9 w-9 place-items-center rounded-full border sm:ml-0"
          aria-label={`Cart with ${count} item${count === 1 ? "" : "s"}`}
        >
          🛒
          {count > 0 && (
            <span
              className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-xs font-semibold"
              style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
            >
              {count}
            </span>
          )}
        </Link>

        <Link
          href="/account"
          className="grid h-9 w-9 place-items-center rounded-full border"
          aria-label="Account"
          title={customerName ?? "Sign in"}
        >
          {customerName ? customerName.charAt(0).toUpperCase() : "👤"}
        </Link>
      </div>

      {/* Mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-2 sm:hidden">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition ${
                active
                  ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
