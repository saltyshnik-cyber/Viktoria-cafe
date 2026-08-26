import { getSiteSettings } from "@/lib/siteSettings";
import CartView from "@/components/CartView";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const settings = await getSiteSettings();

  return (
    <CartView
      deliveryThreshold={settings.deliveryThreshold}
      deliveryCost={settings.deliveryCost}
    />
  );
}
