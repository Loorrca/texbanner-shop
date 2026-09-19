import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";
import { getDict } from "@/lib/i18n";
import { formatTND } from "@/lib/money";

const QUOTE_STATUS_STYLE: Record<schema.QuoteStatus, string> = {
  NEW: "bg-amber-100 text-amber-800",
  ANSWERED: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-emerald-100 text-emerald-800",
  DECLINED: "bg-stone-200 text-stone-500",
};

export default async function AdminQuotes({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const valid = schema.quoteStatus.enumValues.includes(status as schema.QuoteStatus) ? (status as schema.QuoteStatus) : undefined;
  const quotes = await db.query.quotes.findMany({
    where: valid ? eq(schema.quotes.status, valid) : undefined,
    orderBy: desc(schema.quotes.createdAt),
    limit: 200,
    with: { items: true },
  });
  const labels = getDict("fr").quote.status;

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Demandes de devis</h1>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/quotes" className={`rounded-full px-3 py-1 font-semibold ring-1 ring-stone-300 ${!valid ? "bg-ink text-white" : "bg-white"}`}>Toutes</Link>
        {schema.quoteStatus.enumValues.map((s) => (
          <Link key={s} href={`/admin/quotes?status=${s}`} className={`rounded-full px-3 py-1 font-semibold ring-1 ring-stone-300 ${valid === s ? "bg-ink text-white" : "bg-white"}`}>
            {labels[s]}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-white ring-1 ring-stone-200">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-start text-xs uppercase text-stone-500">
            <tr>
              <th className="px-4 py-3 text-start">Référence</th>
              <th className="px-4 py-3 text-start">Client</th>
              <th className="px-4 py-3 text-start">Articles</th>
              <th className="px-4 py-3 text-end">Indicatif</th>
              <th className="px-4 py-3 text-start">Reçue</th>
              <th className="px-4 py-3 text-start">État</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {quotes.map((q) => {
              const pieces = q.items.reduce((n, i) => n + i.quantity, 0);
              return (
                <tr key={q.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/quotes/${q.id}`} className="font-mono font-bold text-brand hover:underline">{q.number}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{q.firstName} {q.lastName}</span>
                    {q.company && <span className="block text-xs text-stone-500">{q.company}</span>}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {q.items.length} réf. · {pieces} pièce{pieces > 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-3 text-end">{formatTND(q.indicativeTotal)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-stone-500">
                    {q.createdAt.toLocaleDateString("fr-TN", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "Africa/Tunis" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${QUOTE_STATUS_STYLE[q.status]}`}>{labels[q.status]}</span>
                  </td>
                </tr>
              );
            })}
            {!quotes.length && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-stone-500">Aucune demande pour l&apos;instant.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
