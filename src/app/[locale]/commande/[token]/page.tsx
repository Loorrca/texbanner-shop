import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { OrderAutoRefresh, RetryPayment } from "@/components/OrderLive";
import { GOVERNORATES } from "@/lib/governorates";
import { getDict, isLocale } from "@/lib/i18n";
import { formatTND } from "@/lib/money";
import { syncPayment } from "@/lib/payments";
import { SHOP } from "@/lib/config";

export const metadata = { title: "Commande", robots: { index: false, follow: false } };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ locale: string; token: string }>; searchParams: Promise<{ result?: string }> }) {
  const { locale, token } = await params;
  const { result } = await searchParams;
  if (!isLocale(locale) || !/^[A-Za-z0-9_-]{20,64}$/.test(token)) notFound();

  let order = await db.query.orders.findFirst({ where: eq(schema.orders.accessToken, token), with: { items: true } });
  if (!order) notFound();

  // Don't wait for the webhook: check the payment status with Konnect directly.
  if (order.konnectPaymentRef && (order.status === "PENDING_PAYMENT" || order.status === "PAYMENT_FAILED")) {
    try {
      const synced = await syncPayment(order.konnectPaymentRef);
      if (synced && synced.status !== order.status) order = { ...order, ...synced };
    } catch (e) {
      console.error("[order page] sync failed", order.number, e);
    }
  }

  const t = getDict(locale);
  const unpaid = order.status === "PENDING_PAYMENT" || order.status === "PAYMENT_FAILED";
  const failed = order.status === "PAYMENT_FAILED" || (unpaid && result === "fail");
  const gov = GOVERNORATES.find((g) => g.code === order.governorate);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <OrderAutoRefresh active={unpaid && !failed && result === "success"} />
      <div className={`rounded-2xl p-6 text-center ring-1 ${unpaid ? (failed ? "bg-red-50 ring-red-200" : "bg-amber-50 ring-amber-200") : "bg-emerald-50 ring-emerald-200"}`}>
        <p className="text-sm font-bold text-stone-500">{t.order.title} <span dir="ltr">{order.number}</span></p>
        <h1 className="mt-1 text-3xl font-extrabold">{unpaid ? (failed ? t.order.failed : t.order.status.PENDING_PAYMENT) : t.order.thanks}</h1>
        <p className="mt-3 text-stone-600">{unpaid ? (failed ? "" : t.order.pending) : t.order.paid}</p>
        {unpaid && (
          <div className="mt-5 flex justify-center">
            <RetryPayment token={token} label={failed ? t.order.retry : `${t.checkout.pay} ${formatTND(order.total, locale)}`} />
          </div>
        )}
        {!unpaid && (
          <span className="mt-4 inline-block rounded-full bg-white px-4 py-1.5 text-sm font-bold ring-1 ring-stone-200">
            {t.order.status[order.status]}
          </span>
        )}
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-stone-200">
        <ul className="divide-y divide-stone-100">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3">
              <div>
                <p className="font-bold">{item.productName} <span className="font-normal text-stone-500">× {item.quantity}</span></p>
                <ul className="text-xs leading-5 text-stone-500">
                  {item.selections.filter((s) => s.type !== "upload").map((s) => (
                    <li key={s.key}>{s.label}: <span dir="auto">{s.valueLabel}</span></li>
                  ))}
                  {item.selections.some((s) => s.type === "upload") && <li>📎 {locale === "ar" ? "ملف مرفق" : "Fichier joint"}</li>}
                </ul>
              </div>
              <span className="font-semibold">{formatTND(item.unitPrice * item.quantity, locale)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-stone-200 pt-4 text-sm">
          <div className="flex justify-between"><dt>{t.cart.subtotal}</dt><dd>{formatTND(order.subtotal, locale)}</dd></div>
          <div className="flex justify-between"><dt>{t.cart.shipping}</dt><dd>{order.shipping ? formatTND(order.shipping, locale) : t.cart.free}</dd></div>
          <div className="flex justify-between text-lg font-extrabold"><dt>{t.cart.total}</dt><dd>{formatTND(order.total, locale)}</dd></div>
        </dl>
        <div className="mt-6 border-t border-stone-200 pt-4 text-sm text-stone-600">
          <p className="font-bold text-ink">{t.checkout.delivery}</p>
          <p>{order.firstName} {order.lastName} · <span dir="ltr">{order.phone}</span></p>
          <p>{order.address}, {order.city} {order.postalCode} — {gov ? (locale === "ar" ? gov.ar : gov.fr) : order.governorate}</p>
        </div>
      </div>
      <p className="mt-6 text-center text-sm text-stone-500">
        {t.nav.contact}: <a href="tel:+21698619811" dir="ltr" className="font-semibold">{SHOP.mobile}</a> · <a href={`mailto:${SHOP.email}`} className="font-semibold">{SHOP.email}</a>
      </p>
    </div>
  );
}
