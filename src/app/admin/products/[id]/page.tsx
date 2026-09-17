import { asc, count, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { ProductEditor } from "@/components/admin/ProductEditor";

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ copie?: string; cree?: string }> }) {
  const { id } = await params;
  const { copie, cree } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [p, categories, [{ n }]] = await Promise.all([
    db.query.products.findFirst({ where: eq(schema.products.id, id), with: { category: true } }),
    db.select({ id: schema.categories.id, nameFr: schema.categories.nameFr, slug: schema.categories.slug }).from(schema.categories).orderBy(asc(schema.categories.sort)),
    db.select({ n: count() }).from(schema.orderItems).where(eq(schema.orderItems.productId, id)),
  ]);
  if (!p) notFound();

  return (
    <div className="space-y-4">
      <Link href={`/admin/products?cat=${p.category.slug}`} className="text-sm font-semibold text-stone-500 hover:text-ink">← {p.category.nameFr}</Link>
      <h1 className="text-2xl font-extrabold">{p.nameFr}</h1>
      {cree && <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">Produit créé ✓</p>}
      <ProductEditor
        key={p.updatedAt.toISOString()}
        categories={categories}
        orderCount={n}
        justDuplicated={!!copie}
        initial={{
          id: p.id, categoryId: p.categoryId, slug: p.slug, nameFr: p.nameFr, nameAr: p.nameAr, descFr: p.descFr, descAr: p.descAr,
          preview: p.preview, images: p.images, basePrice: p.basePrice, options: p.options, active: p.active, sort: p.sort,
        }}
      />
    </div>
  );
}
