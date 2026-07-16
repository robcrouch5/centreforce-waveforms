import { getActiveShop } from "@/lib/shop";
import { CartView } from "@/components/CartView";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const shop = await getActiveShop();
  return <CartView currency={shop.currency} />;
}
