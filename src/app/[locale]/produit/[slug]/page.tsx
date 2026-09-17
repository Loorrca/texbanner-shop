import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Customizer } from "@/components/product/Customizer";
import { getProduct } from "@/lib/catalog";
import { getCustomFlags } from "@/lib/emblems";
import { getDict, isLocale } from "@/lib/i18n";

type P = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  return {
    title: locale === "ar" ? p.nameAr : p.nameFr,
    description: locale === "ar" ? p.descAr : p.descFr,
    openGraph: p.images[0] ? { images: [p.images[0]] } : undefined,
  };
}

export default async function ProductPage({ params }: P) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const [product, customFlags] = await Promise.all([getProduct(slug), getCustomFlags()]);
  if (!product) notFound();
  const t = getDict(locale);
  const isFlag = !!product.preview && !product.preview.startsWith("beach");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="text-sm text-stone-500">
        <Link href={`/${locale}`} className="hover:text-brand">{t.nav.shop}</Link> /{" "}
        <Link href={`/${locale}/categorie/${product.category.slug}`} className="hover:text-brand">
          {locale === "ar" ? product.category.nameAr : product.category.nameFr}
        </Link>
      </nav>
      <div className="mb-8 mt-3 max-w-3xl">
        <h1 className="text-3xl font-extrabold md:text-4xl">{locale === "ar" ? product.nameAr : product.nameFr}</h1>
        <p className="mt-3 text-lg text-stone-600">{locale === "ar" ? product.descAr : product.descFr}</p>
        {isFlag && <p className="mt-2 text-sm font-semibold text-stone-500">{t.product.material}</p>}
      </div>
      <Customizer
        locale={locale}
        product={{ slug: product.slug, nameFr: product.nameFr, nameAr: product.nameAr, preview: product.preview, images: product.images, basePrice: product.basePrice, options: product.options }}
        t={{ ...t.product, cart: t.cart.title }}
        customFlags={customFlags}
      />
    </div>
  );
}
