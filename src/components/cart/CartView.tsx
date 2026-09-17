"use client";

import Link from "next/link";
import { formatTND } from "@/lib/money";
import { useCart } from "./CartProvider";
import { LineThumb } from "./LineThumb";
import { useQuote } from "./useQuote";

type T = { title: string; empty: string; continue: string; subtotal: string; shipping: string; free: string; total: string; checkout: string; remove: string; freeFrom: string; unavailable: string };

export function CartView({ locale, t, freeFrom }: { locale: string; t: T; freeFrom: number }) {
  const { lines, ready, setQuantity, remove } = useCart();
  const { quote, loading } = useQuote(lines, ready, locale);

  if (!ready) return <div className="h-64 animate-pulse rounded-2xl bg-stone-100" />;
  if (!lines.length)
    return (
      <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-stone-200">
        <p className="text-lg text-stone-600">{t.empty}</p>
        <Link href={`/${locale}`} className="btn-primary mt-6">{t.continue}</Link>
      </div>
    );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <ul className="divide-y divide-stone-200 rounded-2xl bg-white ring-1 ring-stone-200">
        {lines.map((line, i) => {
          const q = quote?.lines.find((l) => l.index === i);
          const invalid = quote?.invalid.includes(i);
          const uploads = Object.values(line.uploadNames ?? {});
          return (
            <li key={line.lineId} className="flex gap-4 p-4">
              <LineThumb line={line} />
              <div className="min-w-0 flex-1">
                <Link href={`/${locale}/produit/${line.slug}`} className="font-bold hover:text-brand">{locale === "ar" ? line.nameAr : line.nameFr}</Link>
                <ul className="mt-1 text-xs leading-5 text-stone-500">
                  {q?.resolved.map((r) => (
                    <li key={r.label}><span className="font-semibold">{r.label}:</span> <span dir="auto">{r.valueLabel}</span></li>
                  ))}
                  {uploads.map((u) => (
                    <li key={u}>📎 {u}</li>
                  ))}
                </ul>
                {invalid && <p className="mt-1 text-xs font-bold text-brand">{t.unavailable}</p>}
                <div className="mt-3 flex items-center gap-4">
                  <input type="number" min={1} max={500} value={line.quantity} onChange={(e) => setQuantity(line.lineId, Number(e.target.value))} className="field w-20 py-1.5" aria-label="Quantité" />
                  <button type="button" onClick={() => remove(line.lineId)} className="text-sm font-semibold text-stone-500 hover:text-brand">{t.remove}</button>
                </div>
              </div>
              <div className="text-end font-bold">{formatTND(q?.lineTotal ?? line.unitPrice * line.quantity, locale)}</div>
            </li>
          );
        })}
      </ul>
      <aside className="h-fit rounded-2xl bg-white p-5 ring-1 ring-stone-200 lg:sticky lg:top-24">
        <Totals quote={quote} loading={loading} locale={locale} t={t} />
        {quote && quote.shipping > 0 && (
          <p className="mt-3 text-xs text-stone-500">{t.freeFrom} {formatTND(freeFrom, locale)}</p>
        )}
        <Link href={`/${locale}/commande`} aria-disabled={!quote || quote.invalid.length > 0} className={`btn-primary mt-5 w-full ${!quote || quote.invalid.length ? "pointer-events-none opacity-50" : ""}`}>
          {t.checkout}
        </Link>
      </aside>
    </div>
  );
}

export function Totals({ quote, loading, locale, t }: { quote: { subtotal: number; shipping: number; total: number } | null; loading: boolean; locale: string; t: { subtotal: string; shipping: string; free: string; total: string } }) {
  return (
    <dl className={`space-y-2 text-sm ${loading ? "opacity-60" : ""}`}>
      <div className="flex justify-between"><dt>{t.subtotal}</dt><dd>{quote ? formatTND(quote.subtotal, locale) : "—"}</dd></div>
      <div className="flex justify-between"><dt>{t.shipping}</dt><dd>{quote ? (quote.shipping ? formatTND(quote.shipping, locale) : t.free) : "—"}</dd></div>
      <div className="flex justify-between border-t border-stone-200 pt-3 text-lg font-extrabold"><dt>{t.total}</dt><dd>{quote ? formatTND(quote.total, locale) : "—"}</dd></div>
    </dl>
  );
}
