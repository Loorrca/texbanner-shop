import Link from "next/link";
import { EmblemEditor } from "@/components/admin/EmblemEditor";

export default function NewEmblem() {
  return (
    <div className="space-y-4">
      <Link href="/admin/emblems" className="text-sm font-semibold text-stone-500 hover:text-ink">← Drapeaux & emblèmes</Link>
      <h1 className="text-2xl font-extrabold">Nouvel emblème</h1>
      <EmblemEditor initial={{ slug: "", nameFr: "", nameAr: "", group: "organisation", image: null, active: true, sort: 0 }} />
    </div>
  );
}
