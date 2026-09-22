import type { MetadataRoute } from "next";
import { getCategories } from "@/lib/catalog";
import { appUrl } from "@/lib/config";
import { LOCALES } from "@/lib/i18n";

// The catalogue lives in the database, so the sitemap is built per request.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Every page worth indexing, in both languages, with the language alternates Google
 * uses to pair them. Cart, checkout, order and quote pages are private and left out
 * (they also carry robots: noindex).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  const categories = await getCategories();

  const entry = (path: string, lastModified: Date, priority: number, changeFrequency: "daily" | "weekly" | "monthly") =>
    LOCALES.map((locale) => ({
      url: `${base}/${locale}${path}`,
      lastModified,
      changeFrequency,
      priority,
      alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `${base}/${l}${path}`])) },
    }));

  const newest = (dates: Date[]) => dates.reduce((a, b) => (a > b ? a : b), new Date(0));
  const allProducts = categories.flatMap((c) => c.products);

  return [
    ...entry("", newest(allProducts.map((p) => p.updatedAt)), 1, "weekly"),
    ...categories.flatMap((c) => entry(`/categorie/${c.slug}`, newest(c.products.map((p) => p.updatedAt)), 0.8, "weekly")),
    ...allProducts.flatMap((p) => entry(`/produit/${p.slug}`, p.updatedAt, 0.7, "monthly")),
  ];
}
