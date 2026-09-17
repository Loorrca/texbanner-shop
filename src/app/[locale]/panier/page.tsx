import { notFound } from "next/navigation";
import { CartView } from "@/components/cart/CartView";
import { SHOP } from "@/lib/config";
import { getDict, isLocale } from "@/lib/i18n";

export const metadata = { title: "Panier", robots: { index: false } };

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-extrabold">{t.cart.title}</h1>
      <CartView locale={locale} t={t.cart} freeFrom={SHOP.freeShippingFrom} />
    </div>
  );
}
