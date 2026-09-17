import Link from "next/link";
import { Suspense } from "react";
import { Brand } from "./Brand";
import { CartButton } from "./cart/CartButton";
import { LangSwitch } from "./LangSwitch";
import { getDict, type Locale } from "@/lib/i18n";
import { getCategories } from "@/lib/catalog";

export async function Header({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const categories = await getCategories();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2">
        <Link href={`/${locale}`} aria-label="Tex Banner">
          <Brand size="sm" priority />
        </Link>
        <nav className="ms-6 hidden items-center gap-5 text-sm font-semibold text-stone-300 lg:flex">
          {categories.slice(0, 6).map((c) => (
            <Link key={c.id} href={`/${locale}/categorie/${c.slug}`} className="transition hover:text-gold-light">
              {locale === "ar" ? c.nameAr : c.nameFr}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <Suspense>
            <LangSwitch locale={locale} label={t.lang} />
          </Suspense>
          <CartButton locale={locale} label={t.nav.cart} />
        </div>
      </div>
      <nav className="flex gap-4 overflow-x-auto border-t border-white/10 px-4 py-2 text-sm font-semibold text-stone-300 lg:hidden">
        {categories.map((c) => (
          <Link key={c.id} href={`/${locale}/categorie/${c.slug}`} className="shrink-0 hover:text-gold-light">
            {locale === "ar" ? c.nameAr : c.nameFr}
          </Link>
        ))}
      </nav>
    </header>
  );
}
