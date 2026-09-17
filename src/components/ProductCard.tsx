import Image from "next/image";
import Link from "next/link";
import { ProductPreview } from "./ProductPreview";
import { fromPrice } from "@/lib/catalog";
import { formatTND } from "@/lib/money";
import { defaultSelections } from "@/lib/options";
import { getDict, type Locale } from "@/lib/i18n";
import type { Product } from "@/db/schema";

export function ProductCard({ product: p, locale }: { product: Product; locale: Locale }) {
  const t = getDict(locale);
  const name = locale === "ar" ? p.nameAr : p.nameFr;
  return (
    <Link href={`/${locale}/produit/${p.slug}`} className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {p.preview ? (
          <ProductPreview kind={p.preview} selections={defaultSelections(p.options)} className="h-full w-full transition duration-500 group-hover:scale-[1.03]" title={name} />
        ) : p.images[0] ? (
          <Image src={p.images[0]} alt={name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-bold leading-snug">{name}</h3>
        <p className="line-clamp-2 text-sm text-stone-500">{locale === "ar" ? p.descAr : p.descFr}</p>
        <div className="mt-auto flex items-end justify-between pt-3">
          <span className="text-sm text-stone-500">
            {t.from} <strong className="text-base text-ink">{formatTND(fromPrice(p), locale)}</strong>
          </span>
          <span className="text-sm font-bold text-brand group-hover:underline">{t.viewProduct} →</span>
        </div>
      </div>
    </Link>
  );
}
