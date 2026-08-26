import { getSiteSettings } from "@/lib/siteSettings";
import AdminNav from "@/components/admin/AdminNav";
import DeliveryForm from "@/components/admin/DeliveryForm";

export const dynamic = "force-dynamic";

export default async function AdminDeliveryPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <AdminNav />
      <h1 className="mt-6 text-2xl font-bold text-ink">Настройки доставки</h1>
      <p className="mt-1 text-sm text-ink/60">
        Зон доставки с разными ценами на сайте пока нет — только общий порог и стоимость.
      </p>
      <DeliveryForm
        initial={{
          deliveryThreshold: settings.deliveryThreshold,
          deliveryCost: settings.deliveryCost,
        }}
      />
    </div>
  );
}
