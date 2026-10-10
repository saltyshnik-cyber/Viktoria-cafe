import { getSiteSettings } from "@/lib/siteSettings";
import CheckoutForm from "@/components/CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const settings = await getSiteSettings();

  return <CheckoutForm cafeAddress={settings.address} cafePhone={settings.phone} />;
}
