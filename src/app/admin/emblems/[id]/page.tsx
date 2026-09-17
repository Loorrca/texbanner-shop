import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { EmblemEditor } from "@/components/admin/EmblemEditor";

export default async function EditEmblem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const e = await db.query.emblems.findFirst({ where: eq(schema.emblems.id, id) });
  if (!e) notFound();
  return (
    <div className="space-y-4">
      <Link href="/admin/emblems" className="text-sm font-semibold text-stone-500 hover:text-ink">← Drapeaux & emblèmes</Link>
      <h1 className="text-2xl font-extrabold">{e.nameFr}</h1>
      <EmblemEditor initial={{ id: e.id, slug: e.code.replace(/^x-/, ""), nameFr: e.nameFr, nameAr: e.nameAr, group: e.group, image: e.image, active: e.active, sort: e.sort }} />
    </div>
  );
}
