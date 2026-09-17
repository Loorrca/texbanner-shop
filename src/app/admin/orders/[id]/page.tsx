import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { recheckPayment, updateOrderStatus } from "../../actions";
import { flagSrc } from "@/lib/countries";
import { GOVERNORATES } from "@/lib/governorates";
import { getDict } from "@/lib/i18n";
import { formatTND } from "@/lib/money";

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.id, id),
    with: { items: { with: { uploads: true } } },
  });
  if (!order) notFound();
  const labels = getDict("fr").order.status;
  const gov = GOVERNORATES.find((g) => g.code === order.governorate);

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm font-semibold text-stone-500 hover:text-ink">← Commandes</Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-extrabold">{order.number}</h1>
          <p className="text-sm text-stone-500">
            {order.createdAt.toLocaleString("fr-TN", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Tunis" })}
            {order.paidAt && ` · payée le ${order.paidAt.toLocaleString("fr-TN", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Tunis" })}`}
          </p>
        </div>
        <form action={updateOrderStatus} className="flex items-center gap-2">
          <input type="hidden" name="id" value={order.id} />
          <select key={order.status} name="status" defaultValue={order.status} className="field w-auto">
            {schema.orderStatus.enumValues.map((s) => (
              <option key={s} value={s}>{labels[s]}</option>
            ))}
          </select>
          <button className="btn-primary whitespace-nowrap py-2.5">Mettre à jour</button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl bg-white p-5 ring-1 ring-stone-200">
          <h2 className="mb-3 font-extrabold">Articles à fabriquer</h2>
          <ul className="divide-y divide-stone-100">
            {order.items.map((item) => (
              <li key={item.id} className="py-4">
                <div className="flex justify-between gap-4">
                  <p className="text-lg font-bold">{item.productName} <span className="text-brand">× {item.quantity}</span></p>
                  <p className="font-semibold">{formatTND(item.unitPrice * item.quantity)}</p>
                </div>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  {item.selections.filter((s) => s.type !== "upload").map((s) => (
                    <div key={s.key} className="contents">
                      <dt className="text-stone-500">{s.label}</dt>
                      <dd className="font-semibold whitespace-pre-wrap" dir="auto">
                        {s.type === "country" && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={flagSrc(s.value)} alt="" className="me-2 inline h-4 w-6 rounded-sm align-[-2px] ring-1 ring-black/10" />
                        )}
                        {s.valueLabel}
                      </dd>
                    </div>
                  ))}
                </dl>
                {item.uploads.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.uploads.map((u) => (
                      <a key={u.id} href={`/admin/uploads/${u.id}`} className="inline-flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-2 text-sm font-semibold hover:bg-stone-200">
                        📎 {u.originalName} <span className="text-xs text-stone-500">({Math.ceil(u.size / 1024)} Ko)</span>
                      </a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-stone-200 pt-4 text-sm">
            <div className="flex justify-between"><dt>Sous-total</dt><dd>{formatTND(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Livraison</dt><dd>{formatTND(order.shipping)}</dd></div>
            <div className="flex justify-between text-lg font-extrabold"><dt>Total</dt><dd>{formatTND(order.total)}</dd></div>
          </dl>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl bg-white p-5 text-sm leading-6 ring-1 ring-stone-200">
            <h2 className="mb-2 font-extrabold">Client</h2>
            <p className="font-semibold">{order.firstName} {order.lastName}</p>
            <p><a className="text-brand" href={`tel:${order.phone}`}>{order.phone}</a></p>
            <p><a className="text-brand" href={`mailto:${order.email}`}>{order.email}</a></p>
            <h2 className="mb-2 mt-4 font-extrabold">Livraison</h2>
            <p>{order.address}</p>
            <p>{order.postalCode} {order.city}</p>
            <p>{gov?.fr ?? order.governorate}</p>
            {order.notes && (
              <>
                <h2 className="mb-2 mt-4 font-extrabold">Remarques</h2>
                <p className="whitespace-pre-wrap" dir="auto">{order.notes}</p>
              </>
            )}
          </div>
          <div className="rounded-xl bg-white p-5 text-sm ring-1 ring-stone-200">
            <h2 className="mb-2 font-extrabold">Paiement Konnect</h2>
            <p className="break-all font-mono text-xs text-stone-500">{order.konnectPaymentRef ?? "—"}</p>
            {order.konnectPaymentRef && (order.status === "PENDING_PAYMENT" || order.status === "PAYMENT_FAILED") && (
              <form action={recheckPayment} className="mt-3">
                <input type="hidden" name="id" value={order.id} />
                <button className="text-sm font-bold text-brand hover:underline">Revérifier le paiement</button>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
