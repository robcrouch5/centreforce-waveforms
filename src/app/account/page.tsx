import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/session";
import { AccountView } from "@/components/AccountView";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const customer = await getCurrentCustomer();

  let orderCount = 0;
  if (customer) {
    orderCount = await prisma.order.count({ where: { customerId: customer.id } });
  }

  return (
    <AccountView
      initialCustomer={
        customer ? { name: customer.name, email: customer.email } : null
      }
      orderCount={orderCount}
    />
  );
}
