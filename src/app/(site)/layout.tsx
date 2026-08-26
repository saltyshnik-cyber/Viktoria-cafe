import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { getSiteSettings } from "@/lib/siteSettings";

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
        hours={settings.hours}
        deliveryThreshold={settings.deliveryThreshold}
      />
    </CartProvider>
  );
}
