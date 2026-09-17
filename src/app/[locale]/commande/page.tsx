import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { getDict, isLocale } from "@/lib/i18n";

export const metadata = { title: "Commande", robots: { index: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-extrabold">{t.checkout.title}</h1>
      <CheckoutForm locale={locale} t={{ checkout: t.checkout, cart: t.cart }} />
    </div>
  );
}
