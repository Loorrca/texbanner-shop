import { count } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";
import { CategoryEditor } from "@/components/admin/CategoryEditor";

export default async function NewCategory() {
  const [{ n }] = await db.select({ n: count() }).from(schema.categories);
  return (
    <div className="space-y-4">
      <Link href="/admin/products" className="text-sm font-semibold text-stone-500 hover:text-ink">← Catalogue</Link>
      <h1 className="text-2xl font-extrabold">Nouvelle catégorie</h1>
      <CategoryEditor initial={{ slug: "", nameFr: "", nameAr: "", descFr: "", descAr: "", image: null, sort: n }} />
    </div>
  );
}
