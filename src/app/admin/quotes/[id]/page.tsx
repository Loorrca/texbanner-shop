import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { updateQuoteStatus } from "../../actions";
import { flagSrc } from "@/lib/countries";
import { GOVERNORATES } from "@/lib/governorates";
import { getDict } from "@/lib/i18n";
import { formatTND } from "@/lib/money";

export default async function AdminQuote({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const quote = await db.query.quotes.findFirst({
    where: eq(schema.quotes.id, id),
    with: { items: { with: { uploads: true } } },
  });
  if (!quote) notFound();
  const labels = getDict("fr").quote.status;
  const gov = GOVERNORATES.find((g) => g.code === quote.governorate);
  const pieces = quote.items.reduce((n, i) => n + i.quantity, 0);
  const mailSubject = encodeURIComponent(`Votre devis ${quote.number} — Tex Banner`);

  return (
    <div className="space-y-6">
      <Link href="/admin/quotes" className="text-sm font-semibold text-stone-500 hover:text-ink">← Demandes de devis</Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-extrabold">{quote.number}</h1>
          <p className="text-sm text-stone-500">
            {quote.createdAt.toLocaleString("fr-TN", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Tunis" })}
            {quote.answeredAt && ` · répondu le ${quote.answeredAt.toLocaleString("fr-TN", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Tunis" })}`}
          </p>
        </div>
        <form action={updateQuoteStatus} className="flex items-center gap-2">
          <input type="hidden" name="id" value={quote.id} />
          <select key={quote.status} name="status" defaultValue={quote.status} className="field w-auto">
            {schema.quoteStatus.enumValues.map((s) => (
              <option key={s} value={s}>{labels[s]}</option>
            ))}
          </select>
          <button className="btn-primary whitespace-nowrap py-2.5">Mettre à jour</button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl bg-white p-5 ring-1 ring-stone-200">
          <h2 className="mb-3 font-extrabold">Articles demandés <span className="font-normal text-stone-500">· {pieces} pièce{pieces > 1 ? "s" : ""}</span></h2>
          <ul className="divide-y divide-stone-100">
            {quote.items.map((item) => (
              <li key={item.id} className="py-4">
                <div className="flex justify-between gap-4">
                  <p className="text-lg font-bold">{item.productName} <span className="text-brand">× {item.quantity}</span></p>
                  <p className="text-sm text-stone-500">{formatTND(item.unitPrice * item.quantity)}</p>
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
          <div className="mt-4 border-t border-stone-200 pt-4 text-sm">
            <div className="flex justify-between font-semibold">
              <span>Total au tarif catalogue</span>
              <span>{formatTND(quote.indicativeTotal)}</span>
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Montant indicatif, calculé aux prix de la boutique. Le prix du devis est à fixer par vos soins.
            </p>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl bg-white p-5 text-sm leading-6 ring-1 ring-stone-200">
            <h2 className="mb-2 font-extrabold">Client</h2>
            <p className="font-semibold">{quote.firstName} {quote.lastName}</p>
            {quote.company && <p className="text-stone-600">{quote.company}</p>}
            <p><a className="text-brand" href={`tel:${quote.phone}`} dir="ltr">{quote.phone}</a></p>
            <p><a className="text-brand" href={`mailto:${quote.email}?subject=${mailSubject}`}>{quote.email}</a></p>
            {(quote.city || gov) && (
              <>
                <h2 className="mb-2 mt-4 font-extrabold">Livraison</h2>
                <p>{[quote.city, gov?.fr ?? quote.governorate].filter(Boolean).join(", ")}</p>
              </>
            )}
            {quote.deadline && (
              <>
                <h2 className="mb-2 mt-4 font-extrabold">Délai souhaité</h2>
                <p className="whitespace-pre-wrap" dir="auto">{quote.deadline}</p>
              </>
            )}
            {quote.message && (
              <>
                <h2 className="mb-2 mt-4 font-extrabold">Message</h2>
                <p className="whitespace-pre-wrap" dir="auto">{quote.message}</p>
              </>
            )}
          </div>
          <a href={`mailto:${quote.email}?subject=${mailSubject}`} className="btn-primary w-full py-2.5">Répondre par e-mail</a>
        </aside>
      </div>
    </div>
  );
}
