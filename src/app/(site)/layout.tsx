import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SitePopup from "@/components/SitePopup";
import { CartProvider } from "@/context/CartContext";
import { getSiteSettings } from "@/lib/siteSettings";
import { formatWorkingHoursLines } from "@/lib/businessHours";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  return (
    <CartProvider>
      <Header phone={settings.phone} />
      <main className="flex-1">{children}</main>
      <Footer
        phone={settings.phone}
        address={settings.address}
        hoursLines={formatWorkingHoursLines(settings.workingHours)}
        deliveryThreshold={settings.deliveryThreshold}
      />
      <SitePopup
        enabled={settings.popupEnabled}
        title={settings.popupTitle}
        text={settings.popupText}
        imageUrl={settings.popupImageUrl}
      />
    </CartProvider>
  );
}