import { getSiteSettings } from "@/lib/siteSettings";
import ContactsForm from "@/components/admin/ContactsForm";

export const dynamic = "force-dynamic";

export default async function AdminContactsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink">Контакты и информация</h1>
      <p className="mt-1 text-sm text-ink/60">
        Показывается в шапке, подвале и на главной странице сайта.
      </p>
      <ContactsForm
        initial={{
          address: settings.address,
          hours: settings.hours,
          phone: settings.phone,
          phoneSecondary: settings.phoneSecondary,
          mapsUrl: settings.mapsUrl,
        }}
      />
    </div>
  );
}
