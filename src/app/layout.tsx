import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Кафе «Виктория» — доставка еды",
  description:
    "Кафе «Виктория»: домашняя кухня с доставкой. Супы, салаты, горячие блюда, пицца, бургеры и десерты с доставкой на дом.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body className="flex min-h-screen flex-col font-sans">{children}</body>
    </html>
  );
}
