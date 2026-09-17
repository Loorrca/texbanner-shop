import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Brand } from "@/components/Brand";
import { ProductCard } from "@/components/ProductCard";
import { ProductPreview } from "@/components/ProductPreview";
import { getCategories } from "@/lib/catalog";
import { getDict, isLocale } from "@/lib/i18n";

const FEATURED = ["drapeau-pays", "guirlande-pays", "fanion-table", "banderole-texte", "oriflamme-drapeau", "beach-flag"];

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const categories = await getCategories();
  const all = categories.flatMap((c) => c.products);
  const featured = FEATURED.map((slug) => all.find((p) => p.slug === slug)).filter((p) => p !== undefined);

  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute -end-40 -top-40 h-[520px] w-[520px] rounded-full bg-brand/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-52 start-10 h-[420px] w-[420px] rounded-full bg-gold/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <div className="mb-6 hidden md:block">
              <Brand size="lg" />
            </div>
            <p className="gold-text mb-4 text-sm font-extrabold tracking-widest uppercase">{t.tagline}</p>
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">{t.hero.title}</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-300">{t.hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/${locale}#categories`} className="btn-primary">{t.hero.cta}</Link>
              <Link href={`/${locale}/produit/drapeau-pays`} className="btn-ghost text-gold-light">{t.hero.secondary}</Link>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-gold/40">
              <ProductPreview kind="pavillon" selections={{ country: "tn" }} className="block w-full" title="Drapeau de la Tunisie" />
            </div>
            <div className="absolute -bottom-6 -start-6 hidden w-44 overflow-hidden rounded-2xl shadow-xl ring-4 ring-ink sm:block">
              <ProductPreview kind="fanion-table" selections={{ country: "tn", model: "double", country2: "dz" }} className="block w-full" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {t.usp.map((u) => (
            <div key={u.t} className="flex gap-3">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-gold" />
              <div>
                <p className="font-bold">{u.t}</p>
                <p className="text-sm text-stone-500">{u.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-16">
        <h2 className="text-3xl font-extrabold">{t.categories}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => {
            const first = c.products[0];
            const name = locale === "ar" ? c.nameAr : c.nameFr;
            return (
              <Link key={c.id} href={`/${locale}/categorie/${c.slug}`} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-200 shadow-sm">
                {c.image ? (
                  <Image src={c.image} alt={name} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />
                ) : first?.preview ? (
                  <ProductPreview kind={first.preview} selections={{ country: "tn" }} className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="text-lg font-extrabold">{name}</p>
                  <p className="text-xs text-stone-300">{c.products.length} {locale === "ar" ? "منتجات" : "produits"}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-16">
        <h2 className="text-3xl font-extrabold">{t.featured}</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} locale={locale} />
          ))}
        </div>
      </section>

      <section id="atelier" className="mx-auto mt-20 grid max-w-7xl scroll-mt-24 items-center gap-10 px-4 md:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-lg">
          <Image src="/images/catalog/atelier-impression.webp" alt={t.about.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold">{t.about.title}</h2>
          <p className="mt-4 text-lg leading-relaxed text-stone-600">{t.about.body}</p>
        </div>
      </section>
    </>
  );
}
