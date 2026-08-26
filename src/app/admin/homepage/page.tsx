import { getSiteSettings } from "@/lib/siteSettings";
import { getReviews } from "@/lib/reviews";
import AdminNav from "@/components/admin/AdminNav";
import HomepageForm from "@/components/admin/HomepageForm";
import ReviewsManager from "@/components/admin/ReviewsManager";

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  const [settings, reviews] = await Promise.all([getSiteSettings(), getReviews()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <AdminNav />
      <h1 className="mt-6 text-2xl font-bold text-ink">Главная страница</h1>
      <p className="mt-1 text-sm text-ink/60">
        Заглавный блок, блок «О месте», «Атмосфера», рейтинг и отзывы гостей.
      </p>

      <HomepageForm
        initial={{
          heroTitle: settings.heroTitle,
          heroSubtitle: settings.heroSubtitle,
          heroImageUrl: settings.heroImageUrl,
          aboutText: settings.aboutText,
          atmosphereTitle: settings.atmosphereTitle,
          galleryImages: settings.galleryImages,
          ratingValue: settings.ratingValue,
          ratingCount: settings.ratingCount,
        }}
      />

      <div className="mt-8">
        <ReviewsManager initialReviews={reviews} />
      </div>
    </div>
  );
}
