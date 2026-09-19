import Link from "next/link";
import { notFound } from "next/navigation";
import { SHOP } from "@/lib/config";
import { getDict, isLocale } from "@/lib/i18n";
import { formatTND } from "@/lib/money";
import { getQuoteByToken } from "@/lib/quotes";

export const metadata = { title: "Devis", robots: { index: false, follow: false } };

export default async function QuoteConfirmation({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();
  const quote = await getQuoteByToken(token);
  if (!quote) notFound();
  const t = getDict(locale);
  const q = t.quote;
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-TN" : "fr-TN", { dateStyle: "long" }).format(quote.createdAt);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-extrabold">{q.thanksTitle}</h1>
        <p className="mt-3 text-stone-600">{q.thanks}</p>
        <p className="mt-5 text-sm text-stone-500">
          {q.reference} <span className="font-mono font-bold text-ink" dir="ltr">{quote.number}</span>
          <span className="mx-2">·</span>
          {q.requestedOn} {date}
        </p>
      </div>

      <section className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-stone-200">
        <h2 className="font-extrabold">{q.items}</h2>
        <ul className="mt-4 divide-y divide-stone-100">
          {quote.items.map((item) => (
            <li key={item.id} className="py-3">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-semibold">
                  {item.productName} <span className="text-stone-500">× {item.quantity}</span>
                </span>
                <span className="text-sm text-stone-500">{formatTND(item.unitPrice * item.quantity, locale)}</span>
              </div>
              <ul className="mt-1 text-xs leading-5 text-stone-500">
                {item.selections
                  .filter((s) => s.type !== "upload")
                  .map((s) => (
                    <li key={s.key}>
                      <span className="font-semibold">{s.label}:</span> <span dir="auto">{s.valueLabel}</span>
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-stone-100 pt-3 text-xs text-stone-500">{q.indicativeNote}</p>
      </section>

      <p className="mt-6 text-center text-sm text-stone-600">
        {q.contactUs}{" "}
        <a href="tel:+21671576701" className="font-bold text-brand hover:underline" dir="ltr">{SHOP.phone}</a>
        <span className="mx-1">·</span>
        <a href="tel:+21698619811" className="font-bold text-brand hover:underline" dir="ltr">{SHOP.mobile}</a>
      </p>
      <p className="mt-6 text-center">
        <Link href={`/${locale}`} className="btn-ghost">{t.cart.continue}</Link>
      </p>
    </div>
  );
}
