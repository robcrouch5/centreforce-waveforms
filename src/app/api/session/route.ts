import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentCustomer,
  setCustomerCookie,
  clearCustomerCookie,
} from "@/lib/session";

// GET /api/session — who am I?
export async function GET() {
  const customer = await getCurrentCustomer();
  return NextResponse.json({ customer });
}

// POST /api/session — sign in / register with name + email.
// v1 has no password; this simply identifies the customer. See README roadmap.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email } = (body ?? {}) as { name?: string; email?: string };

  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!cleanName) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  const customer = await prisma.customer.upsert({
    where: { email: cleanEmail },
    update: { name: cleanName },
    create: { email: cleanEmail, name: cleanName },
  });

  await setCustomerCookie(customer.id);
  return NextResponse.json({ customer });
}

// DELETE /api/session — sign out.
export async function DELETE() {
  await clearCustomerCookie();
  return NextResponse.json({ ok: true });
}
