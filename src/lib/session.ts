import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// A deliberately lightweight identity model for v1: a signed-in customer is
// remembered via an httpOnly cookie holding their id. There is no password yet
// — see the roadmap in README.md for the planned upgrade to real auth
// (magic-link / OTP). Keeping it here means swapping the mechanism later
// touches only this file.

const COOKIE_NAME = "perk_customer";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function getCustomerId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export async function getCurrentCustomer() {
  const id = await getCustomerId();
  if (!id) return null;
  return prisma.customer.findUnique({ where: { id } });
}

export async function setCustomerCookie(customerId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, customerId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearCustomerCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
