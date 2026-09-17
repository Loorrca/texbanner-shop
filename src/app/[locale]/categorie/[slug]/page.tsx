import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { getCategories, getCategory } from "@/lib/catalog";
import { getDict, isLocale } from "@/lib/i18n";

type P = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  const c = await getCategory(slug);
  if (!c) return {};
  return { title: locale === "ar" ? c.nameAr : c.nameFr, description: locale === "ar" ? c.descAr : c.descFr };
}

export default async function CategoryPage({ params }: P) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const [category, categories] = await Promise.all([getCategory(slug), getCategories()]);
  if (!category) notFound();
  const t = getDict(locale);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="text-sm text-stone-500">
        <Link href={`/${locale}`} className="hover:text-brand">{t.nav.shop}</Link> / <span className="text-ink">{locale === "ar" ? category.nameAr : category.nameFr}</span>
      </nav>
      <h1 className="mt-3 text-4xl font-extrabold">{locale === "ar" ? category.nameAr : category.nameFr}</h1>
      <p className="mt-2 max-w-2xl text-stone-600">{locale === "ar" ? category.descAr : category.descFr}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Link key={c.id} href={`/${locale}/categorie/${c.slug}`} className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 transition ${c.slug === slug ? "bg-ink text-white ring-ink" : "bg-white ring-stone-300 hover:ring-ink"}`}>
            {locale === "ar" ? c.nameAr : c.nameFr}
          </Link>
        ))}
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {category.products.map((p) => (
          <ProductCard key={p.id} product={p} locale={locale} />
        ))}
      </div>
    </div>
  );
}
