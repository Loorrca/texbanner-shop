import { notFound } from "next/navigation";
import { QuoteForm } from "@/components/cart/QuoteForm";
import { getDict, isLocale } from "@/lib/i18n";

export const metadata = { title: "Demander un devis", robots: { index: false } };

export default async function QuotePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">{t.quote.title}</h1>
      <p className="mb-8 mt-3 max-w-2xl text-lg text-stone-600">{t.quote.intro}</p>
      <QuoteForm locale={locale} t={{ quote: t.quote, cart: t.cart, checkout: t.checkout }} />
    </div>
  );
}
