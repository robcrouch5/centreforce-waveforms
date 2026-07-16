# Perk ☕

An **order-ahead and loyalty platform for coffee shops** (and similar independents).
Customers browse a shop's menu on their phone, order ahead for collection, and earn
loyalty stamps and points — all from a fast, mobile-friendly web app.

This repository starts as a single coffee shop but is built **multi-shop from day
one**, so the platform can grow to serve many businesses.

> Note: this project lives alongside some unrelated legacy files (`.github/workflows/waveforms.yml`,
> `scripts/`) from a previous use of this repository. Those are untouched by Perk.

---

## What's included (v1)

- 🏪 **Shop & menu** — categories and products, priced and seeded for one shop.
- 🛒 **Order ahead for collection** — cart, pickup time, notes, and a collection code.
- ⭐ **Loyalty** — a configurable stamp card ("collect N, get a reward") *and* a
  points-per-pound scheme, with earning, reward roll-over and redemption.
- 👤 **Customer accounts** — lightweight email-based sign-in and order history.
- 🧾 **Order tracking** — status badges (confirmed → preparing → ready → collected).

## Tech stack

| Concern        | Choice                                            | Why |
| -------------- | ------------------------------------------------- | --- |
| Framework      | **Next.js 15** (App Router) + React 19 + TypeScript | One codebase for UI + API, great mobile web, easy hosting. |
| Styling        | **Tailwind CSS v4**                               | Fast, consistent, dark-mode aware. |
| Database       | **Prisma ORM** — SQLite locally, Postgres in prod | Zero-setup dev; the schema ports cleanly to a hosted DB. |
| Money          | Integer **pence** everywhere                      | No floating-point rounding bugs. |

---

## Getting started

Requires **Node.js 20+**.

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file
cp .env.example .env

# 3. Set up the database (generate client, create tables, seed a shop + menu)
npm run setup

# 4. Run the app
npm run dev
```

Open <http://localhost:3000>.

### Useful scripts

| Command            | What it does                                             |
| ------------------ | ------------------------------------------------------- |
| `npm run dev`      | Start the dev server (hot reload).                       |
| `npm run build`    | Production build (also runs `prisma generate`).          |
| `npm run start`    | Serve the production build.                              |
| `npm run setup`    | Generate client + create tables + seed. Run once first.  |
| `npm run db:seed`  | (Re)seed the starter shop and menu.                      |
| `npm run db:reset` | Wipe and reseed the local database.                      |
| `npm run db:studio`| Open Prisma Studio to browse/edit data in the browser.   |

---

## How it fits together

```
src/
  app/
    page.tsx              Home / shop landing
    menu/                 Browse the menu, add to cart
    cart/                 Review cart
    checkout/             Identify + choose pickup time + place order
    orders/               Order history and a single order (with collection code)
    loyalty/              Stamp card, points, redeem rewards
    account/              Sign in / sign out
    api/
      session/            Sign in/out (cookie-based identity)
      orders/             Place an order (re-prices server-side, applies loyalty)
      loyalty/            Redeem a reward
  components/             UI building blocks (menu items, cart, loyalty card, …)
  lib/
    prisma.ts             Database client (singleton)
    session.ts            Cookie-based customer session (v1)
    shop.ts               "Which shop are we serving" (single place to make multi-shop)
    loyalty.ts            Pure loyalty maths (stamps, points, rewards)
    cart.tsx              Client-side cart (localStorage)
    money.ts              Currency formatting
prisma/
  schema.prisma           Data model (Shop, Product, Customer, Order, Loyalty…)
  seed.ts                 Starter shop + menu
```

### Key design decisions

- **Prices are re-checked on the server** when an order is placed — the client's
  cart is only a convenience, never trusted for pricing.
- **Order lines snapshot** the product name and price, so past orders stay correct
  even if the menu changes later.
- **Loyalty maths is a pure function** (`src/lib/loyalty.ts`), separate from the
  database, so it's easy to reason about and test.
- **Multi-shop ready:** every product, order and loyalty account belongs to a
  `Shop`. Today `getActiveShop()` returns the single seeded shop; adding
  `/s/[slug]` routing later is a small, contained change.

---

## Roadmap / next steps

The v1 identity model is intentionally simple (a cookie holding the customer id,
no password) so the whole flow is usable immediately. Sensible next steps as the
product grows:

1. **Secure sign-in** — magic-link or one-time-code email login.
2. **Online payment** — Stripe at checkout (currently pay-on-collection).
3. **Shop dashboard** — staff view to see incoming orders and advance their status
   (confirmed → preparing → ready), plus menu editing.
4. **Real-time order updates** — notify the customer when their order is ready.
5. **Multi-shop** — shop directory and per-shop URLs; onboard more businesses.
6. **Move to Postgres** — switch the Prisma `provider` and point `DATABASE_URL`
   at a hosted database for production.
7. **Push notifications / installable PWA** — closer to a native app feel.

## Deploying

The app deploys to any Node host or platform such as Vercel. For production:

1. Provision a Postgres database and set `DATABASE_URL`.
2. Change `provider` in `prisma/schema.prisma` from `sqlite` to `postgresql`.
3. Run `prisma migrate deploy` (introduce migrations) and seed once.
4. Set `NEXT_PUBLIC_APP_URL` to your public URL.
