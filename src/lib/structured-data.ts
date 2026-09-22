import { appUrl, SHOP } from "./config";
import type { Locale } from "./i18n";
import type { schema } from "@/db";

/** Absolute URL, which schema.org requires even where the page uses a relative one. */
const abs = (path: string) => (path.startsWith("http") ? path : `${appUrl()}${path}`);

/**
 * The shop itself. Feeds Google's knowledge of the business — the same information as the
 * Google Business Profile, which is the other half of local search.
 * Opening hours are only emitted once filled in (SHOP.hours), never guessed.
 */
export function localBusinessJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${appUrl()}/#business`,
    name: SHOP.name,
    legalName: SHOP.legalName,
    url: `${appUrl()}/${locale}`,
    image: abs("/images/logo-texbanner.webp"),
    logo: abs("/images/logo-texbanner.webp"),
    telephone: "+21671576701",
    email: SHOP.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: SHOP.street,
      addressLocality: SHOP.locality,
      postalCode: SHOP.postalCode,
      addressCountry: SHOP.country,
    },
    ...(SHOP.hours.length ? { openingHours: SHOP.hours } : {}),
    sameAs: [SHOP.facebook],
    currenciesAccepted: "TND",
    areaServed: { "@type": "Country", name: "Tunisie" },
  };
}

export function productJsonLd(
  p: schema.Product & { category: schema.Category },
  locale: Locale,
  fromPrice: number,
) {
  const name = locale === "ar" ? p.nameAr : p.nameFr;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: locale === "ar" ? p.descAr : p.descFr,
    sku: p.slug,
    ...(p.images.length ? { image: p.images.map(abs) } : {}),
    brand: { "@type": "Brand", name: SHOP.name },
    category: locale === "ar" ? p.category.nameAr : p.category.nameFr,
    offers: {
      "@type": "Offer",
      url: `${appUrl()}/${locale}/produit/${p.slug}`,
      priceCurrency: "TND",
      // "À partir de" price, matching what the catalogue shows; millimes → dinars.
      price: (fromPrice / 1000).toFixed(3),
      availability: "https://schema.org/InStock",
      seller: { "@id": `${appUrl()}/#business` },
    },
  };
}

export function breadcrumbJsonLd(locale: Locale, trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${appUrl()}/${locale}${t.path}`,
    })),
  };
}
