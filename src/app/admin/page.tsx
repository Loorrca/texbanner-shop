import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";
import { formatTND } from "@/lib/money";
import { getDict } from "@/lib/i18n";

const STATUS_STYLE: Record<schema.OrderStatus, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  PAYMENT_FAILED: "bg-red-100 text-red-800",
  IN_PRODUCTION: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-violet-100 text-violet-800",
  DELIVERED: "bg-stone-200 text-stone-700",
  CANCELLED: "bg-stone-200 text-stone-500 line-through",
};

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const valid = schema.orderStatus.enumValues.includes(status as schema.OrderStatus) ? (status as schema.OrderStatus) : undefined;
  const orders = await db.query.orders.findMany({
    where: valid ? eq(schema.orders.status, valid) : undefined,
    orderBy: desc(schema.orders.createdAt),
    limit: 200,
    with: { items: true },
  });
  const labels = getDict("fr").order.status;

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Commandes</h1>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link href="/admin" className={`rounded-full px-3 py-1 font-semibold ring-1 ring-stone-300 ${!valid ? "bg-ink text-white" : "bg-white"}`}>Toutes</Link>
        {schema.orderStatus.enumValues.map((s) => (
          <Link key={s} href={`/admin?status=${s}`} className={`rounded-full px-3 py-1 font-semibold ring-1 ring-stone-300 ${valid === s ? "bg-ink text-white" : "bg-white"}`}>{labels[s]}</Link>
        ))}
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl bg-white ring-1 ring-stone-200">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-start text-xs uppercase text-stone-500">
            <tr>
              <th className="px-4 py-3 text-start">N°</th>
              <th className="px-4 py-3 text-start">Date</th>
              <th className="px-4 py-3 text-start">Client</th>
              <th className="px-4 py-3 text-start">Articles</th>
              <th className="px-4 py-3 text-end">Total</th>
              <th className="px-4 py-3 text-start">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-stone-50">
                <td className="px-4 py-3 font-mono font-bold"><Link href={`/admin/orders/${o.id}`} className="text-brand hover:underline">{o.number}</Link></td>
                <td className="px-4 py-3 whitespace-nowrap">{o.createdAt.toLocaleString("fr-TN", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Tunis" })}</td>
                <td className="px-4 py-3">{o.firstName} {o.lastName}<br /><span className="text-xs text-stone-500">{o.phone}</span></td>
                <td className="px-4 py-3">{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                <td className="px-4 py-3 text-end font-semibold whitespace-nowrap">{formatTND(o.total)}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[o.status]}`}>{labels[o.status]}</span></td>
              </tr>
            ))}
            {!orders.length && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-stone-500">Aucune commande.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
