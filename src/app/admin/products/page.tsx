/* eslint-disable @next/next/no-img-element -- small admin thumbnails */
import { asc, count } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";
import { ProductPreview } from "@/components/ProductPreview";
import { fromPrice } from "@/lib/catalog";
import { formatTND } from "@/lib/money";
import { defaultSelections } from "@/lib/options";

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const categories = await db.query.categories.findMany({
    orderBy: [asc(schema.categories.sort), asc(schema.categories.nameFr)],
    with: { products: { orderBy: [asc(schema.products.sort), asc(schema.products.nameFr)] } },
  });
  const current = categories.find((c) => c.slug === cat) ?? categories[0];
  const ordered = current
    ? await db.select({ productId: schema.orderItems.productId, n: count() }).from(schema.orderItems).groupBy(schema.orderItems.productId)
    : [];
  const orderCount = new Map(ordered.map((o) => [o.productId, o.n]));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Catalogue</h1>
          <p className="text-sm text-stone-500">Catégories, produits, photos, options et prix.</p>
        </div>
        <Link href="/admin/emblems" className="text-sm font-bold text-brand hover:underline">Drapeaux & emblèmes →</Link>
      </div>

      <nav className="mt-6 flex flex-wrap items-end gap-1 border-b border-stone-300" aria-label="Catégories">
        {categories.map((c) => {
          const on = c.id === current?.id;
          return (
            <Link key={c.id} href={`/admin/products?cat=${c.slug}`} className={`-mb-px rounded-t-lg border px-4 py-2 text-sm font-semibold ${on ? "border-stone-300 border-b-white bg-white text-ink" : "border-transparent text-stone-500 hover:text-ink"}`}>
              {c.nameFr} <span className="text-xs text-stone-400">{c.products.length}</span>
            </Link>
          );
        })}
        <Link href="/admin/categories/new" className="-mb-px ms-1 rounded-t-lg border border-dashed border-stone-300 px-3 py-2 text-sm font-bold text-brand hover:bg-white" title="Nouvelle catégorie">
          + Catégorie
        </Link>
      </nav>

      {current ? (
        <section className="rounded-b-xl rounded-tr-xl bg-white p-5 ring-1 ring-stone-300 ring-t-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              {current.image && <img src={current.image} alt="" className="h-14 w-20 rounded-md object-cover" />}
              <div>
                <h2 className="text-lg font-extrabold">{current.nameFr} <span className="font-normal text-stone-400" dir="rtl">· {current.nameAr}</span></h2>
                <Link href={`/admin/categories/${current.id}`} className="text-sm font-semibold text-stone-500 hover:text-ink">Modifier la catégorie</Link>
              </div>
            </div>
            <Link href={`/admin/products/new?category=${current.id}`} className="btn-primary py-2.5">+ Nouveau produit</Link>
          </div>

          <ul className="divide-y divide-stone-100">
            {current.products.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/products/${p.id}`} className="flex items-center gap-4 py-3 hover:bg-stone-50">
                  <span className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-stone-100 ring-1 ring-stone-200">
                    {p.preview ? (
                      <ProductPreview kind={p.preview} selections={defaultSelections(p.options)} className="h-full w-full" />
                    ) : p.images[0] ? (
                      <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate font-semibold ${p.active ? "" : "text-stone-400"}`}>{p.nameFr}</span>
                    <span className="block text-xs text-stone-500">
                      {p.options.length} option{p.options.length > 1 ? "s" : ""} · {p.images.length} photo{p.images.length > 1 ? "s" : ""}
                      {orderCount.get(p.id) ? ` · ${orderCount.get(p.id)} commande(s)` : ""}
                    </span>
                  </span>
                  {!p.active && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-bold text-stone-600">Masqué</span>}
                  <span className="text-sm whitespace-nowrap">dès <strong>{formatTND(fromPrice(p))}</strong></span>
                  <span className="text-stone-400">→</span>
                </Link>
              </li>
            ))}
            {!current.products.length && <li className="py-10 text-center text-stone-500">Aucun produit dans cette catégorie.</li>}
          </ul>
        </section>
      ) : (
        <p className="rounded-xl bg-white p-10 text-center text-stone-500 ring-1 ring-stone-200">Aucune catégorie. Commencez par en créer une.</p>
      )}
    </div>
  );
}
