import { getAllOrders } from "@/lib/orders";
import { getSiteSettings } from "@/lib/siteSettings";
import AdminOrdersView from "@/components/admin/AdminOrdersView";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const [orders, settings] = await Promise.all([getAllOrders(), getSiteSettings()]);
  const cafeName = `Кафе «${settings.heroTitle}»`;

  return (
    <AdminOrdersView
      initialOrders={orders}
      cafeName={cafeName}
      cafeAddress={settings.address}
      cafePhone={settings.phone}
    />
  );
}
