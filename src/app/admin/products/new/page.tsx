import { asc } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { ProductEditor } from "@/components/admin/ProductEditor";

export default async function NewProduct({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const categories = await db.select({ id: schema.categories.id, nameFr: schema.categories.nameFr, slug: schema.categories.slug }).from(schema.categories).orderBy(asc(schema.categories.sort));
  if (!categories.length) redirect("/admin/categories/new");
  const cat = categories.find((c) => c.id === category) ?? categories[0];
  return (
    <div className="space-y-4">
      <Link href={`/admin/products?cat=${cat.slug}`} className="text-sm font-semibold text-stone-500 hover:text-ink">← {cat.nameFr}</Link>
      <h1 className="text-2xl font-extrabold">Nouveau produit</h1>
      <ProductEditor
        categories={categories}
        initial={{ categoryId: cat.id, slug: "", nameFr: "", nameAr: "", descFr: "", descAr: "", preview: null, images: [], basePrice: 0, options: [], active: true, sort: 0 }}
      />
    </div>
  );
}
