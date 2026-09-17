import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { CategoryEditor } from "@/components/admin/CategoryEditor";

export default async function EditCategory({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [c, [{ n }]] = await Promise.all([
    db.query.categories.findFirst({ where: eq(schema.categories.id, id) }),
    db.select({ n: count() }).from(schema.products).where(eq(schema.products.categoryId, id)),
  ]);
  if (!c) notFound();
  return (
    <div className="space-y-4">
      <Link href={`/admin/products?cat=${c.slug}`} className="text-sm font-semibold text-stone-500 hover:text-ink">← {c.nameFr}</Link>
      <h1 className="text-2xl font-extrabold">Modifier la catégorie</h1>
      <CategoryEditor key={c.slug + c.nameFr} productCount={n} initial={{ id: c.id, slug: c.slug, nameFr: c.nameFr, nameAr: c.nameAr, descFr: c.descFr, descAr: c.descAr, image: c.image, sort: c.sort }} />
    </div>
  );
}
