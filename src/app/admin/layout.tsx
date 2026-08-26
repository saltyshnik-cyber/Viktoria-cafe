import AdminNav from "@/components/admin/AdminNav";

export const metadata = {
  title: "Админка — Кафе «Виктория»",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream">
      <AdminNav />
      {children}
    </div>
  );
}
