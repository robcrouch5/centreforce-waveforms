import { getActiveShop } from "@/lib/shop";
import { getCurrentCustomer } from "@/lib/session";
import { CheckoutView } from "@/components/CheckoutView";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const shop = await getActiveShop();
  const customer = await getCurrentCustomer();

  return (
    <CheckoutView
      currency={shop.currency}
      shopName={shop.name}
      initialCustomer={
        customer ? { name: customer.name, email: customer.email } : null
      }
    />
  );
}
